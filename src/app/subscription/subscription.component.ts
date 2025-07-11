import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, OnDestroy, OnInit, signal } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PlanLimitsDisplayComponent } from '../shared/components/plan-limits-display/plan-limits-display.component';
import { SubscriptionService } from './subscription.service';

interface SubscriptionHistoryItem {
  id: string;
  plan: string;
  status: 'active' | 'expired' | 'pending';
  startDate: string;
  expiryDate: string;
  amount: number;
  paymentId?: string;
}

interface PlanLimits {
  dailyBirds: number | 'unlimited';
  dailyCouples: number | 'unlimited';
  permanentBirds: number | 'unlimited';
  permanentCouples: number | 'unlimited';
}

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  description: string;
  highlight: boolean;
  discount: string | null;
  limits: PlanLimits;
  features: string[];
}

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, DatePipe, PlanLimitsDisplayComponent],
  templateUrl: './subscription.component.html',
  styleUrl: './subscription.component.css',
})
export class SubscriptionComponent implements OnInit, OnDestroy {
  private authSubscription?: Subscription;
  plans: Plan[] = [
    {
      id: 'free',
      name: 'Plan Gratuito',
      price: 0,
      currency: 'ARS',
      description: 'Funcionalidad básica con límites',
      highlight: false,
      discount: null,
      limits: {
        dailyBirds: 0,
        dailyCouples: 0,
        permanentBirds: 30,   // Cupo total de 30 canarios
        permanentCouples: 10  // Cupo total de 10 parejas
      },
      features: [
        'Hasta 30 canarios (cupo total)',
        'Hasta 10 parejas (cupo total)',
        'Solo visualización de registros',
        'Sin capacidad de edición',
        'Sin capacidad de eliminación'
      ]
    },
    {
      id: 'trial',
      name: 'Prueba 7 días',
      price: 0,
      currency: 'ARS',
      description: 'Prueba gratuita con privilegios premium',
      highlight: true,
      discount: 'GRATIS por 7 días',
      limits: {
        dailyBirds: 1500,
        dailyCouples: 200,
        permanentBirds: 1500,  // Igual al plan mensual
        permanentCouples: 200  // Igual al plan mensual
      },
      features: [
        'Hasta 1,500 canarios por mes',
        'Hasta 200 parejas por mes',
        'Edición y eliminación completa',
        'Soporte técnico prioritario',
        'Se activa automáticamente al registrarse',
        'Después de 7 días pasa a plan gratuito'
      ]
    },
    {
      id: 'monthly',
      name: 'Premium Mensual',
      price: 5000,
      currency: 'ARS',
      description: 'Acceso premium con límites mensuales',
      highlight: false,
      discount: null,
      limits: {
        dailyBirds: 1500,  // Para compatibilidad con código legacy
        dailyCouples: 200, // Para compatibilidad con código legacy
        permanentBirds: 1500,  // 1,500 canarios por mes (se reinicia mensualmente)
        permanentCouples: 200  // 200 parejas por mes (se reinicia mensualmente)
      },
      features: [
        'Hasta 1,500 canarios por mes',
        'Hasta 200 parejas por mes',
        'Límites se reinician mensualmente',
        'Edición y eliminación completa',
        'Soporte técnico prioritario'
      ]
    },
    {
      id: 'unlimited',
      name: 'Premium Ilimitado',
      price: 9000,
      currency: 'ARS',
      description: 'Acceso premium sin restricciones',
      highlight: false,
      discount: null,
      limits: {
        dailyBirds: 'unlimited',
        dailyCouples: 'unlimited',
        permanentBirds: 'unlimited',
        permanentCouples: 'unlimited'
      },
      features: [
        'Canarios ilimitados',
        'Parejas ilimitadas',
        'Edición y eliminación completa',
        'Renovación mensual',
        'Soporte técnico prioritario'
      ]
    }
  ];

  // Signals
  currentView = signal<'subscription' | 'history' | 'plans'>('subscription');
  subscriptionHistory = signal<SubscriptionHistoryItem[]>([]);

  // Computed properties
  daysLeft = computed(() => {
    const sub = this.subscriptionService.userSubscription();
    if (!sub || !sub.expiryDate) return null;
    const diff = Math.ceil(
      (new Date(sub.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return diff > 0 ? diff : 0;
  });

  constructor(
    public subscriptionService: SubscriptionService,
    private router: Router,
    private auth: Auth
  ) { }

  ngOnInit() {
    console.log('🔧 SubscriptionComponent: Inicializando componente');

    // MODO DEBUG: Simular suscripción activa para pruebas de UI
    // TODO: Remover esto cuando los emuladores funcionen
    const debugMode = false; // Cambiar a false para usar datos reales

    if (debugMode) {
      console.log('🐛 DEBUG MODE: Simulando suscripción mensual activa');
      const mockSubscription = {
        plan: 'monthly',
        startDate: new Date(Date.now() - (10 * 24 * 60 * 60 * 1000)).toISOString(),
        expiryDate: new Date(Date.now() + (20 * 24 * 60 * 60 * 1000)).toISOString(),
        status: 'active',
        paymentId: 'mock_payment_123',
        amount: 5000,
        createdAt: new Date().toISOString()
      };
      // Usar el signal privado del servicio para setear el mock
      (this.subscriptionService as any)._userSubscription.set(mockSubscription);
      this.currentView.set('subscription');

      // Simular historial
      const mockHistory = [
        {
          id: 'hist_1',
          plan: 'monthly',
          status: 'expired' as const,
          startDate: new Date(Date.now() - (40 * 24 * 60 * 60 * 1000)).toISOString(),
          expiryDate: new Date(Date.now() - (10 * 24 * 60 * 60 * 1000)).toISOString(),
          amount: 5000,
          paymentId: 'payment_old_1'
        }
      ];
      this.subscriptionHistory.set(mockHistory);

      return; // Salir temprano en modo debug
    }

    // Suscribirse a cambios de autenticación y refrescar la suscripción
    this.authSubscription = authState(this.auth).subscribe(user => {
      if (user) {
        this.subscriptionService.refreshUserSubscription();
        this.loadSubscriptionHistory();
      } else {
        this.currentView.set('plans');
        this.subscriptionHistory.set([]);
      }
    });
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
  }

  loadSubscriptionHistory() {
    this.subscriptionService.getSubscriptionHistory().subscribe({
      next: (history: SubscriptionHistoryItem[]) => {
        this.subscriptionHistory.set(history);
      },
      error: (error) => {
        this.subscriptionHistory.set([]);
      }
    });
  }

  subscribe(planId: string) {
    // No permitir suscripción al plan gratuito
    if (planId === 'free') {
      return;
    }

    this.subscriptionService.createCheckoutPreference(planId).subscribe({
      next: (url: string) => {
        window.location.href = url;
      },
      error: (error) => {
        console.error('Error creating subscription:', error);
        if (error.error?.needsConfiguration) {
          alert('⚠️ Sistema de pagos no configurado.\n\nNecesitas obtener credenciales reales de Mercado Pago.\nRevisa la guía GUIA_MERCADO_PAGO.md para más información.');
        } else {
          alert('Error al procesar la suscripción. Inténtalo nuevamente.');
        }
      }
    });
  }

  refreshSubscription() {
    this.subscriptionService.refreshUserSubscription();
    this.loadSubscriptionHistory();
  }

  // Métodos auxiliares para el template
  goBack() {
    // Navegar de vuelta a la sección principal de la app (birds)
    this.router.navigate(['/birds']);
  }

  getReadablePlanName(planId: string): string {
    const plan = this.plans.find(p => p.id === planId);
    return plan ? plan.name : planId;
  }

  getPlanPrice(planId: string): number {
    const plan = this.plans.find(p => p.id === planId);
    return plan ? plan.price : 0;
  }

  getPlanDuration(planId: string): string {
    const durations: { [key: string]: string } = {
      'free': 'Permanente',
      'trial': '7 días',
      'monthly': '1 mes',
      'unlimited': '1 mes'  // También es mensual, no anual
    };
    return durations[planId] || planId;
  }

  getCurrentPlanLimits() {
    const currentSub = this.subscriptionService.userSubscription();
    if (!currentSub) {
      // Retornar límites del plan gratuito por defecto
      return this.plans.find(p => p.id === 'free')?.limits || {
        dailyBirds: 0,
        dailyCouples: 0,
        permanentBirds: 30,    // Cupo total de 30 canarios
        permanentCouples: 10   // Cupo total de 10 parejas
      };
    }

    const currentPlan = this.plans.find(p => p.id === currentSub.plan);
    return currentPlan?.limits || {
      dailyBirds: 0,
      dailyCouples: 0,
      permanentBirds: 30,
      permanentCouples: 10
    };
  }

  getSubscriptionProgress(): number {
    const sub = this.subscriptionService.userSubscription();
    if (!sub || !sub.startDate || !sub.expiryDate) return 0;

    const start = new Date(sub.startDate).getTime();
    const end = new Date(sub.expiryDate).getTime();
    const now = Date.now();

    if (now <= start) return 0;
    if (now >= end) return 100;

    const progress = ((now - start) / (end - start)) * 100;
    return Math.round(progress);
  }
}

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
      description: 'Funcionalidad básica',
      highlight: false,
      discount: null,
      limits: {
        dailyBirds: 50,
        dailyCouples: 50,
        permanentBirds: 300,
        permanentCouples: 200
      },
      features: [
        '50 canarios por día',
        '50 parejas por día',
        'Hasta 300 canarios totales',
        'Hasta 200 parejas totales'
      ]
    },
    {
      id: 'monthly',
      name: 'Plan Mensual',
      price: 3000,
      currency: 'ARS',
      description: 'Acceso premium por 1 mes',
      highlight: false,
      discount: null,
      limits: {
        dailyBirds: 200,
        dailyCouples: 150,
        permanentBirds: 1500,
        permanentCouples: 1000
      },
      features: [
        '200 canarios por día',
        '150 parejas por día',
        'Hasta 1,500 canarios totales',
        'Hasta 1,000 parejas totales',
        'Soporte técnico'
      ]
    },
    {
      id: 'semiannual',
      name: 'Plan Semestral',
      price: 15300,
      currency: 'ARS',
      description: '6 meses de acceso premium',
      highlight: true, // Más popular
      discount: '15% descuento',
      limits: {
        dailyBirds: 'unlimited',
        dailyCouples: 'unlimited',
        permanentBirds: 5000,
        permanentCouples: 3000
      },
      features: [
        'Canarios ilimitados por día',
        'Parejas ilimitadas por día',
        'Hasta 5,000 canarios totales',
        'Hasta 3,000 parejas totales',
        'Soporte prioritario'
      ]
    },
    {
      id: 'annual',
      name: 'Plan Anual',
      price: 27000,
      currency: 'ARS',
      description: '12 meses de acceso premium',
      highlight: false,
      discount: '25% descuento',
      limits: {
        dailyBirds: 'unlimited',
        dailyCouples: 'unlimited',
        permanentBirds: 'unlimited',
        permanentCouples: 'unlimited'
      },
      features: [
        'Sin límites de ningún tipo',
        'Canarios ilimitados',
        'Parejas ilimitadas',
        'Soporte VIP'
      ]
    },
  ];

  // Signals
  userSubscription = signal<any | null>(null);
  currentView = signal<'subscription' | 'history' | 'plans'>('subscription');
  subscriptionHistory = signal<SubscriptionHistoryItem[]>([]);

  // Computed properties
  daysLeft = computed(() => {
    const sub = this.userSubscription();
    if (!sub || !sub.expiryDate) return null;
    const diff = Math.ceil(
      (new Date(sub.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return diff > 0 ? diff : 0;
  });

  constructor(
    private subscriptionService: SubscriptionService,
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
        startDate: new Date(Date.now() - (10 * 24 * 60 * 60 * 1000)).toISOString(), // 10 días atrás
        expiryDate: new Date(Date.now() + (20 * 24 * 60 * 60 * 1000)).toISOString(), // 20 días hacia el futuro
        status: 'active',
        paymentId: 'mock_payment_123',
        amount: 3000,
        createdAt: new Date().toISOString()
      };

      this.userSubscription.set(mockSubscription);
      this.currentView.set('subscription');

      // Simular historial
      const mockHistory = [
        {
          id: 'hist_1',
          plan: 'monthly',
          status: 'expired' as const,
          startDate: new Date(Date.now() - (40 * 24 * 60 * 60 * 1000)).toISOString(),
          expiryDate: new Date(Date.now() - (10 * 24 * 60 * 60 * 1000)).toISOString(),
          amount: 3000,
          paymentId: 'payment_old_1'
        }
      ];
      this.subscriptionHistory.set(mockHistory);

      return; // Salir temprano en modo debug
    }

    // Suscribirse a cambios de autenticación
    this.authSubscription = authState(this.auth).subscribe(user => {
      console.log('🔄 SubscriptionComponent: Cambio de usuario detectado:', user?.uid);
      if (user) {
        this.loadUserSubscription();
      } else {
        console.log('👋 SubscriptionComponent: Usuario deslogueado');
        this.userSubscription.set(null);
        this.currentView.set('plans');
      }
    });
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
  }

  loadUserSubscription() {
    console.log('🔄 SubscriptionComponent: Cargando suscripción del usuario');
    this.subscriptionService.getUserSubscription().subscribe({
      next: (sub: any) => {
        console.log('✅ SubscriptionComponent: Suscripción recibida:', sub);
        this.userSubscription.set(sub);

        // Si hay suscripción activa, mostrar la vista de suscripción
        if (sub) {
          console.log('📋 SubscriptionComponent: Usuario tiene suscripción, mostrando vista de suscripción');
          this.currentView.set('subscription');
          this.loadSubscriptionHistory();
        } else {
          console.log('📝 SubscriptionComponent: Usuario sin suscripción, mostrando planes');
          this.currentView.set('plans');
        }
      },
      error: (error) => {
        console.error('❌ SubscriptionComponent: Error loading subscription:', error);
        this.userSubscription.set(null);
        this.currentView.set('plans');
      }
    });
  }

  loadSubscriptionHistory() {
    this.subscriptionService.getSubscriptionHistory().subscribe({
      next: (history: SubscriptionHistoryItem[]) => {
        this.subscriptionHistory.set(history);
      },
      error: (error) => {
        console.error('Error loading subscription history:', error);
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
    console.log('🔄 SubscriptionComponent: Refrescando suscripción manualmente');
    this.loadUserSubscription();
  }

  // Métodos auxiliares para el template
  goBack() {
    // Navegar de vuelta al dashboard o página principal
    this.router.navigate(['/']);
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
      'monthly': '1 mes',
      'semiannual': '6 meses',
      'annual': '12 meses'
    };
    return durations[planId] || planId;
  }

  getCurrentPlanLimits() {
    const currentSub = this.userSubscription();
    if (!currentSub) {
      // Retornar límites del plan gratuito por defecto
      return this.plans.find(p => p.id === 'free')?.limits || {
        dailyBirds: 50,
        dailyCouples: 50,
        permanentBirds: 300,
        permanentCouples: 200
      };
    }

    const currentPlan = this.plans.find(p => p.id === currentSub.plan);
    return currentPlan?.limits || {
      dailyBirds: 50,
      dailyCouples: 50,
      permanentBirds: 300,
      permanentCouples: 200
    };
  }

  getSubscriptionProgress(): number {
    const sub = this.userSubscription();
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

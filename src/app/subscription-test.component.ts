import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PlanLimitsDisplayComponent } from './shared/components/plan-limits-display/plan-limits-display.component';

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
    selector: 'app-subscription-test',
    standalone: true,
    imports: [CommonModule, PlanLimitsDisplayComponent],
    template: `
    <div class="max-w-6xl mx-auto py-10 px-4">
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center space-x-4">
          <button (click)="goBack()"
            class="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            <span class="font-medium">Volver</span>
          </button>
          <h1 class="text-3xl font-bold text-gray-900">Test de Límites en Planes</h1>
        </div>
      </div>

      <!-- Vista de planes -->
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        @for (plan of plans; track plan.id) {
        <div class="relative bg-white rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl"
             [class]="plan.highlight ? 'border-indigo-200 ring-2 ring-indigo-100' : 'border-gray-200'">

          @if (plan.highlight) {
          <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full shadow">
            🎉 Más Popular
          </div>
          }

          @if (plan.id === 'free') {
          <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-500 text-white text-xs px-3 py-1 rounded-full shadow">
            Actual
          </div>
          }

          @if (plan.discount) {
          <div class="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow-md font-semibold">
            {{ plan.discount }}
          </div>
          }

          <div class="p-6">
            <div class="text-center mb-6">
              <h3 class="text-xl font-semibold mb-2">{{ plan.name }}</h3>
              @if (plan.id === 'free') {
              <div class="text-3xl font-bold text-gray-600 mb-2">Gratis</div>
              } @else {
              <div class="text-3xl font-bold text-indigo-600 mb-2">\${{ plan.price.toLocaleString() }} ARS</div>
              }
              <p class="text-gray-500 text-sm">{{ plan.description }}</p>
              @if (plan.discount) {
              <p class="text-green-600 text-sm font-medium mt-1">🎉 {{ plan.discount }}</p>
              }
            </div>

            <!-- Límites del plan -->
            <app-plan-limits-display [limits]="plan.limits" class="mb-4"></app-plan-limits-display>

            <!-- Características del plan -->
            <div class="flex-1 mb-6">
              <h4 class="text-sm font-semibold text-gray-700 mb-2">Características</h4>
              <ul class="space-y-2 text-sm">
                @for (feature of plan.features; track feature) {
                <li class="flex items-start">
                  <svg class="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"></path>
                  </svg>
                  <span>{{ feature }}</span>
                </li>
                }
              </ul>
            </div>

            <div class="text-center">
              @if (plan.id === 'free') {
              <div class="w-full py-3 px-4 rounded-lg font-semibold text-center bg-gray-100 text-gray-600">
                Plan Actual
              </div>
              } @else {
              <button
                class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg">
                Elegir {{ plan.name }}
              </button>
              }
            </div>
          </div>
        </div>
        }
      </div>
    </div>
  `
})
export class SubscriptionTestComponent {
    constructor(private router: Router) { }

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

    goBack() {
        this.router.navigate(['/birds']);
    }
}

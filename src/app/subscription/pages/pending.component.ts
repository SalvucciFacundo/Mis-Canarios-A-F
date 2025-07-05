import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-subscription-pending',
    standalone: true,
    template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div class="text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
              <svg class="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
              Pago Pendiente
            </h2>
            <p class="mt-2 text-sm text-gray-600">
              Tu pago está siendo procesado. Te notificaremos cuando se complete la transacción.
            </p>
          </div>

          <div class="mt-6">
            <button
              (click)="goToSubscriptions()"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500">
              Ver estado de suscripción
            </button>
          </div>

          <div class="mt-3">
            <button
              (click)="goHome()"
              class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500">
              Ir al inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SubscriptionPendingComponent {
    constructor(private router: Router) { }

    goToSubscriptions() {
        this.router.navigate(['/subscription']);
    }

    goHome() {
        this.router.navigate(['/']);
    }
}

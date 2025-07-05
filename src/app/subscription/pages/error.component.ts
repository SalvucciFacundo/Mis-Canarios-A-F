import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-subscription-error',
    standalone: true,
    template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div class="text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
              Error en el Pago
            </h2>
            <p class="mt-2 text-sm text-gray-600">
              Hubo un problema al procesar tu pago. Por favor, intenta nuevamente o contacta con soporte.
            </p>
          </div>

          <div class="mt-6">
            <button
              (click)="goToSubscriptions()"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
              Intentar nuevamente
            </button>
          </div>

          <div class="mt-3">
            <button
              (click)="goHome()"
              class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
              Ir al inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SubscriptionErrorComponent {
    constructor(private router: Router) { }

    goToSubscriptions() {
        this.router.navigate(['/subscription']);
    }

    goHome() {
        this.router.navigate(['/']);
    }
}

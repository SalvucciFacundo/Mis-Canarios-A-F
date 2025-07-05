import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
    selector: 'app-subscription-simple',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="container mx-auto p-8">
      <h1 class="text-3xl font-bold text-center mb-8">Planes de Suscripción</h1>

      <div class="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <!-- Plan Mensual -->
        <div class="bg-white rounded-lg shadow-lg p-6 border">
          <h3 class="text-xl font-semibold mb-4">Plan Mensual</h3>
          <div class="text-3xl font-bold text-blue-600 mb-4">$5</div>
          <p class="text-gray-600 mb-6">Acceso premium por 1 mes</p>
          <button class="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition">
            Suscribirme
          </button>
        </div>

        <!-- Plan Semestral -->
        <div class="bg-white rounded-lg shadow-lg p-6 border border-blue-500 relative">
          <div class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
            Más Popular
          </div>
          <h3 class="text-xl font-semibold mb-4">Plan Semestral</h3>
          <div class="text-3xl font-bold text-blue-600 mb-4">$25</div>
          <p class="text-gray-600 mb-6">6 meses de acceso premium</p>
          <button class="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition">
            Suscribirme
          </button>
        </div>

        <!-- Plan Anual -->
        <div class="bg-white rounded-lg shadow-lg p-6 border">
          <h3 class="text-xl font-semibold mb-4">Plan Anual</h3>
          <div class="text-3xl font-bold text-blue-600 mb-4">$45</div>
          <p class="text-gray-600 mb-6">12 meses de acceso premium</p>
          <button class="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition">
            Suscribirme
          </button>
        </div>
      </div>
    </div>
  `
})
export class SubscriptionSimpleComponent { }

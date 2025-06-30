import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact',
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Contáctanos</h1>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-gray-600 mb-4">¿Tienes alguna pregunta o sugerencia sobre la aplicación?</p>
        <div class="space-y-4">
          <div class="flex items-center space-x-3">
            <svg class="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
            <span class="text-gray-700">contacto&#64;miscanarios.com</span>
          </div>
          <div class="flex items-center space-x-3">
            <svg class="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
            </svg>
            <span class="text-gray-700">+34 123 456 789</span>
          </div>
        </div>
        <p class="text-sm text-gray-500 mt-6">Nos pondremos en contacto contigo lo antes posible.</p>
      </div>
    </div>
  `,
  styles: []
})
export class ContactComponent {

}

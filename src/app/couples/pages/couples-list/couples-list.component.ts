import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-couples-list',
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Gestión de Parejas</h1>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-gray-600">Esta funcionalidad está en desarrollo.</p>
        <p class="text-sm text-gray-500 mt-2">Próximamente podrás gestionar las parejas de canarios aquí.</p>
      </div>
    </div>
  `,
  styles: []
})
export class CouplesListComponent {

}

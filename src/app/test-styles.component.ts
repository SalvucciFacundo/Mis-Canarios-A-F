import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
    selector: 'app-style-test',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="p-8 bg-blue-500 text-white text-center">
      <h1 class="text-2xl font-bold mb-4">Test de Estilos</h1>
      <div class="bg-white text-black p-4 rounded-lg">
        <p>Si ves este texto negro en fondo blanco con bordes redondeados, Tailwind funciona correctamente.</p>
      </div>
      <button class="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors">
        Botón de Prueba
      </button>
    </div>
  `
})
export class StyleTestComponent { }

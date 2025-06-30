import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="isVisible"
      [class]="containerClasses"
      class="flex items-center justify-center z-50">

      <!-- Spinner Ball Atom -->
      <div class="relative">
        <!-- Centro del átomo -->
        <div class="w-8 h-8 bg-sky-500 rounded-full animate-pulse"></div>

        <!-- Órbitas del átomo -->
        <div class="absolute inset-0 animate-spin-slow">
          <div class="w-16 h-16 border-2 border-sky-400 rounded-full border-dashed animate-ping-slow"></div>
        </div>

        <div class="absolute inset-0 animate-spin-reverse">
          <div class="w-12 h-12 border border-sky-300 rounded-full border-dotted animate-pulse"></div>
        </div>

        <!-- Electrones -->
        <div class="absolute -top-1 left-1/2 transform -translate-x-1/2 animate-orbit">
          <div class="w-2 h-2 bg-sky-400 rounded-full"></div>
        </div>

        <div class="absolute top-1/2 -right-1 transform -translate-y-1/2 animate-orbit-reverse">
          <div class="w-2 h-2 bg-sky-300 rounded-full"></div>
        </div>

        <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 animate-orbit">
          <div class="w-2 h-2 bg-sky-500 rounded-full"></div>
        </div>
      </div>

      <!-- Mensaje opcional -->
      <div *ngIf="message" class="absolute mt-20 text-white text-sm font-medium">
        {{ message }}
      </div>
    </div>
  `,
  styles: [`
    /* Animaciones personalizadas */
    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes spin-reverse {
      from { transform: rotate(360deg); }
      to { transform: rotate(0deg); }
    }

    @keyframes orbit {
      0% { transform: rotate(0deg) translateX(20px) rotate(0deg); }
      100% { transform: rotate(360deg) translateX(20px) rotate(-360deg); }
    }

    @keyframes orbit-reverse {
      0% { transform: rotate(360deg) translateX(16px) rotate(360deg); }
      100% { transform: rotate(0deg) translateX(16px) rotate(0deg); }
    }

    @keyframes ping-slow {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.1); }
    }

    .animate-spin-slow {
      animation: spin-slow 3s linear infinite;
    }

    .animate-spin-reverse {
      animation: spin-reverse 2s linear infinite;
    }

    .animate-orbit {
      animation: orbit 1.5s linear infinite;
    }

    .animate-orbit-reverse {
      animation: orbit-reverse 2s linear infinite;
    }

    .animate-ping-slow {
      animation: ping-slow 2s ease-in-out infinite;
    }
  `]
})
export class CustomSpinnerComponent {
  @Input() isVisible = false;
  @Input() message?: string;
  @Input() fullScreen = false;

  get containerClasses(): string {
    const baseClasses = 'fixed inset-0 bg-black flex items-center justify-center z-50';
    const fullScreenClasses = 'fixed inset-0 bg-black';
    const contentOnlyClasses = 'fixed top-16 left-0 right-0 bottom-0 bg-black bg-opacity-90';

    return this.fullScreen ? fullScreenClasses : contentOnlyClasses;
  }
}

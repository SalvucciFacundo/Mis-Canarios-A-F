import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from './services/toast.service';

@Component({
    selector: 'app-toast-container',
    imports: [CommonModule],
    template: `
    <!-- Contenedor de toasts fijo en la esquina superior derecha -->
    <div class="fixed top-4 right-4 z-50 space-y-3 max-w-md w-full">
      <div
        *ngFor="let toast of toasts; trackBy: trackByToast"
        class="transform transition-all duration-500 ease-in-out animate-slide-in-right"
        [class]="getToastClasses(toast.type)"
      >
        <!-- Toast content -->
        <div class="flex items-start space-x-4 p-5 rounded-lg shadow-lg border backdrop-blur-sm">
          <!-- Ícono -->
          <div class="flex-shrink-0">
            <svg class="w-6 h-6" [class]="getIconClasses(toast.type)" fill="currentColor" viewBox="0 0 20 20">
              <!-- Success -->
              <path *ngIf="toast.type === 'success'"
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd">
              </path>

              <!-- Error -->
              <path *ngIf="toast.type === 'error'"
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clip-rule="evenodd">
              </path>

              <!-- Warning -->
              <path *ngIf="toast.type === 'warning'"
                    fill-rule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd">
              </path>

              <!-- Info -->
              <path *ngIf="toast.type === 'info'"
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clip-rule="evenodd">
              </path>
            </svg>
          </div>

          <!-- Contenido -->
          <div class="flex-1 min-w-0">
            <h4 *ngIf="toast.title" class="text-sm font-semibold" [class]="getTitleClasses(toast.type)">
              {{ toast.title }}
            </h4>
            <p class="text-sm" [class]="getMessageClasses(toast.type)">
              {{ toast.message }}
            </p>
          </div>

          <!-- Botón de acción (si existe) -->
          <div *ngIf="toast.action" class="flex-shrink-0">
            <button
              (click)="handleAction(toast)"
              class="text-xs font-medium px-3 py-1 rounded-md transition-colors duration-200"
              [class]="getActionClasses(toast.type)"
            >
              {{ toast.action.label }}
            </button>
          </div>

          <!-- Botón de cerrar -->
          <div class="flex-shrink-0">
            <button
              (click)="dismiss(toast.id)"
              class="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    @keyframes slide-in-right {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .animate-slide-in-right {
      animation: slide-in-right 0.3s ease-out;
    }
  `]
})
export class ToastContainerComponent {
    private toastService = inject(ToastService);

    get toasts() {
        return this.toastService.toastList();
    }

    trackByToast(index: number, toast: Toast): string {
        return toast.id;
    }

    dismiss(id: string): void {
        this.toastService.dismiss(id);
    }

    handleAction(toast: Toast): void {
        if (toast.action) {
            toast.action.handler();
            this.dismiss(toast.id);
        }
    }

    getToastClasses(type: string): string {
        switch (type) {
            case 'success':
                return 'bg-green-50/95 border-green-200';
            case 'error':
                return 'bg-red-50/95 border-red-200';
            case 'warning':
                return 'bg-orange-50/95 border-orange-200';
            case 'info':
                return 'bg-blue-50/95 border-blue-200';
            default:
                return 'bg-gray-50/95 border-gray-200';
        }
    }

    getIconClasses(type: string): string {
        switch (type) {
            case 'success':
                return 'text-green-600';
            case 'error':
                return 'text-red-600';
            case 'warning':
                return 'text-orange-600';
            case 'info':
                return 'text-blue-600';
            default:
                return 'text-gray-600';
        }
    }

    getTitleClasses(type: string): string {
        switch (type) {
            case 'success':
                return 'text-green-900';
            case 'error':
                return 'text-red-900';
            case 'warning':
                return 'text-orange-900';
            case 'info':
                return 'text-blue-900';
            default:
                return 'text-gray-900';
        }
    }

    getMessageClasses(type: string): string {
        switch (type) {
            case 'success':
                return 'text-green-800';
            case 'error':
                return 'text-red-800';
            case 'warning':
                return 'text-orange-800';
            case 'info':
                return 'text-blue-800';
            default:
                return 'text-gray-800';
        }
    }

    getActionClasses(type: string): string {
        switch (type) {
            case 'success':
                return 'bg-green-600 hover:bg-green-700 text-white';
            case 'error':
                return 'bg-red-600 hover:bg-red-700 text-white';
            case 'warning':
                return 'bg-orange-600 hover:bg-orange-700 text-white';
            case 'info':
                return 'bg-blue-600 hover:bg-blue-700 text-white';
            default:
                return 'bg-gray-600 hover:bg-gray-700 text-white';
        }
    }
}

import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserLimitsService } from '../../services/user-limits.service';

@Component({
  selector: 'app-limits-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Alerta flotante para límites críticos -->
    <div *ngIf="showAlert()"
         class="fixed top-16 right-4 z-50 max-w-sm bg-white border-l-4 border-orange-500 shadow-lg rounded-lg p-4 animate-pulse">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z">
            </path>
          </svg>
        </div>
        <div class="ml-3 flex-1">
          <h3 class="text-sm font-medium text-gray-900">
            Límite casi alcanzado
          </h3>
          <div class="mt-1 text-sm text-gray-600">
            <div *ngIf="limitsService.isNearLimit('birds_create')" class="mb-1">
              Te quedan {{ limitsService.getRemainingOperations('birds_create') }} canarios por crear hoy
            </div>
            <div *ngIf="limitsService.isNearLimit('couples_create')">
              Te quedan {{ limitsService.getRemainingOperations('couples_create') }} parejas por crear hoy
            </div>
          </div>
        </div>
        <div class="ml-4 flex-shrink-0">
          <button (click)="dismissAlert()"
                  class="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class LimitsAlertComponent implements OnInit, OnDestroy {
  public limitsService = inject(UserLimitsService);

  public showAlert = signal(false);
  private alertDismissed = signal(false);
  private checkInterval: any;

  ngOnInit(): void {
    // Verificar límites cada 30 segundos
    this.checkInterval = setInterval(() => {
      this.checkLimits();
    }, 30000);

    // Verificación inicial
    this.checkLimits();
  }

  ngOnDestroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  private checkLimits(): void {
    if (this.alertDismissed()) return;

    const hasNearLimits = this.limitsService.isNearLimit('birds_create') ||
      this.limitsService.isNearLimit('couples_create');

    this.showAlert.set(hasNearLimits);
  }

  dismissAlert(): void {
    this.showAlert.set(false);
    this.alertDismissed.set(true);

    // Permitir que la alerta vuelva a aparecer después de 1 hora
    setTimeout(() => {
      this.alertDismissed.set(false);
    }, 60 * 60 * 1000);
  }
}

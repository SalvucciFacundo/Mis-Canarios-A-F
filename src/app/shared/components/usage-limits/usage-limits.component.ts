import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserLimitsService, UserLimits, DailyUsage } from '../../services/user-limits.service';

@Component({
  selector: 'app-usage-limits',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-gradient-to-r from-sky-50 to-blue-50 p-4 rounded-lg border border-sky-200 mb-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold text-sky-900 flex items-center">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z">
            </path>
          </svg>
          Uso Diario - {{ today }}
        </h3>
        <button 
          (click)="showDetails = !showDetails"
          class="text-xs text-sky-600 hover:text-sky-700 font-medium">
          {{ showDetails ? 'Ocultar' : 'Ver detalles' }}
        </button>
      </div>

      <!-- Resumen principal -->
      <div class="grid grid-cols-2 gap-4 mb-3">
        <div class="text-center">
          <div class="text-lg font-bold" [ngClass]="{
            'text-green-600': getUsagePercentage('birds_create') < 80,
            'text-orange-500': getUsagePercentage('birds_create') >= 80 && getUsagePercentage('birds_create') < 100,
            'text-red-600': getUsagePercentage('birds_create') >= 100
          }">
            {{ usage.birds_create }}/{{ limits.birds_create }}
          </div>
          <div class="text-xs text-gray-600 uppercase tracking-wide">Canarios Creados</div>
          <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div class="h-2 rounded-full transition-all duration-300" 
                 [style.width.%]="getUsagePercentage('birds_create')"
                 [ngClass]="{
                   'bg-green-500': getUsagePercentage('birds_create') < 80,
                   'bg-orange-500': getUsagePercentage('birds_create') >= 80 && getUsagePercentage('birds_create') < 100,
                   'bg-red-500': getUsagePercentage('birds_create') >= 100
                 }">
            </div>
          </div>
        </div>

        <div class="text-center">
          <div class="text-lg font-bold" [ngClass]="{
            'text-green-600': getUsagePercentage('couples_create') < 80,
            'text-orange-500': getUsagePercentage('couples_create') >= 80 && getUsagePercentage('couples_create') < 100,
            'text-red-600': getUsagePercentage('couples_create') >= 100
          }">
            {{ usage.couples_create }}/{{ limits.couples_create }}
          </div>
          <div class="text-xs text-gray-600 uppercase tracking-wide">Parejas Creadas</div>
          <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div class="h-2 rounded-full transition-all duration-300" 
                 [style.width.%]="getUsagePercentage('couples_create')"
                 [ngClass]="{
                   'bg-green-500': getUsagePercentage('couples_create') < 80,
                   'bg-orange-500': getUsagePercentage('couples_create') >= 80 && getUsagePercentage('couples_create') < 100,
                   'bg-red-500': getUsagePercentage('couples_create') >= 100
                 }">
            </div>
          </div>
        </div>
      </div>

      <!-- Alertas -->
      <div *ngIf="hasWarnings()" class="mb-3">
        <div *ngIf="isNearLimit('birds_create')" 
             class="flex items-center gap-2 p-2 bg-orange-100 text-orange-800 rounded text-xs mb-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z">
            </path>
          </svg>
          Te quedan {{ getRemainingOperations('birds_create') }} canarios por crear hoy
        </div>
        
        <div *ngIf="hasReachedLimit('birds_create')" 
             class="flex items-center gap-2 p-2 bg-red-100 text-red-800 rounded text-xs mb-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728">
            </path>
          </svg>
          Has alcanzado el límite diario de canarios. Vuelve mañana.
        </div>
      </div>

      <!-- Detalles expandibles -->
      <div *ngIf="showDetails" class="border-t border-sky-200 pt-3 mt-3">
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div class="text-center p-2 bg-white rounded border">
            <div class="font-medium text-gray-700">{{ usage.birds_update }}/{{ limits.birds_update }}</div>
            <div class="text-gray-500">Canarios Editados</div>
          </div>
          <div class="text-center p-2 bg-white rounded border">
            <div class="font-medium text-gray-700">{{ usage.birds_delete }}/{{ limits.birds_delete }}</div>
            <div class="text-gray-500">Canarios Eliminados</div>
          </div>
          <div class="text-center p-2 bg-white rounded border">
            <div class="font-medium text-gray-700">{{ usage.couples_update }}/{{ limits.couples_update }}</div>
            <div class="text-gray-500">Parejas Editadas</div>
          </div>
        </div>
        
        <div class="mt-2 text-xs text-gray-600 text-center">
          Los límites se reinician cada día a las 00:00
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class UsageLimitsComponent {
  @Input() showInPage: 'birds' | 'couples' | 'all' = 'all';
  
  public limitsService = inject(UserLimitsService);
  
  showDetails = false;
  
  get usage(): DailyUsage {
    return this.limitsService.getDailyUsage();
  }
  
  get limits(): UserLimits {
    return this.limitsService.getLimits();
  }
  
  get today(): string {
    return new Date().toLocaleDateString('es-ES', { 
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }
  
  getUsagePercentage(operation: keyof UserLimits): number {
    return this.limitsService.getUsagePercentage(operation);
  }
  
  getRemainingOperations(operation: keyof UserLimits): number {
    return this.limitsService.getRemainingOperations(operation);
  }
  
  isNearLimit(operation: keyof UserLimits): boolean {
    return this.limitsService.isNearLimit(operation);
  }
  
  hasReachedLimit(operation: keyof UserLimits): boolean {
    return this.limitsService.hasReachedLimit(operation);
  }
  
  hasWarnings(): boolean {
    if (this.showInPage === 'birds') {
      return this.isNearLimit('birds_create') || this.hasReachedLimit('birds_create');
    }
    if (this.showInPage === 'couples') {
      return this.isNearLimit('couples_create') || this.hasReachedLimit('couples_create');
    }
    return this.isNearLimit('birds_create') || 
           this.hasReachedLimit('birds_create') ||
           this.isNearLimit('couples_create') || 
           this.hasReachedLimit('couples_create');
  }
}

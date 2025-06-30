import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserLimitsService } from '../../services/user-limits.service';

@Component({
  selector: 'app-user-limits-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Indicador de límites con borde y efecto hover -->
    <div class="relative user-limits-dropdown">
      <!-- Badge de alerta si hay límites cercanos -->
      <div *ngIf="hasNearLimits()"
           class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white z-10">
      </div>

      <!-- Botón de límites compacto -->
      <div class="group relative">
        <button
          (click)="toggleDropdown()"
          class="relative flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border border-indigo-400/50 hover:border-indigo-300 text-white px-3 py-1 rounded-md font-medium text-sm transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-indigo-500/25 transform hover:scale-105 active:scale-95"
          [class.from-indigo-600]="isDropdownOpen()"
          [class.to-purple-700]="isDropdownOpen()"
          [class.border-indigo-300]="isDropdownOpen()">

          <!-- Icono compacto (oculto en móvil) -->
          <div class="hidden sm:flex flex-shrink-0 w-5 h-5 bg-white/20 rounded-md items-center justify-center">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z">
              </path>
            </svg>
          </div>

          <!-- Contador compacto -->
          <div class="hidden sm:flex flex-col items-start">
            <span class="text-xs font-medium text-indigo-100 uppercase tracking-wide leading-none">Límites</span>
            <div class="flex items-center gap-1 text-sm font-bold leading-none">
              <span class="text-white drop-shadow" [ngClass]="{
                'text-green-200': getTotalPercentage() < 80,
                'text-orange-200': getTotalPercentage() >= 80 && getTotalPercentage() < 100,
                'text-red-200': getTotalPercentage() >= 100
              }">{{ usage.birds_create + usage.couples_create }}</span>
              <span class="text-indigo-100 font-medium text-xs">/{{ limits.birds_create + limits.couples_create }}</span>
            </div>
          </div>

          <!-- Solo contador en móvil (mismo tamaño que el menú de usuario) -->
          <div class="sm:hidden flex items-center gap-1 text-sm font-bold px-1 py-0.5">
            <span class="text-white drop-shadow" [ngClass]="{
              'text-green-200': getTotalPercentage() < 80,
              'text-orange-200': getTotalPercentage() >= 80 && getTotalPercentage() < 100,
              'text-red-200': getTotalPercentage() >= 100
            }">{{ usage.birds_create + usage.couples_create }}</span>
            <span class="text-indigo-100 font-medium text-xs">/{{ limits.birds_create + limits.couples_create }}</span>
          </div>

          <!-- Flecha dropdown -->
          <svg class="w-3 h-3 transition-transform duration-200 text-white/90"
               [class.rotate-180]="isDropdownOpen()"
               fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>

        <!-- Tooltip compacto -->
        <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          Ver límites diarios
        </div>
      </div>

      <!-- Dropdown con diseño mejorado -->
      <div *ngIf="isDropdownOpen()"
           class="absolute left-1/2 transform -translate-x-[60%] sm:right-0 sm:left-auto sm:transform-none mt-3 w-96 max-w-[calc(100vw-1rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 z-[60] p-6 dropdown-enter backdrop-blur-sm">

        <!-- Header mejorado -->
        <div class="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <h3 class="font-bold text-gray-900 text-lg flex items-center gap-3">
            <div class="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z">
                </path>
              </svg>
            </div>
            Uso Diario de Límites
          </h3>
          <span class="text-sm text-gray-500 bg-gradient-to-r from-gray-100 to-gray-200 px-3 py-1 rounded-full font-medium">{{ today }}</span>
        </div>

        <!-- Estadísticas principales -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <!-- Canarios -->
          <div class="text-center bg-gradient-to-br from-sky-50 to-blue-50 rounded-lg p-4 border border-sky-100">
            <div class="text-2xl font-bold mb-1" [ngClass]="{
              'text-green-600': getBirdsPercentage() < 80,
              'text-orange-500': getBirdsPercentage() >= 80 && getBirdsPercentage() < 100,
              'text-red-600': getBirdsPercentage() >= 100
            }">
              {{ usage.birds_create }}
              <span class="text-sm text-gray-500 font-normal">/{{ limits.birds_create }}</span>
            </div>
            <div class="text-xs text-gray-700 font-semibold mb-3 uppercase tracking-wide">Canarios Creados</div>
            <div class="w-full bg-gray-200 rounded-full h-2.5 shadow-inner">
              <div class="h-2.5 rounded-full transition-all duration-500 shadow-sm"
                   [style.width.%]="getBirdsPercentage()"
                   [ngClass]="{
                     'bg-gradient-to-r from-green-400 to-green-500': getBirdsPercentage() < 80,
                     'bg-gradient-to-r from-orange-400 to-orange-500': getBirdsPercentage() >= 80 && getBirdsPercentage() < 100,
                     'bg-gradient-to-r from-red-400 to-red-500': getBirdsPercentage() >= 100
                   }">
              </div>
            </div>
            <div class="text-xs text-gray-600 mt-1 font-medium">{{ getBirdsPercentage() }}%</div>
          </div>

          <!-- Parejas -->
          <div class="text-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
            <div class="text-2xl font-bold mb-1" [ngClass]="{
              'text-green-600': getCouplesPercentage() < 80,
              'text-orange-500': getCouplesPercentage() >= 80 && getCouplesPercentage() < 100,
              'text-red-600': getCouplesPercentage() >= 100
            }">
              {{ usage.couples_create }}
              <span class="text-sm text-gray-500 font-normal">/{{ limits.couples_create }}</span>
            </div>
            <div class="text-xs text-gray-700 font-semibold mb-3 uppercase tracking-wide">Parejas Creadas</div>
            <div class="w-full bg-gray-200 rounded-full h-2.5 shadow-inner">
              <div class="h-2.5 rounded-full transition-all duration-500 shadow-sm"
                   [style.width.%]="getCouplesPercentage()"
                   [ngClass]="{
                     'bg-gradient-to-r from-green-400 to-green-500': getCouplesPercentage() < 80,
                     'bg-gradient-to-r from-orange-400 to-orange-500': getCouplesPercentage() >= 80 && getCouplesPercentage() < 100,
                     'bg-gradient-to-r from-red-400 to-red-500': getCouplesPercentage() >= 100
                   }">
              </div>
            </div>
            <div class="text-xs text-gray-600 mt-1 font-medium">{{ getCouplesPercentage() }}%</div>
          </div>
        </div>

        <!-- Alertas -->
        <div *ngIf="hasWarnings()" class="mb-3">
          <div *ngIf="limitsService.isNearLimit('birds_create') && !limitsService.hasReachedLimit('birds_create')"
               class="flex items-center gap-2 p-2 bg-orange-50 text-orange-800 rounded text-xs mb-2">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z">
              </path>
            </svg>
            Te quedan {{ limitsService.getRemainingOperations('birds_create') }} canarios
          </div>

          <div *ngIf="limitsService.hasReachedLimit('birds_create')"
               class="flex items-center gap-2 p-2 bg-red-50 text-red-800 rounded text-xs">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728">
              </path>
            </svg>
            Límite de canarios alcanzado
          </div>
        </div>

        <!-- Detalles adicionales -->
        <div class="border-t border-gray-100 pt-3">
          <div class="grid grid-cols-3 gap-2 text-xs text-gray-600">
            <div class="text-center">
              <div class="font-medium text-gray-700">{{ usage.birds_update }}</div>
              <div>Editados</div>
            </div>
            <div class="text-center">
              <div class="font-medium text-gray-700">{{ usage.birds_delete }}</div>
              <div>Eliminados</div>
            </div>
            <div class="text-center">
              <div class="font-medium text-gray-700">{{ usage.couples_update }}</div>
              <div>Parejas Edit.</div>
            </div>
          </div>
          <div class="text-center text-xs text-gray-500 mt-2">
            Límites se reinician a las 00:00
          </div>
        </div>
      </div>
    </div>

    <!-- Overlay para cerrar dropdown -->
    <div *ngIf="isDropdownOpen()"
         (click)="closeDropdown()"
         class="fixed inset-0 z-40">
    </div>
  `,
  styles: [`
    .text-shadow {
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .drop-shadow-sm {
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
    }

    .dropdown-enter {
      animation: dropdownEnter 0.3s ease-out;
    }

    @keyframes dropdownEnter {
      from {
        opacity: 0;
        transform: translateY(-15px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .button-glow:hover {
      box-shadow: 0 0 25px rgba(99, 102, 241, 0.4), 0 0 50px rgba(147, 51, 234, 0.2);
    }

    /* Efecto de pulsación para botones */
    button:active {
      transform: scale(0.98);
    }

    /* Mejoras para las barras de progreso */
    .progress-bar {
      position: relative;
      overflow: hidden;
    }

    .progress-bar::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
      animation: shimmer 2s infinite;
    }

    @keyframes shimmer {
      0% { left: -100%; }
      100% { left: 100%; }
    }
  `]
})
export class UserLimitsIndicatorComponent {
  public limitsService = inject(UserLimitsService);

  public isDropdownOpen = signal(false);

  get usage() {
    return this.limitsService.getDailyUsage();
  }

  get limits() {
    return this.limitsService.getLimits();
  }

  get today(): string {
    return new Date().toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  }

  toggleDropdown(): void {
    this.isDropdownOpen.set(!this.isDropdownOpen());
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const dropdown = target.closest('.user-limits-dropdown');
    if (!dropdown && this.isDropdownOpen()) {
      this.closeDropdown();
    }
  }

  closeDropdown(): void {
    this.isDropdownOpen.set(false);
  }

  getBirdsPercentage(): number {
    return this.limitsService.getUsagePercentage('birds_create');
  }

  getCouplesPercentage(): number {
    return this.limitsService.getUsagePercentage('couples_create');
  }

  getTotalPercentage(): number {
    const totalUsed = this.usage.birds_create + this.usage.couples_create;
    const totalLimit = this.limits.birds_create + this.limits.couples_create;
    return Math.round((totalUsed / totalLimit) * 100);
  }

  hasNearLimits(): boolean {
    return this.limitsService.isNearLimit('birds_create') ||
      this.limitsService.isNearLimit('couples_create');
  }

  hasWarnings(): boolean {
    return this.limitsService.isNearLimit('birds_create') ||
      this.limitsService.hasReachedLimit('birds_create') ||
      this.limitsService.isNearLimit('couples_create') ||
      this.limitsService.hasReachedLimit('couples_create');
  }
}

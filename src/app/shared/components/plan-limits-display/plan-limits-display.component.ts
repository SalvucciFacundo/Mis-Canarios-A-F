import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

interface PlanLimits {
    dailyBirds: number | 'unlimited';
    dailyCouples: number | 'unlimited';
    permanentBirds: number | 'unlimited';
    permanentCouples: number | 'unlimited';
}

@Component({
    selector: 'app-plan-limits-display',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 space-y-2 border border-gray-200">
      <h4 class="text-sm font-semibold text-gray-700 mb-2 flex items-center">
        <svg class="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        Límites de uso
      </h4>

      <div class="grid grid-cols-2 gap-2 text-xs">
        <!-- Límites diarios -->
        <div class="col-span-2 mb-1">
          <div class="flex items-center text-xs font-medium text-gray-600 mb-1">
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"></path>
            </svg>
            Límites diarios:
          </div>
        </div>

        <div class="flex justify-between py-1 px-2 bg-white rounded">
          <span class="text-gray-600 flex items-center">
            <span class="w-2 h-2 bg-yellow-400 rounded-full mr-1"></span>
            Canarios:
          </span>
          <span class="font-medium" [ngClass]="limits.dailyBirds === 'unlimited' ? 'text-green-600' : 'text-gray-900'">
            {{ limits.dailyBirds === 'unlimited' ? '∞' : limits.dailyBirds }}
          </span>
        </div>

        <div class="flex justify-between py-1 px-2 bg-white rounded">
          <span class="text-gray-600 flex items-center">
            <span class="w-2 h-2 bg-pink-400 rounded-full mr-1"></span>
            Parejas:
          </span>
          <span class="font-medium" [ngClass]="limits.dailyCouples === 'unlimited' ? 'text-green-600' : 'text-gray-900'">
            {{ limits.dailyCouples === 'unlimited' ? '∞' : limits.dailyCouples }}
          </span>
        </div>

        <!-- Límites totales -->
        <div class="col-span-2 mt-2 mb-1">
          <div class="flex items-center text-xs font-medium text-gray-600 mb-1">
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17v4a2 2 0 002 2h4M13 13h4a2 2 0 012 2v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4a2 2 0 012-2z"></path>
            </svg>
            Límites totales:
          </div>
        </div>

        <div class="flex justify-between py-1 px-2 bg-white rounded">
          <span class="text-gray-600 flex items-center">
            <span class="w-2 h-2 bg-yellow-400 rounded-full mr-1"></span>
            Canarios:
          </span>
          <span class="font-medium" [ngClass]="limits.permanentBirds === 'unlimited' ? 'text-green-600' : 'text-gray-900'">
            {{ limits.permanentBirds === 'unlimited' ? '∞' : limits.permanentBirds }}
          </span>
        </div>

        <div class="flex justify-between py-1 px-2 bg-white rounded">
          <span class="text-gray-600 flex items-center">
            <span class="w-2 h-2 bg-pink-400 rounded-full mr-1"></span>
            Parejas:
          </span>
          <span class="font-medium" [ngClass]="limits.permanentCouples === 'unlimited' ? 'text-green-600' : 'text-gray-900'">
            {{ limits.permanentCouples === 'unlimited' ? '∞' : limits.permanentCouples }}
          </span>
        </div>
      </div>

      @if (showComparison && previousLimits) {
      <div class="mt-2 pt-2 border-t border-gray-200">
        <div class="text-xs text-gray-500">
          @if (isUpgrade()) {
          <span class="text-green-600 font-medium flex items-center">
            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
            </svg>
            ✨ Mejora significativa en límites
          </span>
          } @else if (isDowngrade()) {
          <span class="text-orange-600 font-medium flex items-center">
            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            ⚠️ Límites reducidos
          </span>
          } @else {
          <span class="text-gray-600">Límites similares</span>
          }
        </div>
      </div>
      }
    </div>
  `,
    styles: []
})
export class PlanLimitsDisplayComponent {
    @Input() limits!: PlanLimits;
    @Input() showComparison = false;
    @Input() previousLimits?: PlanLimits;

    isUpgrade(): boolean {
        if (!this.previousLimits) return false;

        // Si cualquier límite actual es unlimited y el anterior no, es upgrade
        if (this.limits.dailyBirds === 'unlimited' && this.previousLimits.dailyBirds !== 'unlimited') return true;
        if (this.limits.dailyCouples === 'unlimited' && this.previousLimits.dailyCouples !== 'unlimited') return true;
        if (this.limits.permanentBirds === 'unlimited' && this.previousLimits.permanentBirds !== 'unlimited') return true;
        if (this.limits.permanentCouples === 'unlimited' && this.previousLimits.permanentCouples !== 'unlimited') return true;

        // Si ambos son numéricos, comparar valores
        if (typeof this.limits.dailyBirds === 'number' && typeof this.previousLimits.dailyBirds === 'number') {
            return this.limits.dailyBirds > this.previousLimits.dailyBirds;
        }

        return false;
    }

    isDowngrade(): boolean {
        if (!this.previousLimits) return false;

        // Si cualquier límite anterior era unlimited y el actual no, es downgrade
        if (this.previousLimits.dailyBirds === 'unlimited' && this.limits.dailyBirds !== 'unlimited') return true;
        if (this.previousLimits.dailyCouples === 'unlimited' && this.limits.dailyCouples !== 'unlimited') return true;
        if (this.previousLimits.permanentBirds === 'unlimited' && this.limits.permanentBirds !== 'unlimited') return true;
        if (this.previousLimits.permanentCouples === 'unlimited' && this.limits.permanentCouples !== 'unlimited') return true;

        // Si ambos son numéricos, comparar valores
        if (typeof this.limits.dailyBirds === 'number' && typeof this.previousLimits.dailyBirds === 'number') {
            return this.limits.dailyBirds < this.previousLimits.dailyBirds;
        }

        return false;
    }
}

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { PlanLimitsDisplayComponent } from './shared/components/plan-limits-display/plan-limits-display.component';

@Component({
    selector: 'app-debug-limits',
    standalone: true,
    imports: [CommonModule, PlanLimitsDisplayComponent],
    template: `
    <div class="p-4">
      <h2 class="text-xl font-bold mb-4">Debug: Test de Límites</h2>

      <div class="mb-4">
        <h3 class="text-lg font-semibold mb-2">Plan Free:</h3>
        <app-plan-limits-display [limits]="freeLimits"></app-plan-limits-display>
      </div>

      <div class="mb-4">
        <h3 class="text-lg font-semibold mb-2">Plan Mensual:</h3>
        <app-plan-limits-display [limits]="monthlyLimits"></app-plan-limits-display>
      </div>

      <div class="mb-4">
        <h3 class="text-lg font-semibold mb-2">Plan Anual:</h3>
        <app-plan-limits-display [limits]="annualLimits"></app-plan-limits-display>
      </div>

      <div class="mt-4 p-3 bg-gray-100 rounded">
        <h4 class="font-semibold">Datos de debug:</h4>
        <pre>{{ debugInfo | json }}</pre>
      </div>
    </div>
  `
})
export class DebugLimitsComponent {
    freeLimits = {
        dailyBirds: 50,
        dailyCouples: 50,
        permanentBirds: 300,
        permanentCouples: 200
    };

    monthlyLimits = {
        dailyBirds: 200,
        dailyCouples: 150,
        permanentBirds: 1500,
        permanentCouples: 1000
    };

    annualLimits = {
        dailyBirds: 'unlimited' as const,
        dailyCouples: 'unlimited' as const,
        permanentBirds: 'unlimited' as const,
        permanentCouples: 'unlimited' as const
    };

    get debugInfo() {
        return {
            freeLimits: this.freeLimits,
            monthlyLimits: this.monthlyLimits,
            annualLimits: this.annualLimits
        };
    }
}

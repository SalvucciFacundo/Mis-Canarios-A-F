import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { UserLimitsNewService } from '../shared/services/user-limits-new.service';

@Component({
    selector: 'app-limits-test',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="p-6 max-w-md mx-auto bg-white rounded-lg shadow-lg">
      <h3 class="text-lg font-semibold mb-4">Prueba de Límites</h3>

      <div class="space-y-3">
        <div>
          <div class="text-sm font-medium">Uso actual:</div>
          <div class="text-xs text-gray-600">
            Canarios creados: {{ usage.birds_create }} / {{ limits.birds_create }}
          </div>
          <div class="text-xs text-gray-600">
            Parejas creadas: {{ usage.couples_create }} / {{ limits.couples_create }}
          </div>
        </div>

        <div>
          <div class="text-sm font-medium">Uso permanente:</div>
          <div class="text-xs text-gray-600">
            Total canarios: {{ permanentUsage.birds_create }}
          </div>
          <div class="text-xs text-gray-600">
            Total parejas: {{ permanentUsage.couples_create }}
          </div>
        </div>

        <div class="space-y-2">
          <button
            (click)="addBird()"
            class="w-full px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
            Simular crear canario
          </button>
          <button
            (click)="addCouple()"
            class="w-full px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600">
            Simular crear pareja
          </button>
          <button
            (click)="resetDaily()"
            class="w-full px-3 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600">
            Reset contadores diarios
          </button>
          <button
            (click)="resetPermanent()"
            class="w-full px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600">
            Reset contadores permanentes
          </button>
        </div>

        <div class="mt-4 p-3 bg-gray-50 rounded">
          <div class="text-xs">
            <div>¿Puede crear canario? {{ canCreateBird ? 'Sí' : 'No' }}</div>
            <div>¿Puede crear pareja? {{ canCreateCouple ? 'Sí' : 'No' }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: []
})
export class LimitsTestComponent implements OnInit {
    private limitsService = inject(UserLimitsNewService);

    usage = this.limitsService.getDailyUsage();
    limits = this.limitsService.getLimits();
    permanentUsage = this.limitsService.getPermanentUsage();
    canCreateBird = true;
    canCreateCouple = true;

    ngOnInit() {
        this.updateCanCreate();
    }

    addBird() {
        this.limitsService.incrementUsage('birds_create');
        this.updateData();
    }

    addCouple() {
        this.limitsService.incrementUsage('couples_create');
        this.updateData();
    }

    resetDaily() {
        localStorage.removeItem('user_daily_usage');
        this.updateData();
    }

    resetPermanent() {
        this.limitsService.resetPermanentCounters();
        this.updateData();
    }

    private updateData() {
        this.usage = this.limitsService.getDailyUsage();
        this.limits = this.limitsService.getLimits();
        this.permanentUsage = this.limitsService.getPermanentUsage();
        this.updateCanCreate();
    }

    private updateCanCreate() {
        this.canCreateBird = this.limitsService.canPerformOperation('birds_create');
        this.canCreateCouple = this.limitsService.canPerformOperation('couples_create');
    }
}

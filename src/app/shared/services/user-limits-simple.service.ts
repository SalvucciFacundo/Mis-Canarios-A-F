import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../../auth/services/auth.service';
import { SubscriptionService } from '../../subscription/subscription.service';

export interface DailyUsage {
  birds_create: number;
  birds_update: number;
  birds_delete: number;
  couples_create: number;
  couples_update: number;
  couples_delete: number;
  date: string;
}

export interface PermanentUsage {
  birds_create: number;
  couples_create: number;
  lastUpdated: string;
}

export interface UserLimits {
  birds_create: number;
  birds_update: number;
  birds_delete: number;
  couples_create: number;
  couples_update: number;
  couples_delete: number;
}

export interface DetailedLimits {
  daily: {
    birds_create: number;
    birds_update: number;
    birds_delete: number;
    couples_create: number;
    couples_update: number;
    couples_delete: number;
  };
  permanent: {
    birds_create: number;
    couples_create: number;
  };
  planType: 'free' | 'monthly' | 'semiannual' | 'annual';
  hasUnlimitedDaily: boolean;
  hasUnlimitedPermanent: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserLimitsService {
  private authService = inject(AuthService);
  private subscriptionService = inject(SubscriptionService);

  // Configuración de límites por plan
  private PLAN_LIMITS = {
    free: {
      daily: {
        birds_create: 50,
        birds_update: 50,
        birds_delete: 50,
        couples_create: 50,
        couples_update: 50,
        couples_delete: 50
      },
      permanent: {
        birds_create: 300,
        couples_create: 200
      }
    },
    monthly: {
      daily: {
        birds_create: 200,
        birds_update: 200,
        birds_delete: 200,
        couples_create: 150,
        couples_update: 150,
        couples_delete: 150
      },
      permanent: {
        birds_create: 1500,
        couples_create: 1000
      }
    },
    semiannual: {
      daily: {
        birds_create: -1, // Sin límite
        birds_update: -1,
        birds_delete: -1,
        couples_create: -1,
        couples_update: -1,
        couples_delete: -1
      },
      permanent: {
        birds_create: 5000,
        couples_create: 3000
      }
    },
    annual: {
      daily: {
        birds_create: -1, // Sin límite
        birds_update: -1,
        birds_delete: -1,
        couples_create: -1,
        couples_update: -1,
        couples_delete: -1
      },
      permanent: {
        birds_create: -1, // Sin límite
        couples_create: -1
      }
    }
  };

  private getCurrentPlanSync(): typeof this.PLAN_LIMITS.free {
    // Para compatibilidad síncrona, devolver plan gratuito por defecto
    // En una implementación real, esto podría cachear el último plan conocido
    return this.PLAN_LIMITS.free;
  }

  /**
   * Obtiene los límites configurados según el plan del usuario (compatibilidad)
   */
  getLimits(): UserLimits {
    // Devolver valores síncronos para compatibilidad
    const currentPlan = this.getCurrentPlanSync();
    return {
      birds_create: currentPlan.daily.birds_create === -1 ? 9999 : currentPlan.daily.birds_create,
      birds_update: currentPlan.daily.birds_update === -1 ? 9999 : currentPlan.daily.birds_update,
      birds_delete: currentPlan.daily.birds_delete === -1 ? 9999 : currentPlan.daily.birds_delete,
      couples_create: currentPlan.daily.couples_create === -1 ? 9999 : currentPlan.daily.couples_create,
      couples_update: currentPlan.daily.couples_update === -1 ? 9999 : currentPlan.daily.couples_update,
      couples_delete: currentPlan.daily.couples_delete === -1 ? 9999 : currentPlan.daily.couples_delete,
    };
  }

  /**
   * Métodos de compatibilidad para componentes existentes
   */
  getUsagePercentage(operation: keyof UserLimits): number {
    const usage = this.getDailyUsage();
    const limits = this.getLimits();
    const operationUsage = usage[operation as keyof DailyUsage] || 0;
    const operationLimit = limits[operation];

    if (operationLimit === 9999) return 0; // Sin límite
    return operationLimit > 0 ? Math.min((Number(operationUsage) / Number(operationLimit)) * 100, 100) : 0;
  }

  getRemainingOperations(operation: keyof UserLimits): number {
    const usage = this.getDailyUsage();
    const limits = this.getLimits();
    const operationUsage = usage[operation as keyof DailyUsage] || 0;
    const operationLimit = limits[operation];

    if (operationLimit === 9999) return 9999; // Sin límite
    return Math.max(Number(operationLimit) - Number(operationUsage), 0);
  }

  isNearLimit(operation: keyof UserLimits): boolean {
    return this.getUsagePercentage(operation) >= 80;
  }

  hasReachedLimit(operation: keyof UserLimits): boolean {
    return this.getUsagePercentage(operation) >= 100;
  }

  /**
   * Obtiene el uso diario del usuario
   */
  getDailyUsage(): DailyUsage {
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `dailyUsage_${today}`;
    const currentUser = this.authService.currentUser();

    if (!currentUser) {
      return {
        birds_create: 0,
        birds_update: 0,
        birds_delete: 0,
        couples_create: 0,
        couples_update: 0,
        couples_delete: 0,
        date: today
      };
    }

    const userStorageKey = `${storageKey}_${currentUser.uid}`;
    const stored = localStorage.getItem(userStorageKey);

    if (stored) {
      return JSON.parse(stored);
    }

    return {
      birds_create: 0,
      birds_update: 0,
      birds_delete: 0,
      couples_create: 0,
      couples_update: 0,
      couples_delete: 0,
      date: today
    };
  }

  /**
   * Incrementa el contador de una operación específica
   */
  incrementUsage(operation: keyof DailyUsage): boolean {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return false;

    const today = new Date().toISOString().split('T')[0];
    const userStorageKey = `dailyUsage_${today}_${currentUser.uid}`;

    const usage = this.getDailyUsage();
    usage[operation]++;
    usage.date = today;

    localStorage.setItem(userStorageKey, JSON.stringify(usage));
    return true;
  }

  /**
   * Obtiene los límites detallados (nueva API)
   */
  getDetailedLimits(): Observable<DetailedLimits> {
    return this.subscriptionService.getUserPlanType().pipe(
      map(planType => {
        const planLimits = this.PLAN_LIMITS[planType];
        return {
          daily: { ...planLimits.daily },
          permanent: { ...planLimits.permanent },
          planType,
          hasUnlimitedDaily: planType === 'semiannual' || planType === 'annual',
          hasUnlimitedPermanent: planType === 'annual'
        };
      })
    );
  }

  /**
   * Obtiene el uso permanente del usuario
   */
  getPermanentUsage(): PermanentUsage {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      return {
        birds_create: 0,
        couples_create: 0,
        lastUpdated: new Date().toISOString()
      };
    }

    const storageKey = `permanentUsage_${currentUser.uid}`;
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      return JSON.parse(stored);
    }

    return {
      birds_create: 0,
      couples_create: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Incrementa el contador permanente de una operación específica
   */
  incrementPermanentUsage(operation: keyof PermanentUsage): boolean {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return false;

    const storageKey = `permanentUsage_${currentUser.uid}`;
    const usage = this.getPermanentUsage();

    if (operation !== 'lastUpdated') {
      (usage[operation] as number)++;
    }
    usage.lastUpdated = new Date().toISOString();

    localStorage.setItem(storageKey, JSON.stringify(usage));
    return true;
  }
}

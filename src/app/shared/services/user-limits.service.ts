import { Injectable, inject } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';

export interface DailyUsage {
  birds_create: number;
  birds_update: number;
  birds_delete: number;
  couples_create: number;
  couples_update: number;
  couples_delete: number;
  date: string;
}

export interface UserLimits {
  birds_create: number;
  birds_update: number;
  birds_delete: number;
  couples_create: number;
  couples_update: number;
  couples_delete: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserLimitsService {
  private authService = inject(AuthService);
  
  // Límites diarios por operación
  private readonly DAILY_LIMITS: UserLimits = {
    birds_create: 200,
    birds_update: 200,
    birds_delete: 50,
    couples_create: 200,
    couples_update: 200,
    couples_delete: 50
  };

  private readonly STORAGE_KEY = 'user_daily_usage';

  /**
   * Obtiene los límites configurados
   */
  getLimits(): UserLimits {
    return { ...this.DAILY_LIMITS };
  }

  /**
   * Obtiene el uso diario actual del usuario
   */
  getDailyUsage(): DailyUsage {
    const today = new Date().toDateString();
    const stored = localStorage.getItem(this.STORAGE_KEY);
    
    if (stored) {
      const usage = JSON.parse(stored);
      // Si es un día diferente, resetear contadores
      if (usage.date !== today) {
        return this.resetDailyUsage();
      }
      return usage;
    }
    
    return this.resetDailyUsage();
  }

  /**
   * Resetea los contadores diarios
   */
  private resetDailyUsage(): DailyUsage {
    const today = new Date().toDateString();
    const usage: DailyUsage = {
      birds_create: 0,
      birds_update: 0,
      birds_delete: 0,
      couples_create: 0,
      couples_update: 0,
      couples_delete: 0,
      date: today
    };
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(usage));
    return usage;
  }

  /**
   * Verifica si el usuario puede realizar una operación
   */
  canPerformOperation(operation: keyof UserLimits): boolean {
    const usage = this.getDailyUsage();
    const limits = this.getLimits();
    
    return usage[operation] < limits[operation];
  }

  /**
   * Incrementa el contador de una operación
   */
  incrementUsage(operation: keyof UserLimits): void {
    const usage = this.getDailyUsage();
    usage[operation]++;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(usage));
  }

  /**
   * Obtiene el porcentaje de uso para una operación
   */
  getUsagePercentage(operation: keyof UserLimits): number {
    const usage = this.getDailyUsage();
    const limits = this.getLimits();
    return Math.round((usage[operation] / limits[operation]) * 100);
  }

  /**
   * Obtiene el número restante de operaciones
   */
  getRemainingOperations(operation: keyof UserLimits): number {
    const usage = this.getDailyUsage();
    const limits = this.getLimits();
    return Math.max(0, limits[operation] - usage[operation]);
  }

  /**
   * Verifica si una operación está cerca del límite (>80%)
   */
  isNearLimit(operation: keyof UserLimits): boolean {
    return this.getUsagePercentage(operation) >= 80;
  }

  /**
   * Verifica si una operación ha alcanzado el límite
   */
  hasReachedLimit(operation: keyof UserLimits): boolean {
    return this.getUsagePercentage(operation) >= 100;
  }
}

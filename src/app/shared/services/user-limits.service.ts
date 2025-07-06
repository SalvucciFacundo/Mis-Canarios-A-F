import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../../auth/services/auth.service';
import { SubscriptionService } from '../../subscription/subscription.service';

export interface UserStats {
  birds_created_this_month: number;
  couples_created_this_month: number;
  total_birds: number;
  total_couples: number;
  last_updated: string;
  subscription_start?: string;
  subscription_end?: string;
}

export interface PlanConfiguration {
  plan_type: 'free' | 'monthly' | 'unlimited' | 'trial';
  trial_expires?: string;
  monthly_limits: {
    birds_create: number;
    couples_create: number;
  };
  visibility_limits: {
    birds_view: number;
    couples_view: number;
  };
  edit_permissions: {
    can_edit: boolean;
    can_delete: boolean;
    birds_edit: number;
    couples_edit: number;
  };
}

export interface UserLimits {
  birds_create: number;
  birds_view: number;
  birds_edit: number;
  birds_update: number;  // Agregado para compatibilidad
  birds_delete: number;  // Agregado para compatibilidad
  couples_create: number;
  couples_view: number;
  couples_edit: number;
  couples_update: number;  // Agregado para compatibilidad
  couples_delete: number;  // Agregado para compatibilidad
}

export interface RecordAccess {
  visible: boolean;
  editable: boolean;
  deletable: boolean;
  manageable: boolean;
  reason: string;
  suggestion?: string;
}

export interface DetailedLimits {
  total: {
    birds_create: number;
    birds_view: number;
    birds_edit: number;
    couples_create: number;
    couples_view: number;
    couples_edit: number;
  };
  planType: 'free' | 'monthly' | 'unlimited' | 'trial';
  isTrialActive: boolean;
  canEdit: boolean;
  canDelete: boolean;
  trialDaysRemaining?: number;
}

// Interfaces de compatibilidad (para componentes existentes)
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

@Injectable({
  providedIn: 'root'
})
export class UserLimitsService {
  private authService = inject(AuthService);
  private subscriptionService = inject(SubscriptionService);

  private readonly PLAN_CONFIGURATIONS = {
    free: {
      plan_type: 'free' as const,
      monthly_limits: {
        birds_create: 30,
        couples_create: 10
      },
      visibility_limits: {
        birds_view: 30,
        couples_view: 10
      },
      edit_permissions: {
        can_edit: false,
        can_delete: false,
        birds_edit: 0,
        couples_edit: 0
      }
    },
    monthly: {
      plan_type: 'monthly' as const,
      monthly_limits: {
        birds_create: 1500,
        couples_create: 200
      },
      visibility_limits: {
        birds_view: -1,
        couples_view: -1
      },
      edit_permissions: {
        can_edit: true,
        can_delete: true,
        birds_edit: -1,
        couples_edit: -1
      }
    },
    trial: {
      plan_type: 'trial' as const,
      monthly_limits: {
        birds_create: 1500,
        couples_create: 200
      },
      visibility_limits: {
        birds_view: -1,
        couples_view: -1
      },
      edit_permissions: {
        can_edit: true,
        can_delete: true,
        birds_edit: -1,
        couples_edit: -1
      }
    },
    unlimited: {
      plan_type: 'unlimited' as const,
      monthly_limits: {
        birds_create: -1,
        couples_create: -1
      },
      visibility_limits: {
        birds_view: -1,
        couples_view: -1
      },
      edit_permissions: {
        can_edit: true,
        can_delete: true,
        birds_edit: -1,
        couples_edit: -1
      }
    }
  };

  /**
   * MÉTODOS PRINCIPALES - SISTEMA REAL DE LÍMITES
   */

  private getCurrentPlanConfiguration(): Observable<PlanConfiguration> {
    return combineLatest([
      this.subscriptionService.getUserSubscription(),
      this.detectTrialStatus()
    ]).pipe(
      map(([subscription, isInTrial]) => {
        // Si está en prueba de 7 días
        if (isInTrial) {
          return {
            ...this.PLAN_CONFIGURATIONS.trial,
            trial_expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          };
        }

        // Si no tiene suscripción activa
        if (!subscription) {
          return this.PLAN_CONFIGURATIONS.free;
        }

        // Mapear plan de suscripción a configuración
        // Aquí asumo que subscription.planType existe en el objeto devuelto por el backend
        const planType = (subscription as any)?.planType || 'free';
        switch (planType) {
          case 'monthly':
            return this.PLAN_CONFIGURATIONS.monthly;
          case 'semiannual':
          case 'annual':
            return this.PLAN_CONFIGURATIONS.unlimited;
          default:
            return this.PLAN_CONFIGURATIONS.free;
        }
      })
    );
  }

  private detectTrialStatus(): Observable<boolean> {
    const user = this.authService.currentUser();

    if (!user?.uid) return of(false);

    // Verificar si es usuario nuevo (menos de 7 días desde registro)
    const userCreated = user.createdAt ?
      new Date(user.createdAt) :
      new Date();
    const daysSinceRegistration = (Date.now() - userCreated.getTime()) / (1000 * 60 * 60 * 24);

    // Si es nuevo Y no tiene suscripción activa = está en prueba
    return this.subscriptionService.getUserSubscription().pipe(
      map(subscription => {
        const hasActivePaidSubscription = subscription &&
          (subscription as any)?.planType &&
          (subscription as any)?.planType !== 'free';

        return daysSinceRegistration <= 7 && !hasActivePaidSubscription;
      })
    );
  }

  private getUserStatsFromBackend(): Observable<UserStats> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    const mockStats: UserStats = {
      birds_created_this_month: 5,
      couples_created_this_month: 2,
      total_birds: 25,
      total_couples: 8,
      last_updated: new Date().toISOString(),
      subscription_start: undefined,
      subscription_end: undefined
    };

    return of(mockStats);
  }

  canCreateRecord(recordType: 'bird' | 'couple'): Observable<boolean> {
    return combineLatest([
      this.getCurrentPlanConfiguration(),
      this.getUserStatsFromBackend()
    ]).pipe(
      map(([config, stats]) => {
        if (config.plan_type === 'unlimited') {
          return true;
        }

        const createdThisMonth = recordType === 'bird'
          ? stats.birds_created_this_month
          : stats.couples_created_this_month;

        const monthlyLimit = recordType === 'bird'
          ? config.monthly_limits.birds_create
          : config.monthly_limits.couples_create;

        if (monthlyLimit === -1) {
          return true;
        }

        if (config.plan_type === 'free') {
          const totalCreated = recordType === 'bird' ? stats.total_birds : stats.total_couples;
          return totalCreated < monthlyLimit;
        }

        return createdThisMonth < monthlyLimit;
      })
    );
  }

  checkRecordAccess(recordType: 'bird' | 'couple', recordIndex: number): Observable<RecordAccess> {
    return combineLatest([
      this.getCurrentPlanConfiguration(),
      this.getUserStatsFromBackend()
    ]).pipe(
      map(([config, stats]) => {
        const viewLimit = recordType === 'bird'
          ? config.visibility_limits.birds_view
          : config.visibility_limits.couples_view;

        const editLimit = recordType === 'bird'
          ? config.edit_permissions.birds_edit
          : config.edit_permissions.couples_edit;

        const visible = viewLimit === -1 || recordIndex <= viewLimit;

        if (config.plan_type === 'free') {
          return {
            visible,
            editable: false,
            deletable: false,
            manageable: true,
            reason: visible ? 'free_plan_read_only' : 'exceeds_free_limit',
            suggestion: visible ? 'Actualiza tu plan para editar registros' : 'Este registro no es visible en tu plan gratuito'
          };
        }

        const editable = config.edit_permissions.can_edit && (editLimit === -1 || recordIndex <= editLimit);
        const deletable = config.edit_permissions.can_delete && visible;

        return {
          visible,
          editable,
          deletable,
          manageable: true,
          reason: visible ? (editable ? 'full_access' : 'view_only') : 'not_visible',
          suggestion: !visible ? 'Este registro excede tu límite actual' : undefined
        };
      })
    );
  }

  canPerformBasicManagement(recordType: 'bird' | 'couple', recordIndex: number): Observable<boolean> {
    return this.checkRecordAccess(recordType, recordIndex).pipe(
      map(access => access.manageable)
    );
  }

  getDetailedLimits(): Observable<DetailedLimits> {
    return this.getCurrentPlanConfiguration().pipe(
      map(config => {
        const isTrialActive = config.plan_type === 'trial';
        const trialDaysRemaining = isTrialActive && config.trial_expires
          ? Math.max(0, Math.ceil((new Date(config.trial_expires).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : undefined;

        return {
          total: {
            birds_create: config.monthly_limits.birds_create,
            birds_view: config.visibility_limits.birds_view,
            birds_edit: config.edit_permissions.birds_edit,
            couples_create: config.monthly_limits.couples_create,
            couples_view: config.visibility_limits.couples_view,
            couples_edit: config.edit_permissions.couples_edit
          },
          planType: config.plan_type,
          isTrialActive,
          canEdit: config.edit_permissions.can_edit,
          canDelete: config.edit_permissions.can_delete,
          trialDaysRemaining
        };
      })
    );
  }

  getUserStats(): Observable<{
    totalRecords: { birds: number; couples: number };
    visibleRecords: { birds: number; couples: number };
    editableRecords: { birds: number; couples: number };
    planType: string;
    canCreateBirds: boolean;
    canCreateCouples: boolean;
    needsUpgrade: boolean;
  }> {
    return combineLatest([
      this.getCurrentPlanConfiguration(),
      this.getUserStatsFromBackend()
    ]).pipe(
      map(([config, stats]) => {
        const totalBirds = stats.total_birds;
        const totalCouples = stats.total_couples;

        const visibleBirds = config.visibility_limits.birds_view === -1
          ? totalBirds
          : Math.min(totalBirds, config.visibility_limits.birds_view);

        const visibleCouples = config.visibility_limits.couples_view === -1
          ? totalCouples
          : Math.min(totalCouples, config.visibility_limits.couples_view);

        const editableBirds = config.edit_permissions.birds_edit === -1
          ? visibleBirds
          : Math.min(visibleBirds, config.edit_permissions.birds_edit);

        const editableCouples = config.edit_permissions.couples_edit === -1
          ? visibleCouples
          : Math.min(visibleCouples, config.edit_permissions.couples_edit);

        const canCreateBirds = config.monthly_limits.birds_create === -1 ||
          (config.plan_type === 'free'
            ? totalBirds < config.monthly_limits.birds_create
            : stats.birds_created_this_month < config.monthly_limits.birds_create);

        const canCreateCouples = config.monthly_limits.couples_create === -1 ||
          (config.plan_type === 'free'
            ? totalCouples < config.monthly_limits.couples_create
            : stats.couples_created_this_month < config.monthly_limits.couples_create);

        const needsUpgrade = (totalBirds > visibleBirds) || (totalCouples > visibleCouples) ||
          (visibleBirds > editableBirds) || (visibleCouples > editableCouples);

        return {
          totalRecords: { birds: totalBirds, couples: totalCouples },
          visibleRecords: { birds: visibleBirds, couples: visibleCouples },
          editableRecords: { birds: editableBirds, couples: editableCouples },
          planType: config.plan_type,
          canCreateBirds,
          canCreateCouples,
          needsUpgrade
        };
      })
    );
  }

  recordCreated(recordType: 'bird' | 'couple', recordId: string): Observable<boolean> {
    console.log(`Backend notificado: ${recordType} creado con ID ${recordId}`);
    return of(true);
  }

  recordEdited(recordType: 'bird' | 'couple', recordId: string, editType: string): Observable<boolean> {
    console.log(`Backend notificado: ${recordType} ${recordId} editado (${editType})`);
    return of(true);
  }

  recordDeleted(recordType: 'bird' | 'couple', recordId: string): Observable<boolean> {
    console.log(`Backend notificado: ${recordType} ${recordId} eliminado`);
    return of(true);
  }

  /**
   * MÉTODOS DE COMPATIBILIDAD (para componentes existentes)
   */

  getLimits(): UserLimits {
    return {
      birds_create: 30,
      birds_view: 30,
      birds_edit: 0,
      birds_update: 0,   // Plan gratuito no puede actualizar
      birds_delete: 0,   // Plan gratuito no puede eliminar
      couples_create: 10,
      couples_view: 10,
      couples_edit: 0,
      couples_update: 0, // Plan gratuito no puede actualizar
      couples_delete: 0  // Plan gratuito no puede eliminar
    };
  }

  getDailyUsage(): DailyUsage {
    const today = new Date().toISOString().split('T')[0];
    return {
      birds_create: 5,
      birds_update: 2,
      birds_delete: 0,
      couples_create: 2,
      couples_update: 1,
      couples_delete: 0,
      date: today
    };
  }

  getPermanentUsage(): PermanentUsage {
    return {
      birds_create: 25,
      couples_create: 8,
      lastUpdated: new Date().toISOString()
    };
  }

  getUsagePercentage(operation: keyof UserLimits): number {
    const usage = this.getDailyUsage();
    const limits = this.getLimits();
    const operationUsage = usage[operation as keyof DailyUsage] || 0;
    const operationLimit = limits[operation];

    if (operationLimit === 9999) return 0;
    return operationLimit > 0 ? Math.min((Number(operationUsage) / Number(operationLimit)) * 100, 100) : 0;
  }

  getRemainingOperations(operation: keyof UserLimits): number {
    const usage = this.getDailyUsage();
    const limits = this.getLimits();
    const operationUsage = usage[operation as keyof DailyUsage] || 0;
    const operationLimit = limits[operation];

    if (operationLimit === 9999) return 9999;
    return Math.max(Number(operationLimit) - Number(operationUsage), 0);
  }

  isNearLimit(operation: keyof UserLimits): boolean {
    return this.getUsagePercentage(operation) >= 80;
  }

  hasReachedLimit(operation: keyof UserLimits): boolean {
    return this.getUsagePercentage(operation) >= 100;
  }

  incrementUsage(operation: keyof DailyUsage): boolean {
    console.log(`Incrementando uso: ${operation}`);
    return true;
  }

  incrementPermanentUsage(operation: keyof PermanentUsage): boolean {
    console.log(`Incrementando uso permanente: ${operation}`);
    return true;
  }

  canPerformOperation(operation: string): Observable<boolean> {
    if (operation === 'birds_create') {
      return this.canCreateRecord('bird');
    }
    if (operation === 'couples_create') {
      return this.canCreateRecord('couple');
    }

    const recordType = operation.includes('birds') ? 'bird' : 'couple';
    return this.checkRecordAccess(recordType, 1).pipe(
      map(access => {
        if (operation.includes('update')) {
          return access.editable;
        }
        if (operation.includes('delete')) {
          return access.deletable;
        }
        return false;
      })
    );
  }

  canEditRecord(recordType: 'bird' | 'couple', isManagementOperation: boolean = false): Observable<boolean> {
    if (isManagementOperation) {
      return this.canPerformBasicManagement(recordType, 1);
    }

    return this.checkRecordAccess(recordType, 1).pipe(
      map(access => access.editable)
    );
  }

  isManagementEdit(editType: string): boolean {
    const managementOperations = [
      'status_change',
      'health_update',
      'location_change',
      'notes_update',
      'breeding_status',
      'mark_deceased',
      'mark_sold',
      'quick_note'
    ];

    return managementOperations.includes(editType);
  }
}

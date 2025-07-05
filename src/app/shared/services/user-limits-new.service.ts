import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
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
export class UserLimitsNewService {
    private authService = inject(AuthService);
    private subscriptionService = inject(SubscriptionService);

    private readonly DAILY_STORAGE_KEY = 'user_daily_usage';
    private readonly PERMANENT_STORAGE_KEY = 'user_permanent_usage';

    // Para compatibilidad con componentes existentes
    private currentLimits = new BehaviorSubject<UserLimits>({
        birds_create: 50,
        birds_update: 100,
        birds_delete: 20,
        couples_create: 50,
        couples_update: 100,
        couples_delete: 20
    });

    // Configuración de límites por tipo de plan
    private readonly PLAN_LIMITS = {
        free: {
            daily: {
                birds_create: 50,
                birds_update: 100,
                birds_delete: 20,
                couples_create: 50,
                couples_update: 100,
                couples_delete: 20
            },
            permanent: {
                birds_create: 300,
                couples_create: 200
            }
        },
        monthly: {
            daily: {
                birds_create: 200,
                birds_update: 400,
                birds_delete: 100,
                couples_create: 150,
                couples_update: 300,
                couples_delete: 75
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

    constructor() {
        // Actualizar límites cuando cambie el plan del usuario
        this.subscriptionService.getUserPlanType().subscribe(planType => {
            const planLimits = this.PLAN_LIMITS[planType];
            this.currentLimits.next({
                birds_create: planLimits.daily.birds_create === -1 ? 9999 : planLimits.daily.birds_create,
                birds_update: planLimits.daily.birds_update === -1 ? 9999 : planLimits.daily.birds_update,
                birds_delete: planLimits.daily.birds_delete === -1 ? 9999 : planLimits.daily.birds_delete,
                couples_create: planLimits.daily.couples_create === -1 ? 9999 : planLimits.daily.couples_create,
                couples_update: planLimits.daily.couples_update === -1 ? 9999 : planLimits.daily.couples_update,
                couples_delete: planLimits.daily.couples_delete === -1 ? 9999 : planLimits.daily.couples_delete,
            });
        });
    }

    /**
     * MÉTODOS PARA COMPATIBILIDAD CON COMPONENTES EXISTENTES
     */
    getLimits(): UserLimits {
        return this.currentLimits.value;
    }

    getDailyUsage(): DailyUsage {
        const today = new Date().toDateString();
        const stored = localStorage.getItem(this.DAILY_STORAGE_KEY);

        if (stored) {
            const usage = JSON.parse(stored);
            if (usage.date !== today) {
                return this.resetDailyUsage();
            }
            return usage;
        }

        return this.resetDailyUsage();
    }

    incrementUsage(operation: keyof UserLimits): void {
        const dailyUsage = this.getDailyUsage();
        dailyUsage[operation]++;
        localStorage.setItem(this.DAILY_STORAGE_KEY, JSON.stringify(dailyUsage));

        // Incrementar uso permanente para create operations
        if (operation === 'birds_create' || operation === 'couples_create') {
            const permanentUsage = this.getPermanentUsage();
            permanentUsage[operation]++;
            permanentUsage.lastUpdated = new Date().toISOString();
            localStorage.setItem(this.PERMANENT_STORAGE_KEY, JSON.stringify(permanentUsage));
        }
    }

    getUsagePercentage(operation: keyof UserLimits): number {
        const usage = this.getDailyUsage();
        const limits = this.getLimits();
        if (limits[operation] >= 9999) return 0; // Sin límite
        return Math.round((usage[operation] / limits[operation]) * 100);
    }

    getRemainingOperations(operation: keyof UserLimits): number {
        const usage = this.getDailyUsage();
        const limits = this.getLimits();
        if (limits[operation] >= 9999) return -1; // Sin límite
        return Math.max(0, limits[operation] - usage[operation]);
    }

    isNearLimit(operation: keyof UserLimits): boolean {
        return this.getUsagePercentage(operation) >= 80;
    }

    hasReachedLimit(operation: keyof UserLimits): boolean {
        return this.getUsagePercentage(operation) >= 100;
    }

    canPerformOperation(operation: keyof UserLimits): boolean {
        const usage = this.getDailyUsage();
        const limits = this.getLimits();

        // Verificar límite diario
        if (limits[operation] < 9999 && usage[operation] >= limits[operation]) {
            return false;
        }

        // Verificar límite permanente para create operations
        if (operation === 'birds_create' || operation === 'couples_create') {
            return this.canPerformPermanentOperation(operation);
        }

        return true;
    }

    /**
     * NUEVOS MÉTODOS PARA LÍMITES DETALLADOS
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

    getPermanentUsage(): PermanentUsage {
        const stored = localStorage.getItem(this.PERMANENT_STORAGE_KEY);

        if (stored) {
            return JSON.parse(stored);
        }

        return this.resetPermanentUsage();
    }

    getPlanInfo(): Observable<{ planType: string, dailyUnlimited: boolean, permanentUnlimited: boolean }> {
        return this.subscriptionService.getUserPlanType().pipe(
            map(planType => ({
                planType,
                dailyUnlimited: planType === 'semiannual' || planType === 'annual',
                permanentUnlimited: planType === 'annual'
            }))
        );
    }

    private canPerformPermanentOperation(operation: 'birds_create' | 'couples_create'): boolean {
        // Fallback sincrónico para compatibilidad
        const permanentUsage = this.getPermanentUsage();
        const defaultLimits = { birds_create: 300, couples_create: 200 };
        return permanentUsage[operation] < defaultLimits[operation];
    }

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

        localStorage.setItem(this.DAILY_STORAGE_KEY, JSON.stringify(usage));
        return usage;
    }

    private resetPermanentUsage(): PermanentUsage {
        const usage: PermanentUsage = {
            birds_create: 0,
            couples_create: 0,
            lastUpdated: new Date().toISOString()
        };

        localStorage.setItem(this.PERMANENT_STORAGE_KEY, JSON.stringify(usage));
        return usage;
    }

    resetPermanentCounters(): void {
        this.resetPermanentUsage();
    }
}

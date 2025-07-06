import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Auth, User } from '@angular/fire/auth';
import { EMPTY, Observable, from, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

function getCurrentUserSafe(auth: Auth): Promise<User | undefined> {
  return auth.currentUser ? Promise.resolve(auth.currentUser) : Promise.resolve(undefined);
}

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private _userSubscription = signal<any | null>(null);
  private _loading = signal<boolean>(false);
  private _error = signal<any | null>(null);

  readonly userSubscription = computed(() => this._userSubscription());
  readonly userSubscription$ = toObservable(this.userSubscription);
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  constructor(private http: HttpClient, private auth: Auth) {
    // Cargar automáticamente la suscripción al iniciar sesión
    effect(() => {
      getCurrentUserSafe(this.auth).then(user => {
        if (user && user.uid) {
          this.refreshUserSubscription();
        } else {
          this._userSubscription.set(null);
        }
      });
    });
  }

  /**
   * Refresca la suscripción del usuario desde el backend y actualiza el signal.
   */
  refreshUserSubscription(): void {
    console.log('🔍 [DEBUG] refreshUserSubscription llamado');
    this._loading.set(true);
    this._error.set(null);

    // MOCK DESHABILITADO: Usando datos reales de Firestore
    // Los mocks están comentados para usar suscripciones reales con Mercado Pago

    // Código original activado para usar datos reales
    getCurrentUserSafe(this.auth).then(user => {
      if (!user || !user.uid) {
        this._userSubscription.set(null);
        this._loading.set(false);
        return;
      }
      this.http.get(`/api/getUserSubscription?uid=${user.uid}`, {
        observe: 'response',
        responseType: 'text'
      }).subscribe({
        next: httpResponse => {
          try {
            const parsedResponse = JSON.parse(httpResponse.body || 'null');
            if (parsedResponse && typeof parsedResponse === 'object' && 'hasSubscription' in parsedResponse) {
              const result = parsedResponse.hasSubscription ? parsedResponse.subscription : null;
              this._userSubscription.set(result);
            } else {
              this._userSubscription.set(null);
            }
          } catch (e) {
            this._error.set(e);
            this._userSubscription.set(null);
          }
          this._loading.set(false);
        },
        error: error => {
          this._error.set(error);
          this._userSubscription.set(null);
          this._loading.set(false);
        }
      });
    });
  }

  /**
   * Devuelve la suscripción actual como signal reactivo.
   */
  getUserSubscriptionSignal() {
    return this.userSubscription;
  }

  /**
   * Métodos legacy para compatibilidad (devuelven Observable, pero usan el signal interno)
   *
   * ¡DEPRECATED! Usar userSubscription$ directamente.
   */
  // getUserSubscription(): Observable<any> {
  //   return toObservable(this.userSubscription);
  // }

  createCheckoutPreference(planId: string): Observable<string> {
    return from(getCurrentUserSafe(this.auth)).pipe(
      switchMap(user => {
        if (!user || !user.uid) return EMPTY;
        return this.http.post<{ init_point: string }>(
          '/api/createPreference',
          { planId, uid: user.uid }
        ).pipe(
          switchMap(res => [res.init_point])
        );
      })
    );
  }
  // Método para obtener historial de suscripciones
  getSubscriptionHistory(): Observable<any[]> {
    return from(getCurrentUserSafe(this.auth)).pipe(
      switchMap(user => {
        if (!user || !user.uid) return of([]);

        return this.http.get(`/api/getSubscriptionHistory?uid=${user.uid}`, {
          observe: 'response',
          responseType: 'text'
        }).pipe(
          map(httpResponse => {
            try {
              const parsedResponse = JSON.parse(httpResponse.body || '{"history": []}');
              return parsedResponse.history || [];
            } catch (e) {
              console.error('Error parsing history response:', e);
              return [];
            }
          }),
          catchError(error => {
            console.error('Error fetching subscription history:', error);
            return of([]);
          })
        );
      }),
      catchError(error => {
        console.error('Error getting current user for history:', error);
        return of([]);
      })
    );
  }

  // Obtener el tipo de plan del usuario (free, monthly, semiannual, annual)
  getUserPlanType(): Observable<'free' | 'monthly' | 'semiannual' | 'annual'> {
    return toObservable(computed(() => {
      const subscription = this._userSubscription();
      if (!subscription || subscription.status !== 'active') {
        return 'free';
      }
      return subscription.plan as 'monthly' | 'semiannual' | 'annual';
    }));
  }

  // Verificar si el usuario tiene suscripción activa
  hasActiveSubscription(): Observable<boolean> {
    return toObservable(computed(() => {
      const subscription = this._userSubscription();
      if (!subscription) return false;
      const now = new Date();
      const expiryDate = new Date(subscription.expiryDate);
      return subscription.status === 'active' && expiryDate > now;
    }));
  }

  // Verificar si el usuario es premium (cualquier plan pagado activo)
  isPremiumUser(): Observable<boolean> {
    return toObservable(computed(() => {
      const subscription = this._userSubscription();
      if (!subscription || subscription.status !== 'active') return false;
      return subscription.plan !== 'free';
    }));
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Auth, User } from '@angular/fire/auth';
import { EMPTY, Observable, from, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

function getCurrentUserSafe(auth: Auth): Promise<User | undefined> {
  return auth.currentUser ? Promise.resolve(auth.currentUser) : Promise.resolve(undefined);
}

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  constructor(private http: HttpClient, private auth: Auth) { }
  getUserSubscription(): Observable<any> {
    console.log('🔍 SubscriptionService: Iniciando getUserSubscription');
    return from(getCurrentUserSafe(this.auth)).pipe(
      switchMap(user => {
        console.log('👤 SubscriptionService: Usuario obtenido:', user);
        if (!user || !user.uid) {
          console.log('❌ SubscriptionService: No hay usuario autenticado');
          return of(null);
        }

        console.log('📡 SubscriptionService: Making request to:', `/api/getUserSubscription?uid=${user.uid}`);

        return this.http.get(`/api/getUserSubscription?uid=${user.uid}`, {
          observe: 'response',
          responseType: 'text'
        }).pipe(
          map(httpResponse => {
            console.log('📥 SubscriptionService: Raw response:', httpResponse);
            console.log('📥 SubscriptionService: Response body:', httpResponse.body);
            console.log('📥 SubscriptionService: Response status:', httpResponse.status);

            try {
              const parsedResponse = JSON.parse(httpResponse.body || 'null');
              console.log('📋 SubscriptionService: Parsed response:', parsedResponse);

              if (parsedResponse && typeof parsedResponse === 'object' && 'hasSubscription' in parsedResponse) {
                const result = parsedResponse.hasSubscription ? parsedResponse.subscription : null;
                console.log('✅ SubscriptionService: Returning subscription:', result);
                return result;
              }

              console.log('⚠️ SubscriptionService: Response format not recognized, returning null');
              return null;
            } catch (e) {
              console.error('❌ SubscriptionService: Error parsing response:', e);
              return null;
            }
          }),
          catchError(error => {
            console.error('❌ SubscriptionService: Error getting subscription:', error);
            console.error('❌ SubscriptionService: Error details:', {
              status: error.status,
              statusText: error.statusText,
              message: error.message,
              error: error.error
            });
            return of(null);
          })
        );
      })
    );
  }

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
    return this.getUserSubscription().pipe(
      map(subscription => {
        if (!subscription || subscription.status !== 'active') {
          return 'free';
        }
        return subscription.plan as 'monthly' | 'semiannual' | 'annual';
      })
    );
  }

  // Verificar si el usuario tiene suscripción activa
  hasActiveSubscription(): Observable<boolean> {
    return this.getUserSubscription().pipe(
      map(subscription => {
        if (!subscription) return false;

        const now = new Date();
        const expiryDate = new Date(subscription.expiryDate);

        return subscription.status === 'active' && expiryDate > now;
      })
    );
  }

  // Verificar si el usuario es premium (cualquier plan pagado activo)
  isPremiumUser(): Observable<boolean> {
    return this.getUserPlanType().pipe(
      map(planType => planType !== 'free')
    );
  }
}

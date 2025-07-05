import { Routes } from '@angular/router';

export const SUBSCRIPTION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./subscription.component').then(m => m.SubscriptionComponent)
  },
  {
    path: 'success',
    loadComponent: () => import('./pages/success.component').then(m => m.SubscriptionSuccessComponent)
  },
  {
    path: 'error',
    loadComponent: () => import('./pages/error.component').then(m => m.SubscriptionErrorComponent)
  },
  {
    path: 'pending',
    loadComponent: () => import('./pages/pending.component').then(m => m.SubscriptionPendingComponent)
  }
];

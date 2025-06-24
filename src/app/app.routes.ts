import { Routes } from '@angular/router';
import { privateGuard, publicGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    canActivateChild: [publicGuard()],
    path: 'auth', loadChildren: () => import('./auth/auth.routes').then(m => m.routes)
  },
  {
    canActivateChild: [privateGuard()],
    loadComponent: () => import('./shared/layout.component').then(m => m.LayoutComponent),
    path: 'birds', loadChildren: () => import('./birds/birds.routes').then(m => m.routes)
  },
  {
    path: '**', redirectTo: '/birds'
  }
];

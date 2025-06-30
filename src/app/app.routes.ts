import { Routes } from '@angular/router';
import { privateGuard, publicGuard } from './core/auth.guard';
import { emailVerifiedGuard } from './core/email-verified.guard';

export const routes: Routes = [
  {
    path: 'auth/sign-in',
    canActivate: [publicGuard()],
    loadComponent: () => import('./auth/pages/sign-in/sign-in.component').then(m => m.SignInComponent)
  },
  {
    path: 'auth/sign-up',
    canActivate: [publicGuard()],
    loadComponent: () => import('./auth/pages/sign-up/sign-up.component').then(m => m.SignUpComponent)
  },
  {
    path: 'auth/email-verification',
    canActivate: [privateGuard()],
    loadComponent: () => import('./shared/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./auth/pages/email-verification/email-verification.component').then(m => m.EmailVerificationComponent)
      }
    ]
  },
  {
    canActivateChild: [privateGuard()],
    loadComponent: () => import('./shared/layout.component').then(m => m.LayoutComponent),
    path: 'birds', loadChildren: () => import('./birds/birds.routes').then(m => m.routes)
  },
  {
    canActivateChild: [privateGuard()],
    loadComponent: () => import('./shared/layout.component').then(m => m.LayoutComponent),
    path: 'nomenclator', loadChildren: () => import('./nomenclator/nomenclator.routes').then(m => m.routes)
  },
  {
    canActivateChild: [privateGuard()],
    loadComponent: () => import('./shared/layout.component').then(m => m.LayoutComponent),
    path: 'couples', loadChildren: () => import('./couples/couples.routes').then(m => m.routes)
  },
  {
    canActivateChild: [privateGuard()],
    path: 'contact',
    loadComponent: () => import('./shared/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./shared/contact.component').then(m => m.ContactComponent)
      }
    ]
  },
  {
    path: '**', redirectTo: '/birds'
  }
];

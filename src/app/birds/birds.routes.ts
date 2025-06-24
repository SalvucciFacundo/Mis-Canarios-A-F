import { BirdsListComponent } from './pages/birds-list/birds-list.component';
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'birds-list',
    loadComponent: () => import('./pages/birds-list/birds-list.component').then(m => m.BirdsListComponent)
  },
  {
    path: 'birds-create',
    loadComponent: () => import('./pages/birds-add/birds-add.component').then(m => m.BirdsAddComponent)
  },
  {
    path: '**', redirectTo: 'birds-list'
  }
];

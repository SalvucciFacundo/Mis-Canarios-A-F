import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'birds-list',
    loadComponent: () => import('./pages/birds-list/birds-list.component').then(m => m.BirdsListComponent)
  },
  {
    path: 'birds-add',
    loadComponent: () => import('./pages/birds-add/birds-add.component').then(m => m.BirdsAddComponent)
  },
  {
    path: 'birds-details/:id',
    loadComponent: () => import('./pages/birds-details/birds-details.component').then(m => m.BirdsDetailsComponent)
  },
  {
    path: 'birds-edit/:id',
    loadComponent: () => import('./pages/birds-edit/birds-edit.component').then(m => m.BirdsEditComponent)
  },
  {
    path: '**', redirectTo: 'birds-list'
  }
];

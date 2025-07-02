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
    loadComponent: () => import('./pages/bird-details/bird-details.component').then(m => m.BirdDetailsComponent)
  },
  {
    path: 'birds-edit/:id',
    loadComponent: () => import('./pages/bird-edit/bird-edit.component').then(m => m.BirdEditComponent)
  },
  {
    path: '**', redirectTo: 'birds-list'
  }
];

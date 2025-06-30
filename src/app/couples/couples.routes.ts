import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'couples-list',
    loadComponent: () => import('./pages/couples-list/couples-list.component').then(m => m.CouplesListComponent)
  },
  {
    path: '**', redirectTo: 'couples-list'
  }
];

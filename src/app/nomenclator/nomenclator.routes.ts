import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'nomenclator-list',
    loadComponent: () => import('./pages/nomenclator-list/nomenclator-list.component').then(m => m.NomenclatorListComponent)
  },
  {
    path: '**', redirectTo: 'nomenclator-list'
  }
];

import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'couples-list',
    loadComponent: () => import('./pages/couples-list/couples-list.component').then(m => m.CouplesListComponent)
  },
  {
    path: 'couples-add',
    loadComponent: () => import('./pages/couples-add/couples-add.component').then(m => m.CouplesAddComponent)
  },
  {
    path: 'couples-edit/:id',
    loadComponent: () => import('./pages/couples-edit/couples-edit.component').then(m => m.CouplesEditComponent)
  },
  {
    path: 'couples-details/:id',
    loadComponent: () => import('./pages/couples-details/couples-details.component').then(m => m.CouplesDetailsComponent)
  },
  {
    path: '',
    redirectTo: 'couples-list',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'couples-list'
  }
];

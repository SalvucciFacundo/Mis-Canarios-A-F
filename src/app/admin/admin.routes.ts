import { Routes } from '@angular/router';
import { permisoGuard } from '../core/permiso.guard';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { AdminBirdsListComponent } from './pages/admin-birds-list/admin-birds-list.component';
import { AdminCouplesListComponent } from './pages/admin-couples-list/admin-couples-list.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { AdminNomenclatorListComponent } from './pages/admin-nomenclator-list/admin-nomenclator-list.component';
import { AdminRolesListComponent } from './pages/admin-roles-list/admin-roles-list.component';
import { AdminUsersListComponent } from './pages/admin-users-list/admin-users-list.component';

/**
 * Rutas del panel de administración. Protegidas por el guard de admin.
 */
const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    //canActivate: [adminAuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'users', component: AdminUsersListComponent },
      { path: 'nomenclators', component: AdminNomenclatorListComponent },
      { path: 'birds', component: AdminBirdsListComponent },
      { path: 'couples', component: AdminCouplesListComponent },
      { path: 'roles', component: AdminRolesListComponent },
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];

export default adminRoutes;

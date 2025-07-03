import { Routes } from '@angular/router';
import { adminAuthGuard } from './services/admin-auth-guard.service';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { AdminBirdsListComponent } from './pages/admin-birds-list/admin-birds-list.component';
import { AdminUsersListComponent } from './pages/admin-users-list/admin-users-list.component';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { AdminNomenclatorListComponent } from './pages/admin-nomenclator-list/admin-nomenclator-list.component';
import { AdminCouplesListComponent } from './pages/admin-couples-list/admin-couples-list.component';

/**
 * Rutas del panel de administración. Protegidas por el guard de admin.
 */
export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [adminAuthGuard],
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'users', component: AdminUsersListComponent },
      { path: 'nomenclators', component: AdminNomenclatorListComponent },
      { path: 'birds', component: AdminBirdsListComponent },
      { path: 'couples', component: AdminCouplesListComponent },
    ]
  }
];

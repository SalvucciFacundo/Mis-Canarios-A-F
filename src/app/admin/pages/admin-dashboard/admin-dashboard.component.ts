import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RolesStoreService } from '../../../auth/services/roles-store.service';
import { ToastService } from '../../../shared/services/toast.service';

/**
 * Dashboard principal del panel de administración.
 */
@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent {
  constructor(
    private rolesStore: RolesStoreService,
    private toast: ToastService
  ) { }

  async poblarRolesBase() {
    await this.rolesStore.createDefaultRoles();
    this.toast.success('Roles base creados');
  }
}

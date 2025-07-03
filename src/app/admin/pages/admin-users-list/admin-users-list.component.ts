import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersStoreService } from '../../../auth/services/users-store.service';
import { User } from '../../../auth/interface/user.interface';

/**
 * Lista de usuarios para administración.
 */
@Component({
  selector: 'app-admin-users-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-users-list.component.html',
  styleUrls: ['./admin-users-list.component.css']
})
export class AdminUsersListComponent {
  users = computed(() => this.usersStore.users());
  loading = computed(() => this.usersStore.loading());
  error = computed(() => this.usersStore.error());

  constructor(private usersStore: UsersStoreService) {
    this.usersStore.getAllUsersForAdmin().catch(() => { });
  }
}

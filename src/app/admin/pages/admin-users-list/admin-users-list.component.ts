import { CommonModule } from '@angular/common';
import { Component, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from '../../../auth/interface/user.interface';
import { AuthService } from '../../../auth/services/auth.service';
import { RolesStoreService } from '../../../auth/services/roles-store.service';
import { UsersStoreService } from '../../../auth/services/users-store.service';
import { ToastService } from '../../../shared/services/toast.service';

/**
 * Lista de usuarios para administración.
 */
@Component({
  selector: 'app-admin-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users-list.component.html',
  styleUrls: ['./admin-users-list.component.css']
})
export class AdminUsersListComponent {
  users = computed(() => this.usersStore.users());
  loading = computed(() => this.usersStore.loading());
  error = computed(() => this.usersStore.error());

  search = '';
  originalUsers: Record<string, User> = {};
  currentUser: User | null = null;
  editing: Record<string, boolean> = {};

  // Paginación
  page = 1;
  pageSize = 10;
  pageSizes = [5, 10, 15, 20];

  roles: { id: string, name: string }[] = [];

  get filteredUsers(): User[] {
    const term = this.search.toLowerCase();
    return this.users().filter(u =>
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term)
    );
  }

  get pagedUsers(): User[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredUsers.length / this.pageSize));
  }

  setPageSize(size: number) {
    this.pageSize = size;
    this.page = 1;
  }

  prevPage() {
    if (this.page > 1) this.page--;
  }

  nextPage() {
    if (this.page < this.totalPages) this.page++;
  }

  constructor(
    private usersStore: UsersStoreService,
    private authService: AuthService,
    private toast: ToastService,
    private rolesStore: RolesStoreService
  ) {
    this.usersStore.getAllUsersForAdmin().then(() => {
      this.users().forEach(u => this.originalUsers[u.uid] = { ...u });
    }).catch(() => { });
    // Suscribirse al signal reactivo para mantener currentUser actualizado
    effect(() => {
      this.currentUser = this.authService.currentUser();
    });
    this.loadRoles();
  }

  async loadRoles() {
    const roles = await this.rolesStore.getAllRoles();
    this.roles = roles.map(r => ({ id: r.id, name: r.name }));
  }

  async poblarRolesBase() {
    await this.rolesStore.createDefaultRoles();
    await this.loadRoles();
    this.toast.success('Roles base creados');
  }

  setEdit(user: User, value: boolean) {
    this.editing[user.uid] = value;
    if (!value) {
      this.resetUser(user);
    }
  }

  isEditing(user: User): boolean {
    return !!this.editing[user.uid];
  }

  hasPermiso(permiso: string): boolean {
    const userRoleId = this.currentUser?.role;
    // Buscar el rol completo en el store reactivo de roles
    const role = this.rolesStore.roles().find(r => r.id === userRoleId);
    return !!role && Array.isArray(role.permisos) && role.permisos.includes(permiso);
  }

  async saveUser(user: User) {
    if (!this.currentUser || !this.hasPermiso('admin.users.edit')) {
      this.toast.error('No tienes permisos para modificar usuarios');
      return;
    }
    if (user.uid === this.currentUser.uid) {
      this.toast.warning('No puedes modificarte a ti mismo desde aquí');
      return;
    }
    try {
      await this.usersStore.updateUser(user);
      this.originalUsers[user.uid] = { ...user };
      this.toast.success('Usuario guardado correctamente');
      this.setEdit(user, false);
    } catch (e: any) {
      this.toast.error(e.message || 'Error al guardar usuario');
    }
  }

  resetUser(user: User) {
    const original = this.originalUsers[user.uid];
    if (original) {
      Object.assign(user, original);
    }
  }

  resetPassword(user: User) {
    alert('Funcionalidad de reset de contraseña para: ' + user.email);
  }

  toggleActive(user: User) {
    if (!this.currentUser || !this.hasPermiso('admin.users.edit')) {
      this.toast.error('No tienes permisos para modificar usuarios');
      return;
    }
    if (user.uid === this.currentUser.uid) {
      this.toast.warning('No puedes desactivarte a ti mismo');
      return;
    }
    user.active = !user.active;
    this.saveUser(user);
    this.toast.info(user.active ? 'Usuario activado' : 'Usuario desactivado');
  }

  async deleteUser(user: User) {
    if (!this.currentUser || !this.hasPermiso('admin.users.edit')) {
      this.toast.error('No tienes permisos para eliminar usuarios');
      return;
    }
    if (user.uid === this.currentUser.uid) {
      this.toast.warning('No puedes eliminarte a ti mismo');
      return;
    }
    if (confirm('¿Seguro que deseas eliminar este usuario?')) {
      try {
        await this.usersStore.deleteUser(user.uid);
        this.toast.success('Usuario eliminado correctamente');
      } catch (e: any) {
        this.toast.error(e.message || 'Error al eliminar usuario');
      }
    }
  }

  getRoleName(roleId: string): string {
    const found = this.rolesStore.roles().find(r => r.id === roleId);
    return found?.name || 'Sin rol';
  }

  trackByUid(index: number, user: User) {
    return user.uid;
  }
}

/**
 * ¿Cómo agregar/editar/eliminar roles?
 *
 * 1. Para agregar un nuevo rol:
 *    - Añade el nuevo valor en la interfaz User (user.interface.ts) en la propiedad role.
 *    - Agrega una opción <option value="nuevoRol">Nombre Rol</option> en el <select> de roles en el HTML.
 *    - Ajusta la lógica de guards y validaciones si el nuevo rol requiere permisos especiales.
 *
 * 2. Para eliminar un rol:
 *    - Elimina el valor de la interfaz y del <select>.
 *    - Asegúrate de migrar usuarios existentes con ese rol a otro permitido.
 *
 * 3. Para editar el nombre de un rol:
 *    - Cambia el label en el <option> del <select> (el value debe coincidir con el backend).
 *    - Si cambias el value, actualiza la interfaz y la base de datos.
 */

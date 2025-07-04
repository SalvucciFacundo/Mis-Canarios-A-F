import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Role } from '../../../auth/interface/role.interface';
import { RolesStoreService } from '../../../auth/services/roles-store.service';

@Component({
    selector: 'app-admin-roles-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './admin-roles-list.component.html',
    styleUrls: ['./admin-roles-list.component.css']
})
export class AdminRolesListComponent {
    roles: Role[] = [];
    loading = false;
    error: string | null = null;
    editRole: Role | null = null;
    newRole: Partial<Role> = { name: '', permisos: [] };
    allPermisos: string[] = [
        'admin.dashboard', 'admin.users.view', 'admin.users.edit', 'admin.roles.manage',
        'birds.view', 'birds.edit', 'nomenclators.view', 'nomenclators.edit', 'couples.view', 'couples.edit'
    ];

    constructor(private rolesStore: RolesStoreService) {
        this.loadRoles();
    }

    async loadRoles() {
        this.loading = true;
        try {
            this.roles = await this.rolesStore.getAllRoles();
        } catch (e: any) {
            this.error = e.message || 'Error al cargar roles';
        } finally {
            this.loading = false;
        }
    }

    setEditRole(role: Role | null) {
        this.editRole = role ? { ...role } : null;
    }

    async saveEditRole() {
        if (this.editRole) {
            await this.rolesStore.updateRole(this.editRole);
            this.setEditRole(null);
            this.loadRoles();
        }
    }

    async deleteRole(role: Role) {
        if (confirm('¿Eliminar este rol?')) {
            await this.rolesStore.deleteRole(role.id);
            this.loadRoles();
        }
    }

    async addRole() {
        if (this.newRole.name && this.newRole.permisos) {
            await this.rolesStore.addRole({ name: this.newRole.name, permisos: this.newRole.permisos });
            this.newRole = { name: '', permisos: [] };
            this.loadRoles();
        }
    }

    togglePermiso(role: Role | Partial<Role>, permiso: string) {
        if (!role.permisos) role.permisos = [];
        if (role.permisos.includes(permiso)) {
            role.permisos = role.permisos.filter(p => p !== permiso);
        } else {
            role.permisos.push(permiso);
        }
    }

    async poblarRolesBase() {
        await this.rolesStore.createDefaultRoles();
        this.loadRoles();
    }
}

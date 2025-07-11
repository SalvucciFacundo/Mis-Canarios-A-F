import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Role } from '../../../auth/interface/role.interface';
import { RolesStoreService } from '../../../auth/services/roles-store.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
    selector: 'app-admin-roles-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './admin-roles-list.component.html',
    styleUrls: ['./admin-roles-list.component.css']
})
export class AdminRolesListComponent {
    // Signals para estado reactivo
    loading = computed(() => this.rolesStore.loading());
    error = computed(() => this.rolesStore.error());
    roles = computed(() => this.rolesStore.roles());

    editRole = signal<Role | null>(null);
    newRole = signal<{ id: string; name: string; permisos: string[] }>({ id: '', name: '', permisos: [] });

    allPermisos: string[] = [
        'admin.dashboard', 'admin.users.view', 'admin.users.edit', 'admin.roles.manage',
        'birds.view', 'birds.edit', 'nomenclators.view', 'nomenclators.edit', 'couples.view', 'couples.edit',
        'subscriber.limits' // Agregado el permiso de límites de suscripción
    ];

    constructor(private rolesStore: RolesStoreService, private toast: ToastService) {
        this.loadRoles();
    }

    async loadRoles() {
        try {
            await this.rolesStore.getAllRoles();
        } catch (e: any) {
            console.error('Error al cargar roles:', e);
        }
    }

    setEditRole(role: Role | null) {
        this.editRole.set(role ? { ...role } : null);
    }

    async saveEditRole() {
        const role = this.editRole();
        if (role) {
            try {
                await this.rolesStore.updateRole(role);
                this.setEditRole(null);
                await this.loadRoles();
            } catch (e: any) {
                console.error('Error al actualizar rol:', e);
            }
        }
    }

    async deleteRole(role: Role) {
        if (confirm('¿Eliminar este rol?')) {
            try {
                await this.rolesStore.deleteRole(role.id);
                await this.loadRoles();
            } catch (e: any) {
                console.error('Error al eliminar rol:', e);
            }
        }
    }

    async addRole() {
        const newRole = this.newRole();
        if (newRole.id && newRole.name && newRole.permisos) {
            try {
                // Crear el documento con ID lógico
                await this.rolesStore.addRoleWithId(newRole.id, { name: newRole.name, permisos: newRole.permisos });
                this.newRole.set({ id: '', name: '', permisos: [] });
                await this.loadRoles();
            } catch (e: any) {
                this.toast?.error?.('Error al crear rol: ' + (e.message || ''));
            }
        } else {
            this.toast?.error?.('Debes completar el ID, nombre y al menos un permiso');
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
        try {
            await this.rolesStore.createDefaultRoles();
            await this.loadRoles();
        } catch (e: any) {
            console.error('Error al crear roles base:', e);
        }
    }

    // Poblar roles base con IDs lógicos
    async poblarRolesBaseConIdLogico() {
        const baseRoles = [
            {
                id: 'user',
                name: 'user',
                permisos: [
                    'site.navegar',
                    'birds.view',
                    'nomenclators.view',
                    'couples.view'
                ]
            },
            {
                id: 'subscriber',
                name: 'subscriber',
                permisos: [
                    'site.navegar',
                    'birds.view',
                    'nomenclators.view',
                    'couples.view',
                    'subscriber.limits'
                ]
            },
            {
                id: 'admin',
                name: 'admin',
                permisos: [
                    'site.navegar',
                    'admin.dashboard',
                    'admin.users.view',
                    'admin.users.edit',
                    'admin.roles.manage',
                    'birds.view',
                    'birds.edit',
                    'nomenclators.view',
                    'nomenclators.edit',
                    'couples.view',
                    'couples.edit'
                ]
            }
        ];
        for (const role of baseRoles) {
            await this.rolesStore.addRoleWithId(role.id, { name: role.name, permisos: role.permisos });
        }
        await this.loadRoles();
    }

    // Manejo de cambios en el nombre del rol en edición (para signals)
    onEditRoleNameChange(name: string) {
        const role = this.editRole();
        if (role) this.editRole.set({ ...role, name });
    }

    // Manejo de cambios en el nombre del nuevo rol (para signals)
    onNewRoleNameChange(name: string) {
        const role = this.newRole();
        this.newRole.set({ ...role, name });
    }

    // Manejo de cambios en el ID del nuevo rol (para signals)
    onNewRoleIdChange(id: string) {
        const role = this.newRole();
        this.newRole.set({ ...role, id });
    }
}

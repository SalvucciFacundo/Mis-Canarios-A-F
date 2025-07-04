import { Injectable, signal } from '@angular/core';
import { collection, deleteDoc, doc, getDocs, getFirestore, setDoc, updateDoc } from 'firebase/firestore';
import { Role } from '../interface/role.interface';

@Injectable({ providedIn: 'root' })
export class RolesStoreService {
    roles = signal<Role[]>([]);
    loading = signal<boolean>(false);
    error = signal<string | null>(null);

    async getAllRoles(): Promise<Role[]> {
        this.loading.set(true);
        this.error.set(null);
        try {
            const db = getFirestore();
            const snap = await getDocs(collection(db, 'roles'));
            const roles: Role[] = snap.docs.map(docu => ({ id: docu.id, ...docu.data() } as Role));
            this.roles.set(roles);
            return roles;
        } catch (e) {
            this.error.set('Error al cargar roles');
            throw e;
        } finally {
            this.loading.set(false);
        }
    }

    async addRole(role: Omit<Role, 'id'>): Promise<void> {
        this.loading.set(true);
        try {
            const db = getFirestore();
            const ref = doc(collection(db, 'roles'));
            await setDoc(ref, role);
            await this.getAllRoles();
        } finally {
            this.loading.set(false);
        }
    }

    async updateRole(role: Role): Promise<void> {
        this.loading.set(true);
        try {
            const db = getFirestore();
            const ref = doc(db, 'roles', role.id);
            await updateDoc(ref, { name: role.name, permisos: role.permisos });
            await this.getAllRoles();
        } finally {
            this.loading.set(false);
        }
    }

    async deleteRole(id: string): Promise<void> {
        this.loading.set(true);
        try {
            const db = getFirestore();
            const ref = doc(db, 'roles', id);
            await deleteDoc(ref);
            await this.getAllRoles();
        } finally {
            this.loading.set(false);
        }
    }

    /**
     * Método temporal para poblar la colección roles con los roles base.
     */
    async createDefaultRoles(): Promise<void> {
        const baseRoles = [
            {
                name: 'user',
                permisos: [
                    'site.navegar',
                    'birds.view',
                    'nomenclators.view',
                    'couples.view'
                ]
            },
            {
                name: 'subscriber',
                permisos: [
                    'site.navegar',
                    'birds.view',
                    'nomenclators.view',
                    'couples.view',
                    'subscriber.limits' // para lógica futura
                ]
            },
            {
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
        const db = getFirestore();
        for (const role of baseRoles) {
            const ref = doc(collection(db, 'roles'));
            await setDoc(ref, role);
        }
        await this.getAllRoles();
    }
}

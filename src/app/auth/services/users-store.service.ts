import { Injectable, signal } from '@angular/core';
import { User } from '../interface/user.interface';
import { collection, getDocs, getFirestore } from 'firebase/firestore';

/**
 * Servicio store para gestión de usuarios (admin).
 * Expone métodos asíncronos y signals para estado reactivo.
 */
@Injectable({ providedIn: 'root' })
export class UsersStoreService {
    users = signal<User[]>([]);
    loading = signal<boolean>(false);
    error = signal<string | null>(null);

    /**
     * Obtiene todos los usuarios para administración.
     */
    async getAllUsersForAdmin(): Promise<User[]> {
        this.loading.set(true);
        this.error.set(null);
        try {
            const db = getFirestore();
            const usersSnap = await getDocs(collection(db, 'users'));
            const users: User[] = usersSnap.docs.map(doc => {
                const data = doc.data();
                return {
                    uid: doc.id,
                    name: data["name"] ?? '',
                    email: data["email"] ?? '',
                    role: data["role"] ?? 'user',
                    createdAt: data["createdAt"] ? new Date(data["createdAt"]) : undefined,
                    updatedAt: data["updatedAt"] ? new Date(data["updatedAt"]) : undefined,
                } satisfies User;
            });
            this.users.set(users);
            return users;
        } catch (e) {
            this.error.set('Error al cargar usuarios');
            throw e;
        } finally {
            this.loading.set(false);
        }
    }
}

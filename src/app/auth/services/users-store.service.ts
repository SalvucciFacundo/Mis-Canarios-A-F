import { Injectable, signal } from '@angular/core';
import { collection, deleteDoc, doc, getDocs, getFirestore, updateDoc } from 'firebase/firestore';
import { User } from '../interface/user.interface';
import { AuthService } from './auth.service';
import { RolesStoreService } from './roles-store.service';

/**
 * Servicio store para gestión de usuarios (admin).
 * Expone métodos asíncronos y signals para estado reactivo.
 */
@Injectable({ providedIn: 'root' })
export class UsersStoreService {
  users = signal<User[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor(private authService: AuthService, private rolesStore: RolesStoreService) { }

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
          createdAt: data["createdAt"] && typeof data["createdAt"].toDate === 'function'
            ? data["createdAt"].toDate()
            : (typeof data["createdAt"] === 'string' && !isNaN(Date.parse(data["createdAt"])))
              ? new Date(data["createdAt"])
              : undefined,
          updatedAt: data["updatedAt"] && typeof data["updatedAt"].toDate === 'function'
            ? data["updatedAt"].toDate()
            : (typeof data["updatedAt"] === 'string' && !isNaN(Date.parse(data["updatedAt"])))
              ? new Date(data["updatedAt"])
              : undefined,
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

  private hasPermiso(permiso: string): boolean {
    const current = this.authService.currentUser();
    const userRoleId = current?.role;
    const role = this.rolesStore.roles().find(r => r.id === userRoleId);
    return !!role && Array.isArray(role.permisos) && role.permisos.includes(permiso);
  }

  /**
   * Actualiza un usuario en Firestore. Solo admin puede hacerlo.
   */
  async updateUser(user: User): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const current = this.authService.currentUser();
      if (!current || !this.hasPermiso('admin.users.edit')) throw new Error('Solo un administrador puede modificar usuarios');
      if (user.uid === current.uid) throw new Error('No puedes modificarte a ti mismo desde aquí');
      const db = getFirestore();
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active ?? true,
        updatedAt: new Date()
      });
      // Actualizar en el store local
      this.users.set(this.users().map(u => u.uid === user.uid ? { ...u, ...user } : u));
    } catch (e: any) {
      this.error.set(e.message || 'Error al actualizar usuario');
      throw e;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Elimina un usuario en Firestore. Solo admin puede hacerlo y no puede eliminarse a sí mismo.
   */
  async deleteUser(uid: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const current = this.authService.currentUser();
      if (!current || !this.hasPermiso('admin.users.edit')) throw new Error('Solo un administrador puede eliminar usuarios');
      if (uid === current.uid) throw new Error('No puedes eliminarte a ti mismo');
      const db = getFirestore();
      const userRef = doc(db, 'users', uid);
      await deleteDoc(userRef);
      // Actualizar en el store local
      this.users.set(this.users().filter(u => u.uid !== uid));
    } catch (e: any) {
      this.error.set(e.message || 'Error al eliminar usuario');
      throw e;
    } finally {
      this.loading.set(false);
    }
  }
}

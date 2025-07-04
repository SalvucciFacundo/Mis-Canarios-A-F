import { inject, Injectable, Injector, runInInjectionContext, signal } from '@angular/core';
import { Auth, authState, createUserWithEmailAndPassword, reload, sendEmailVerification, signInWithEmailAndPassword, updateProfile } from '@angular/fire/auth';
import { doc, Firestore, getDoc, setDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { ToastService } from '../../shared/services/toast.service';
import { User } from '../interface/user.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private toastService = inject(ToastService);
  private injector = inject(Injector);
  readonly currentUserEmail = signal<string | null>(null);
  readonly currentUser = signal<User | null>(null);
  readonly isEmailVerified = signal<boolean>(false);

  constructor(private _auth: Auth, private _firestore: Firestore) {
    // Usar runInInjectionContext para ejecutar authState en el contexto adecuado
    runInInjectionContext(this.injector, () => {
      this.initAuthStateListener();
    });
  }

  private initAuthStateListener() {
    authState(this._auth).subscribe(async (firebaseUser) => {
      this.currentUserEmail.set(firebaseUser?.email ?? null);
      this.isEmailVerified.set(firebaseUser?.emailVerified ?? false);

      if (firebaseUser) {
        await this.syncUserInFirestore(firebaseUser); // Sincroniza el usuario si no existe
        const userDoc = await this.getUserFromFirestore(firebaseUser.uid);
        this.currentUser.set(userDoc);
      } else {
        this.currentUser.set(null);
      }
    });
  }

  private async syncUserInFirestore(firebaseUser: { uid: string, email: string | null, displayName?: string | null }) {
    if (!firebaseUser.email) return; // No sincronizar si no hay email
    const userRef = doc(this._firestore, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      const userData: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await setDoc(userRef, userData);
      console.log('[AuthService] Usuario sincronizado en Firestore:', userData);
    }
  }

  async signUp(userData: { email: string; password: string; name?: string }) {
    try {
      const { email, password, name } = userData;

      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(this._auth, email, password);
      const firebaseUser = userCredential.user;

      // Actualizar el perfil con el nombre si se proporciona
      if (name) {
        await updateProfile(firebaseUser, { displayName: name });
      }

      // Enviar email de verificación
      await sendEmailVerification(firebaseUser);

      // Crear documento del usuario en Firestore
      const user: User = {
        uid: firebaseUser.uid,
        name: name || email.split('@')[0], // Usar nombre o parte del email
        email: email,
        role: 'user', // Rol por defecto
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.saveUserToFirestore(user);
      return userCredential;
    } catch (error: any) {
      console.error('Error al crear usuario:', error);

      // Mensajes de error más específicos
      let errorMessage = 'Error al crear el usuario';
      if (error?.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'Este correo electrónico ya está registrado';
            break;
          case 'auth/weak-password':
            errorMessage = 'La contraseña debe tener al menos 6 caracteres';
            break;
          case 'auth/invalid-email':
            errorMessage = 'El correo electrónico no es válido';
            break;
          default:
            errorMessage = `Error: ${error.message}`;
        }
      }

      this.toastService.error(errorMessage);
      throw error;
    }
  }

  async signIn(userData: { email: string; password: string }) {
    try {
      const result = await signInWithEmailAndPassword(this._auth, userData.email, userData.password);
      return result;
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);

      let errorMessage = 'Error al iniciar sesión';
      if (error?.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = 'Email o contraseña incorrectos';
            break;
          case 'auth/invalid-email':
            errorMessage = 'El correo electrónico no es válido';
            break;
          case 'auth/user-disabled':
            errorMessage = 'Esta cuenta ha sido deshabilitada';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Demasiados intentos. Intenta más tarde';
            break;
          default:
            errorMessage = `Error: ${error.message}`;
        }
      }

      this.toastService.error(errorMessage);
      throw error;
    }
  }

  async signOut() {
    try {
      const result = await this._auth.signOut();
      this.toastService.success('Sesión cerrada exitosamente');
      return result;
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error);
      this.toastService.error('Error al cerrar sesión');
      throw error;
    }
  }

  async sendEmailVerification(): Promise<void> {
    try {
      const user = this._auth.currentUser;
      if (user && !user.emailVerified) {
        await sendEmailVerification(user);
        this.toastService.success('Email de verificación enviado', 'Revisa tu bandeja de entrada');
      } else if (user?.emailVerified) {
        this.toastService.info('Tu email ya está verificado');
      } else {
        throw new Error('No user logged in');
      }
    } catch (error: any) {
      console.error('Error al enviar email de verificación:', error);
      this.toastService.error('Error al enviar el email de verificación');
      throw error;
    }
  }

  async reloadUser(): Promise<void> {
    try {
      const user = this._auth.currentUser;
      if (user) {
        await reload(user);
        this.isEmailVerified.set(user.emailVerified);
      }
    } catch (error: any) {
      console.error('Error al recargar usuario:', error);
      this.toastService.error('Error al actualizar información del usuario');
      throw error;
    }
  }

  async checkEmailVerification(): Promise<boolean> {
    await this.reloadUser();
    return this.isEmailVerified();
  }

  get authState$(): Observable<any> {
    return authState(this._auth);
  }

  private async saveUserToFirestore(user: User): Promise<void> {
    try {
      const userRef = doc(this._firestore, 'users', user.uid);
      await setDoc(userRef, user);
    } catch (error: any) {
      console.error('Error al guardar usuario en Firestore:', error);
      this.toastService.error('Error al guardar información del usuario');
      throw error;
    }
  }

  private async getUserFromFirestore(uid: string): Promise<User | null> {
    try {
      const userRef = doc(this._firestore, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          uid: data['uid'],
          name: data['name'],
          email: data['email'],
          role: data['role'],
          createdAt: data['createdAt']?.toDate(),
          updatedAt: data['updatedAt']?.toDate(),
        } as User;
      }

      return null;
    } catch (error: any) {
      console.error('Error al obtener usuario de Firestore:', error);
      // No mostrar toast aquí para evitar spam de notificaciones
      return null;
    }
  }

  async updateUserProfile(userData: Partial<User>): Promise<void> {
    try {
      const currentUser = this.currentUser();
      if (!currentUser) throw new Error('No user logged in');

      const updatedUser: User = {
        ...currentUser,
        ...userData,
        updatedAt: new Date()
      };

      await this.saveUserToFirestore(updatedUser);
      this.currentUser.set(updatedUser);
      this.toastService.success('Perfil actualizado exitosamente');
    } catch (error: any) {
      console.error('Error al actualizar perfil:', error);
      this.toastService.error('Error al actualizar el perfil');
      throw error;
    }
  }
}

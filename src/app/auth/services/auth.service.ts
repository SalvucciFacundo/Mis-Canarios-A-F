import { effect, Injectable, signal } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, authState, signInWithEmailAndPassword, updateProfile, sendEmailVerification, reload } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { User } from '../interface/user.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  readonly currentUserEmail = signal<string | null>(null);
  readonly currentUser = signal<User | null>(null);
  readonly isEmailVerified = signal<boolean>(false);
  constructor(private _auth: Auth, private _firestore: Firestore) {
    effect(() => {
      authState(this._auth).subscribe(async (firebaseUser) => {
        this.currentUserEmail.set(firebaseUser?.email ?? null);
        this.isEmailVerified.set(firebaseUser?.emailVerified ?? false);

        if (firebaseUser) {
          // Cargar datos adicionales del usuario desde Firestore
          const userDoc = await this.getUserFromFirestore(firebaseUser.uid);
          this.currentUser.set(userDoc);
        } else {
          this.currentUser.set(null);
        }
      });
    });
  }

  async signUp(userData: { email: string; password: string; name?: string }) {
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
      rol: 'user', // Rol por defecto
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.saveUserToFirestore(user);
    return userCredential;
  }

  async signIn(userData: { email: string; password: string }) {
    return signInWithEmailAndPassword(this._auth, userData.email, userData.password);
  }

  async signOut() {
    return this._auth.signOut();
  }

  async sendEmailVerification(): Promise<void> {
    const user = this._auth.currentUser;
    if (user && !user.emailVerified) {
      await sendEmailVerification(user);
    } else {
      throw new Error('No user logged in or email already verified');
    }
  }

  async reloadUser(): Promise<void> {
    const user = this._auth.currentUser;
    if (user) {
      await reload(user);
      this.isEmailVerified.set(user.emailVerified);
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
    const userRef = doc(this._firestore, 'users', user.uid);
    await setDoc(userRef, user);
  }

  private async getUserFromFirestore(uid: string): Promise<User | null> {
    const userRef = doc(this._firestore, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        uid: data['uid'],
        name: data['name'],
        email: data['email'],
        rol: data['rol'],
        createdAt: data['createdAt']?.toDate(),
        updatedAt: data['updatedAt']?.toDate()
      } as User;
    }

    return null;
  }

  async updateUserProfile(userData: Partial<User>): Promise<void> {
    const currentUser = this.currentUser();
    if (!currentUser) throw new Error('No user logged in');

    const updatedUser: User = {
      ...currentUser,
      ...userData,
      updatedAt: new Date()
    };

    await this.saveUserToFirestore(updatedUser);
    this.currentUser.set(updatedUser);
  }
}

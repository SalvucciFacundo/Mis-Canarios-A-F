import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, authState, signInWithEmailAndPassword } from '@angular/fire/auth';
import { User } from '../interface/user.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  //private _auth = inject(Auth)

  constructor(private _auth: Auth) { }

  signUp(user: User) {
    return createUserWithEmailAndPassword(this._auth, user.email, user.password)
  }

  signIn(user: User) {
    return signInWithEmailAndPassword(this._auth, user.email, user.password)
  }

  signOut() {
    return this._auth.signOut();
  }

  get authState$(): Observable<any> {
    return authState(this._auth);
  }
}

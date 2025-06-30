import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { isEmailError, isRequired } from './../../utils/validators';
import { toast } from 'ngx-sonner';
import { Router, RouterLink } from '@angular/router';
import { LoadingService } from '../../../shared/services/loading.service';

@Component({
  selector: 'app-sign-in',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css'
})
export class SignInComponent {

  private _formBuilder = inject(FormBuilder);
  private _authService = inject(AuthService);
  private _router = inject(Router);
  private _loadingService = inject(LoadingService);

  showPassword = false;

  isRequired(field: 'email' | 'password') {
    return isRequired(field, this.formSignIn);
  }

  isEmail() {
    return isEmailError(this.formSignIn);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  formSignIn = this._formBuilder.group({
    email: this._formBuilder.control<string>('', [Validators.email, Validators.required]),
    password: this._formBuilder.control<string>('', Validators.required)
  });

  async onSubmit() {
    if (this.formSignIn.invalid) return;

    try {
      const email = this.formSignIn.get('email')?.value;
      const password = this.formSignIn.get('password')?.value;
      if (!email || !password) return;

      await this._authService.signIn({ email, password });

      // Verificar si el email está verificado (solo informativo)
      if (!this._authService.isEmailVerified()) {
        toast.info('Email no verificado', {
          description: 'Considera verificar tu email para acceder a funciones premium en el futuro.'
        });
      }

      toast.success('Bienvenido');

      // Mostrar loading de pantalla completa y navegar
      await this._loadingService.showFullScreenTransition('Cargando lista de canarios...', 1000);
      this._router.navigate(['/birds/birds-list']);
      this._loadingService.hidePageTransition();

    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);

      let errorMessage = 'Error al iniciar sesión';
      if (error?.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
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

      toast.error(errorMessage);
    }
  }

}

import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { isEmailError, isRequired } from './../../utils/validators';
import { Router, RouterLink } from '@angular/router';
import { LoadingService } from '../../../shared/services/loading.service';
import { ToastService } from '../../../shared/services/toast.service';

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
  private _toastService = inject(ToastService);

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

      // Mostrar toast de bienvenida
      this._toastService.success('¡Bienvenido de vuelta!');

      // Verificar si el email está verificado (solo informativo, sin bloquear el toast de bienvenida)
      setTimeout(() => {
        if (!this._authService.isEmailVerified()) {
          this._toastService.info('Email no verificado', 'Considera verificar tu email para acceder a funciones premium en el futuro.');
        }
      }, 1500); // Mostrar después de 1.5 segundos para evitar superposición

      // Mostrar loading de pantalla completa y navegar
      await this._loadingService.showFullScreenTransition('Cargando lista de canarios...', 1000);
      this._router.navigate(['/birds/birds-list']);
      this._loadingService.hidePageTransition();

    } catch (error: any) {
      // El toast de error ya se maneja en el AuthService
      console.error('Error al iniciar sesión:', error);
    }
  }

}

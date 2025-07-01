import { isEmailError, isRequired } from './../../utils/validators';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { LoadingService } from '../../../shared/services/loading.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-sign-up',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css'
})
export class SignUpComponent {

  private _formBuilder = inject(FormBuilder);
  private _authService = inject(AuthService);
  private _router = inject(Router);
  private _loadingService = inject(LoadingService);
  private _toastService = inject(ToastService);

  showPassword = false;

  isRequired(field: 'name' | 'email' | 'password') {
    return isRequired(field, this.formSignUp);
  }

  isEmail() {
    return isEmailError(this.formSignUp);
  }

  isPasswordTooShort() {
    const control = this.formSignUp.get('password');
    return control && control.touched && control.hasError('minlength');
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  formSignUp = this._formBuilder.group({
    name: this._formBuilder.control<string>('', Validators.required),
    email: this._formBuilder.control<string>('', [Validators.email, Validators.required]),
    password: this._formBuilder.control<string>('', [Validators.required, Validators.minLength(6)])
  });

  async onSubmit() {
    if (this.formSignUp.invalid) return;
    try {
      const name = this.formSignUp.get('name')?.value;
      const email = this.formSignUp.get('email')?.value;
      const password = this.formSignUp.get('password')?.value;
      if (!name || !email || !password) return;

      await this._authService.signUp({ name, email, password });
      this._toastService.success('¡Cuenta creada exitosamente!', 'Te hemos enviado un email de verificación. Puedes verificarlo más tarde desde tu perfil.');

      // Mostrar loading de pantalla completa y navegar
      await this._loadingService.showFullScreenTransition('Bienvenido a Mis Canarios...', 1000);
      this._router.navigate(['/birds/birds-list']);
      this._loadingService.hidePageTransition();
    } catch (error: any) {
      // El toast de error ya se maneja en el AuthService
      console.error('Error al crear usuario:', error);
    }
  }
}

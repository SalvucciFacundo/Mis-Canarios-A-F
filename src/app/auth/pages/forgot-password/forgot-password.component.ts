import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../../../shared/services/toast.service';
import { AuthService } from '../../services/auth.service';
import { isEmailError, isRequired } from '../../utils/validators';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  private _formBuilder = inject(FormBuilder);
  private _authService = inject(AuthService);
  private _router = inject(Router);
  private _toastService = inject(ToastService);

  emailSent = false;
  isLoading = false;

  formForgotPassword = this._formBuilder.group({
    email: this._formBuilder.control<string>('', [Validators.email, Validators.required])
  });

  isRequired(field: 'email') {
    return isRequired(field, this.formForgotPassword);
  }

  isEmail() {
    return isEmailError(this.formForgotPassword);
  }

  async onSubmit() {
    if (this.formForgotPassword.invalid) return;

    const email = this.formForgotPassword.get('email')?.value;
    if (!email) return;

    this.isLoading = true;

    try {
      await this._authService.resetPassword(email);
      this.emailSent = true;
      this._toastService.success(
        'Email enviado',
        'Revisa tu bandeja de entrada para restablecer tu contraseña'
      );
    } catch (error: any) {
      console.error('Error al enviar email de recuperación:', error);

      // Manejar diferentes tipos de error
      if (error.code === 'auth/user-not-found') {
        this._toastService.error(
          'Usuario no encontrado',
          'No existe una cuenta con este correo electrónico'
        );
      } else if (error.code === 'auth/invalid-email') {
        this._toastService.error(
          'Email inválido',
          'Por favor verifica que el correo sea válido'
        );
      } else {
        this._toastService.error(
          'Error al enviar email',
          'Inténtalo de nuevo más tarde'
        );
      }
    } finally {
      this.isLoading = false;
    }
  }

  resendEmail() {
    this.emailSent = false;
    this.onSubmit();
  }
}

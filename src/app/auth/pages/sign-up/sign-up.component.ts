import { isEmailError, isRequired } from './../../utils/validators';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { toast } from 'ngx-sonner';
import { Router, RouterLink } from '@angular/router';
import { LoadingService } from '../../../shared/services/loading.service';

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
      toast.success('¡Cuenta creada exitosamente!', {
        description: 'Te hemos enviado un email de verificación. Puedes verificarlo más tarde desde tu perfil.'
      });

      // Mostrar loading de pantalla completa y navegar
      await this._loadingService.showFullScreenTransition('Bienvenido a Mis Canarios...', 1000);
      this._router.navigate(['/birds/birds-list']);
      this._loadingService.hidePageTransition();
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

      toast.error(errorMessage);
    }
  }
}

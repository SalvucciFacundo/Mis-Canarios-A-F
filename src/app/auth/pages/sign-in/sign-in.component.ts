import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { isEmailError, isRequired } from './../../utils/validators';
import { toast } from 'ngx-sonner';
import { Router, RouterLink } from '@angular/router';

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

  isRequired(field: 'email' | 'password') {
    return isRequired(field, this.formSignIn);
  }

  isEmail() {
    return isEmailError(this.formSignIn);
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
      toast.success('Bienvenido');
      this._router.navigate(['/birds/birds-list']);
    } catch (error) {
      toast.error('Error al iniciar sesión');
    }
  }

}

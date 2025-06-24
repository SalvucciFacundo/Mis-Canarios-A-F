import { isEmailError, isRequired } from './../../utils/validators';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { toast } from 'ngx-sonner';
import { Router, RouterLink } from '@angular/router';

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

  isRequired(field: 'email' | 'password') {
    return isRequired(field, this.formSignUp);
  }

  isEmail() {
    return isEmailError(this.formSignUp);
  }

  formSignUp = this._formBuilder.group({
    email: this._formBuilder.control<string>('', [Validators.email, Validators.required]),
    password: this._formBuilder.control<string>('', Validators.required)
  });

  async onSubmit() {
    if (this.formSignUp.invalid) return;
    try {
      const email = this.formSignUp.get('email')?.value;
      const password = this.formSignUp.get('password')?.value;
      if (!email || !password) return;
      await this._authService.signUp({ email, password });
      toast.success('Usuario creado correctamente');
      this._router.navigate(['/birds/birds-list']);
    } catch (error) {
      toast.error('Error al crear el usuario');
    }
  }
}

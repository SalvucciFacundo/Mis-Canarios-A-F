import { FormGroup } from "@angular/forms";

export const isRequired = (field: 'name' | 'email' | 'password', signUpForm: FormGroup) => {
  const control = signUpForm.get(field);
  return control && control.touched && control.hasError('required');
}

export const isEmailError = (signUpForm: FormGroup) => {
  const control = signUpForm.get('email');
  return control && control.touched && control.hasError('email');
}

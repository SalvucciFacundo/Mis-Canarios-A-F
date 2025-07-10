import { AbstractControl } from '@angular/forms';

export function getFieldError(control: AbstractControl | null, field: string): string | null {
  if (!control || !control.errors || !control.touched) return null;
  if (control.errors['required']) {
    switch (field) {
      case 'origin': return 'La procedencia es obligatoria';
      case 'season': return 'La temporada es obligatoria';
      case 'ringColor': return 'El color de anillo es obligatorio';
      case 'gender': return 'El género es obligatorio';
      case 'state': return 'El estado es obligatorio';
      default: return 'Este campo es obligatorio';
    }
  }
  if (control.errors['pattern']) {
    switch (field) {
      case 'season': return 'Debe ingresar el año completo (4 dígitos, ej: 2024)';
      case 'ringNumber': return 'Solo se permiten números de hasta 4 dígitos';
      case 'posture': return 'Solo se permiten números de hasta 4 dígitos';
      case 'ringColor': return 'Debe seleccionar un color de anillo válido';
      case 'gender': return 'Debe seleccionar un género válido';
      case 'state': return 'Debe seleccionar un estado válido';
      default: return 'Formato inválido';
    }
  }
  return null;
}

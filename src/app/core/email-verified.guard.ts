import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';

export const emailVerifiedGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si no hay usuario logueado, redirigir al login
  if (!authService.currentUserEmail()) {
    router.navigate(['/auth/sign-in']);
    return false;
  }

  // Si el email no está verificado, redirigir a verificación
  if (!authService.isEmailVerified()) {
    router.navigate(['/auth/email-verification']);
    return false;
  }

  return true;
};

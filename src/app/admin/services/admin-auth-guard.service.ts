import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';

/**
 * Guard para proteger rutas de admin. Solo permite acceso a usuarios con rol 'admin'.
 */
export const adminAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.currentUser();
  if (user && user.role === 'admin') {
    return true;
  }
  router.navigate(['/']);
  return false;
};

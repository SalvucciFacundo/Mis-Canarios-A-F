import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

/**
 * Guard para proteger rutas de admin. Solo permite acceso a usuarios con rol 'admin'.
 */
export const adminAuthGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  // Esperar a que el usuario esté cargado correctamente
  let user = auth.currentUser();
  console.log('[adminAuthGuard] Usuario inicial:', user);
  if (!user) {
    // Forzar recarga si el usuario aún no está disponible
    await new Promise(resolve => setTimeout(resolve, 200));
    user = auth.currentUser();
    console.log('[adminAuthGuard] Usuario tras espera:', user);
  }
  if (user && user.role === 'admin') {
    console.log('[adminAuthGuard] Acceso permitido para usuario admin:', user.email);
    return true;
  }
  console.warn('[adminAuthGuard] Acceso denegado. Usuario:', user);
  router.navigate(['/']);
  return false;
};

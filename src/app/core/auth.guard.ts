import { authState } from '@angular/fire/auth';
import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from '../auth/services/auth.service';
import { map } from 'rxjs';

export const privateGuard = (): CanActivateFn => {
  return () => {
    const router = inject(Router);
    const authState = inject(AuthService);

    return authState.authState$.pipe(
      map(state => {
        if (!state) {
          router.navigate(['/auth/sign-in']);
          return false;
        } else {
          return true;
        }
      })
    )
  };
};

export const publicGuard = (): CanActivateFn => {
  return () => {
    const router = inject(Router);
    const authState = inject(AuthService);

    return authState.authState$.pipe(
      map(state => {
        if (state) {
          router.navigate(['/birds']);
          return false;
        } else {
          return true;
        }
      })
    )
  };
};

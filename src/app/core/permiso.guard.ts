import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { RolesStoreService } from '../auth/services/roles-store.service';

export const permisoGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const rolesStore = inject(RolesStoreService);
    const router = inject(Router);
    const permiso = route.data['permiso'];
    const user = authService.currentUser();
    if (!user || !user.role) {
        router.navigate(['/unauthorized']);
        return false;
    }
    return rolesStore.getAllRoles().then(() => {
        const rol = rolesStore.roles().find(r => r.id === user.role);
        if (rol && rol.permisos.includes(permiso)) {
            return true;
        } else {
            router.navigate(['/unauthorized']);
            return false;
        }
    });
};

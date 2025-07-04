import { Injectable, signal } from '@angular/core';
import { UsersStoreService } from '../../auth/services/users-store.service';
import { Birds } from '../../birds/interface/birds.interface';
import { BirdsRegisterService } from '../../birds/services/birds-register.service';

export interface AdminBirdWithUser extends Birds {
    userEmail: string;
}

@Injectable({ providedIn: 'root' })
export class AdminBirdsService {
    birds = signal<AdminBirdWithUser[]>([]);
    loading = signal<boolean>(false);
    error = signal<string | null>(null);

    constructor(
        private usersStore: UsersStoreService,
        private birdsRegister: BirdsRegisterService
    ) { }

    /**
     * Carga todos los canarios de todos los usuarios para el panel admin.
     */
    async loadAllBirdsWithUsers() {
        this.loading.set(true);
        this.error.set(null);
        try {
            const users = await this.usersStore.getAllUsersForAdmin();
            const allBirds: AdminBirdWithUser[] = [];
            for (const user of users) {
                const birds = await this.birdsRegister.getBirds(user.email);
                for (const bird of birds) {
                    allBirds.push({ ...bird, userEmail: user.email });
                }
            }
            this.birds.set(allBirds);
        } catch (e) {
            this.error.set('Error al cargar canarios de todos los usuarios');
        } finally {
            this.loading.set(false);
        }
    }
}

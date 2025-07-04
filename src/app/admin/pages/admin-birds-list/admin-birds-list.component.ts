import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { UsersStoreService } from '../../../auth/services/users-store.service';
import { Birds } from '../../../birds/interface/birds.interface';
import { BirdsRegisterService } from '../../../birds/services/birds-register.service';

/**
 * Lista de canarios para administración.
 */
@Component({
  selector: 'app-admin-birds-list',
  standalone: true,
  imports: [CommonModule],
  providers: [UsersStoreService, BirdsRegisterService],
  templateUrl: './admin-birds-list.component.html',
  styleUrls: ['./admin-birds-list.component.css']
})
export class AdminBirdsListComponent implements OnInit {
  birds: BirdWithUserEmail[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private usersStore: UsersStoreService,
    private birdsRegister: BirdsRegisterService
  ) { }

  async ngOnInit(): Promise<void> {
    this.loading = true;
    try {
      const users = await this.usersStore.getAllUsersForAdmin();
      const allBirds: BirdWithUserEmail[] = [];
      for (const user of users) {
        const birds = await this.birdsRegister.getBirds(user.email);
        for (const bird of birds) {
          allBirds.push({ ...bird, userEmail: user.email });
        }
      }
      this.birds = allBirds;
    } catch (e) {
      this.error = 'Error al cargar canarios';
    } finally {
      this.loading = false;
    }
  }

  trackById(index: number, bird: BirdWithUserEmail) {
    return bird.id || index;
  }
}

export interface BirdWithUserEmail extends Birds {
  userEmail: string;
}

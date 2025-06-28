import { Component, computed, signal } from '@angular/core';
import { Birds } from '../../interface/birds.interface';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BirdsRegisterService } from '../../services/birds-register.service';
import { AuthService } from '../../../auth/services/auth.service';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { BirdsStoreService } from '../../services/birds-store.service';

@Component({
  selector: 'app-bird-details',
  imports: [RouterLink, CommonModule],
  templateUrl: './bird-details.component.html',
  styleUrl: './bird-details.component.css'
})
export class BirdDetailsComponent {

  private id = signal<string | null>(null);

  constructor(private route: ActivatedRoute, public birdsStore: BirdsStoreService) {
    const paramId = this.route.snapshot.paramMap.get('id');
    if (paramId) this.id.set(paramId);
  }

  readonly bird = computed(() => {
    const birds = this.birdsStore.birdsList();
    const id = this.id();
    return birds.find(b => b.id === id);
  });

  //bird!: Birds;
  // async ngOnInit() {
  //   const id = this.route.snapshot.paramMap.get('id');
  //   const user = await firstValueFrom(this._auth.authState$);

  //   if (!id || !user?.email) return;
  //   try {
  //     this.bird = await this._birdsService.getBirdById(user.email, id);
  //   } catch (error) {
  //     console.error('Error fetching bird details:', error);
  //   }
  // }
}

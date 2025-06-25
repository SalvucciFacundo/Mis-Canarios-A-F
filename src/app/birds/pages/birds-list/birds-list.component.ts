import { CommonModule } from '@angular/common';
import { Component, effect, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Birds } from '../../interface/birds.interface';
import { firstValueFrom } from 'rxjs';
import { BirdsRegisterService } from '../../services/birds-register.service';
import { AuthService } from '../../../auth/services/auth.service';
@Component({
  selector: 'app-birds-list',
  imports: [CommonModule, RouterLink],
  templateUrl: './birds-list.component.html',
  styleUrl: './birds-list.component.css'
})
export class BirdsListComponent {
  //birds: Birds[] = [];
  birds = signal<Birds[]>([]);
  search = signal('');

  constructor(private _birdsRegisterService: BirdsRegisterService, private _authService: AuthService) {
    effect(() => {
      this.cargarBirds();
    });

  }
  filteredBirds = computed(() => {
    const term = this.search().toLowerCase().trim();
    return this.birds().filter(bird =>
      bird.line?.toLowerCase().includes(term) ||
      bird.origin?.toLowerCase().includes(term) ||
      bird.ringNumber?.toString().includes(term)
    );
  });

  async cargarBirds() {
    try {
      const user = await firstValueFrom(this._authService.authState$);
      if (!user?.email) return;

      const results = await this._birdsRegisterService.getBirds(user.email);
      this.birds.set(results);
    } catch (error) {
      console.error('Error fetching birds:', error);
    }
  }

  /*async ngOnInit() {
    console.log('Ejecutando ngOnInit en BirdsListComponent');
    try {
      const user = await firstValueFrom(this._authService.authState$);
      if (!user?.email) return;
      this.birds = await this._birdsRegisterService.getBirds(user.email);
      console.log('Birds cargados:', this.birds);
    } catch (error) {
      console.error('Error fetching birds:', error);
    }
  }*/


}

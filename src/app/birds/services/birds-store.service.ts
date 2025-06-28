import { computed, effect, Injectable, signal } from '@angular/core';
import { BirdsRegisterService } from '../services/birds-register.service';
import { AuthService } from '../../auth/services/auth.service';
import { Birds } from '../interface/birds.interface';


@Injectable({
  providedIn: 'root'
})
export class BirdsStoreService {
  private birds = signal<Birds[] | null>(null);
  readonly search = signal('');

  private loading = signal(false);
  private error = signal<string | null>(null);

  readonly userEmail = computed(() => this.authService.currentUserEmail());


  readonly filteredBirds = computed(() => {
    const list = this.birds() ?? [];
    const term = this.search().toLowerCase().trim();
    return list.filter(b =>
      b.line?.toLowerCase().includes(term) ||
      b.origin?.toLowerCase().includes(term) ||
      b.ringNumber?.toString().includes(term)
    );
  });



  constructor(private birdService: BirdsRegisterService, private authService: AuthService) {
    effect(() => {
      const email = this.authService.currentUserEmail();
      if (email && this.birds() === null) {
        this.loadBirds(email);
      }
    });
  }

  async loadBirds(email: string) {
    try {
      this.loading.set(true);
      const birds = await this.birdService.getBirds(email);
      this.birds.set(birds);
      this.error.set(null);
    } catch (err) {
      this.error.set('Error al cargar los canarios');
    } finally {
      this.loading.set(false);
    }
  }

  // refresh(email: string) {
  //   this.birds.set(null); // invalidamos el cache para que el `effect()` lo vuelva a cargar
  //   this.loadBirds(email);
  // }
  refresh() {
    const email = this.authService.currentUserEmail();
    if (!email) return;

    this.birds.set(null); // invalidar cache
    this.loadBirds(email); // volver a cargar
  }


  get isLoading() {
    return this.loading.asReadonly();
  }

  get birdsList() {
    return this.filteredBirds;
  }

  get loadError() {
    return this.error.asReadonly();
  }

  async agregarCanario(email: string, birdData: Partial<Birds>) {
    try {
      await this.birdService.addBird(email, birdData as Birds);

      // Actualizamos el store local sin hacer nueva lectura 🔥
      const actual = this.birds() ?? [];
      this.birds.set([...actual, { ...birdData, id: 'nuevo' }]); // ⚠️ podés ignorar el id real si querés evitar leer

    } catch (e) {
      console.error('Error al agregar el canario:', e);
      this.error.set('No se pudo agregar el canario');
    }
  }

}

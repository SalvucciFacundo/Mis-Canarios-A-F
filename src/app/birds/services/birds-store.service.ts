import { computed, effect, Injectable, signal } from '@angular/core';
import { BirdsRegisterService } from '../services/birds-register.service';
import { AuthService } from '../../auth/services/auth.service';
import { Birds } from '../interface/birds.interface';
import { doc, updateDoc } from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';
import { LoadingService } from '../../shared/services/loading.service';
import { ToastService } from '../../shared/services/toast.service';
import { UserLimitsService } from '../../shared/services/user-limits.service';

@Injectable({
  providedIn: 'root'
})
export class BirdsStoreService {
  private birds = signal<Birds[] | null>(null);
  readonly search = signal('');

  private loading = signal(false);
  private error = signal<string | null>(null);

  // Optimización de caché
  private readonly CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutos
  private lastFetchTime = 0;
  private currentUserEmail = '';

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

  constructor(
    private birdService: BirdsRegisterService,
    private authService: AuthService,
    private firestore: Firestore,
    private loadingService: LoadingService,
    private toastService: ToastService,
    private limitsService: UserLimitsService
  ) {
    effect(() => {
      const email = this.authService.currentUserEmail();
      if (email && this.shouldLoadBirds(email)) {
        this.loadBirds(email);
      }
    });
  }

  /**
   * Determina si necesitamos cargar los birds (caché expirado o usuario diferente)
   */
  private shouldLoadBirds(email: string): boolean {
    const now = Date.now();
    const cacheExpired = (now - this.lastFetchTime) > this.CACHE_TIMEOUT;
    const userChanged = this.currentUserEmail !== email;
    const noData = this.birds() === null;

    return noData || cacheExpired || userChanged;
  }

  /**
   * Carga los birds con gestión de caché mejorada
   */
  async loadBirds(email: string, forceRefresh = false) {
    // Si no es forzado y el caché es válido, no hacer nada
    if (!forceRefresh && !this.shouldLoadBirds(email)) {
      return;
    }

    try {
      this.loading.set(true);
      await this.loadingService.showContentTransition('Cargando canarios...', 1000);

      const birds = await this.birdService.getBirds(email);
      this.birds.set(birds);
      this.error.set(null);

      // Actualizar información de caché
      this.lastFetchTime = Date.now();
      this.currentUserEmail = email;
      this.currentUserEmail = email;
    } catch (err) {
      this.error.set('Error al cargar los canarios');
      this.toastService.error('Error al cargar los canarios');
    } finally {
      this.loading.set(false);
      this.loadingService.hidePageTransition();
    }
  }


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
      // Verificar límites antes de crear
      if (!this.limitsService.canPerformOperation('birds_create')) {
        this.toastService.warning('Has alcanzado el límite diario de creación de canarios. Inténtalo mañana.');
        return false;
      }

      await this.birdService.addBird(email, birdData as Birds);

      // Actualizamos el store local sin hacer nueva lectura 🔥
      const actual = this.birds() ?? [];
      this.birds.set([...actual, { ...birdData, id: 'nuevo' }]); // ⚠️ podés ignorar el id real si querés evitar leer

      // Incrementar contador de uso
      this.limitsService.incrementUsage('birds_create');
      this.toastService.success('Canario creado exitosamente');
      return true;

    } catch (e) {
      console.error('Error al agregar el canario:', e);
      this.error.set('No se pudo agregar el canario');
      this.toastService.error('Error al crear el canario. Inténtalo nuevamente.');
      return false;
    }
  }

  async actualizarCanario(email: string, birdId: string, bird: Partial<Birds>): Promise<void> {
    try {
      await this.birdService.updateBird(email, birdId, bird);

      // Actualizar el store local
      const current = this.birds() ?? [];
      const updatedBirds = current.map(b =>
        b.id === birdId ? { ...b, ...bird } : b
      );
      this.birds.set(updatedBirds);

      this.toastService.success('Canario actualizado exitosamente');

    } catch (e) {
      console.error('Error al actualizar el canario:', e);
      this.error.set('No se pudo actualizar el canario');
      this.toastService.error('Error al actualizar el canario. Inténtalo nuevamente.');
    }
  }

  async eliminarCanario(email: string, birdId: string): Promise<boolean> {
    try {
      await this.birdService.deleteBird(email, birdId);

      // Actualizar el store local
      const current = this.birds() ?? [];
      const updatedBirds = current.filter(b => b.id !== birdId);
      this.birds.set(updatedBirds);

      this.toastService.success('Canario eliminado exitosamente');
      return true;

    } catch (e) {
      console.error('Error al eliminar el canario:', e);
      this.error.set('No se pudo eliminar el canario');
      this.toastService.error('Error al eliminar el canario. Inténtalo nuevamente.');
      return false;
    }
  }

  getCanarioSignalById(id: string) {
    return computed(() => this.birds()?.find(b => b.id === id) ?? null);
  }

}

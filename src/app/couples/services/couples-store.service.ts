import { Injectable, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CouplesService } from './couples.service';
import { BirdsStoreService } from '../../birds/services/birds-store.service';
import { AuthService } from '../../auth/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { UserLimitsService } from '../../shared/services/user-limits.service';
import { Couples } from '../interface/couples.interface';
import { Birds } from '../../birds/interface/birds.interface';
import { map, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CouplesStoreService {
  private couplesService = inject(CouplesService);
  private birdsStore = inject(BirdsStoreService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private userLimitsService = inject(UserLimitsService);

  // Estados reactivos
  private _isLoading = signal(false);
  private _loadError = signal<string | null>(null);
  private _selectedSeason = signal<string>(new Date().getFullYear().toString());

  // Señales públicas
  readonly isLoading = this._isLoading.asReadonly();
  readonly loadError = this._loadError.asReadonly();
  readonly selectedSeason = this._selectedSeason.asReadonly();

  // Lista de parejas reactiva
  readonly couplesList = toSignal(
    this.authService.authState$.pipe(
      switchMap(user => {
        if (!user?.email) return of([]);
        this._isLoading.set(true);
        this._loadError.set(null);
        return this.couplesService.getCouplesByUser(user.email).pipe(
          map(couples => {
            this._isLoading.set(false);
            return couples;
          }),
          // Capturar errores específicos de Firebase
          catchError((error: any) => {
            console.error('Error loading couples:', error);
            console.log('Error details:', {
              code: error?.code,
              message: error?.message,
              errorType: typeof error
            });

            this._isLoading.set(false);

            // Si es un error de índice de Firebase, no mostrar error al usuario
            // Solo mostrar el estado vacío
            if (error?.code === 'failed-precondition' ||
              error?.message?.includes('requires an index') ||
              error?.message?.includes('index') ||
              error?.toString?.()?.includes('index')) {
              console.log('🔍 Firebase index error detected, showing empty state instead of error');
              // No establecer error, dejar que se muestre el estado vacío
              return of([]);
            }

            // Para otros errores, sí mostrar el mensaje de error
            console.log('❌ Non-index error, showing error message to user');
            this._loadError.set('No se pudieron cargar las parejas');
            return of([]); // Retornar array vacío en caso de error
          })
        );
      })
    ),
    { initialValue: [] as Couples[] }
  );

  // Parejas filtradas por temporada
  readonly filteredCouples = computed(() => {
    const couples = this.couplesList() as Couples[];
    const season = this.selectedSeason();
    const filtered = couples.filter((couple: Couples) => couple.season === season);

    // Ordenar de la más vieja a la más nueva por fecha de creación
    return filtered.sort((a, b) => {
      const dateA = new Date(a.creationDate || 0);
      const dateB = new Date(b.creationDate || 0);
      return dateA.getTime() - dateB.getTime();
    });
  });
  // Estadísticas computadas
  readonly statistics = computed(() => {
    const couples = this.filteredCouples();
    const birds = this.birdsStore.birdsList();

    let totalOffspring = 0;
    let totalHatchedEggs = 0;
    let totalUnhatchedEggs = 0;
    let activeCouples = 0;

    couples.forEach((couple: Couples) => {
      // Contar pichones usando relación inversa con validación de origen
      const offspring = birds.filter(bird => {
        // Método 1: Si el pichón tiene coupleId, debe coincidir exactamente
        if (bird.coupleId) {
          return bird.coupleId === couple.id;
        }

        // Método 2: Si el pichón fue creado desde cría (registrationSource: 'breeding') y tiene los padres correctos
        if (bird.registrationSource === 'breeding') {
          const hasCorrectParents = bird.father === couple.maleId && bird.mother === couple.femaleId;

          if (!hasCorrectParents) return false;

          // Validación temporal: el pichón debe ser creado después de la pareja
          if (couple.creationDate && bird.creationDate) {
            const coupleDate = new Date(couple.creationDate);
            const birdDate = new Date(bird.creationDate);

            // Permitir un margen de error de 1 día hacia atrás
            const oneDayBefore = new Date(coupleDate.getTime() - (24 * 60 * 60 * 1000));

            return birdDate >= oneDayBefore;
          }

          return true; // Si no hay fechas, aceptar el pichón
        }

        // Método 3: Para compatibilidad con datos existentes sin origin
        // Solo si no tiene origin definido Y tiene los padres correctos Y validación temporal
        if (!bird.origin) {
          const hasCorrectParents = bird.father === couple.maleId && bird.mother === couple.femaleId;

          if (!hasCorrectParents) return false;

          // Si la pareja no tiene fecha de creación, incluir todos los pichones con esos padres
          if (!couple.creationDate) return true;

          // Si el pichón no tiene fecha de creación, incluirlo (para compatibilidad)
          if (!bird.creationDate) return true;

          // Verificar que el pichón fue creado después de la pareja
          const coupleDate = new Date(couple.creationDate);
          const birdDate = new Date(bird.creationDate);

          // Permitir un margen de error de 1 día hacia atrás
          const oneDayBefore = new Date(coupleDate.getTime() - (24 * 60 * 60 * 1000));

          return birdDate >= oneDayBefore;
        }

        // Si el pichón tiene origin: 'manual', nunca contarlo como descendencia automática
        return false;
      });

      totalOffspring += offspring.length;

      // Estadísticas de huevos
      totalHatchedEggs += couple.hatchedEggs || 0;
      totalUnhatchedEggs += couple.unhatchedEggs || 0;

      // Parejas activas (que tienen postura en curso)
      if (couple.posture && !couple.postureEndDate) {
        activeCouples++;
      }
    });

    return {
      totalCouples: couples.length,
      activeCouples,
      totalOffspring,
      totalHatchedEggs,
      totalUnhatchedEggs,
      hatchingRate: totalHatchedEggs + totalUnhatchedEggs > 0
        ? Math.round((totalHatchedEggs / (totalHatchedEggs + totalUnhatchedEggs)) * 100)
        : 0
    };
  });
  // Obtener pichones de una pareja específica with validación de origen
  getOffspringByCouple(couple: Couples) {
    return computed(() => {
      const birds = this.birdsStore.birdsList();

      // Filtrar pichones que corresponden a esta pareja
      return birds.filter(bird => {
        // Método 1: Si el pichón tiene coupleId, debe coincidir exactamente
        if (bird.coupleId) {
          return bird.coupleId === couple.id;
        }

        // Método 2: Si el pichón fue creado desde cría (registrationSource: 'breeding') y tiene los padres correctos
        if (bird.registrationSource === 'breeding') {
          const hasCorrectParents = bird.father === couple.maleId && bird.mother === couple.femaleId;

          if (!hasCorrectParents) return false;

          // Validación temporal: el pichón debe ser creado después de la pareja
          if (couple.creationDate && bird.creationDate) {
            const coupleDate = new Date(couple.creationDate);
            const birdDate = new Date(bird.creationDate);

            // Permitir un margen de error de 1 día hacia atrás
            const oneDayBefore = new Date(coupleDate.getTime() - (24 * 60 * 60 * 1000));

            return birdDate >= oneDayBefore;
          }

          return true; // Si no hay fechas, aceptar el pichón
        }

        // Método 3: Para compatibilidad con datos existentes sin origin
        // Solo si no tiene origin definido Y tiene los padres correctos Y validación temporal
        if (!bird.origin) {
          const hasCorrectParents = bird.father === couple.maleId && bird.mother === couple.femaleId;

          if (!hasCorrectParents) return false;

          // Si la pareja no tiene fecha de creación, incluir todos los pichones con esos padres
          if (!couple.creationDate) return true;

          // Si el pichón no tiene fecha de creación, incluirlo (para compatibilidad)
          if (!bird.creationDate) return true;

          // Verificar que el pichón fue creado después de la pareja
          const coupleDate = new Date(couple.creationDate);
          const birdDate = new Date(bird.creationDate);

          // Permitir un margen de error de 1 día hacia atrás
          const oneDayBefore = new Date(coupleDate.getTime() - (24 * 60 * 60 * 1000));

          return birdDate >= oneDayBefore;
        }

        // Si el pichón tiene origin: 'manual', nunca contarlo como descendencia automática
        return false;
      });
    });
  }
  // Método para obtener detalles completos de una pareja específica
  getCoupleDetails(couple: Couples) {
    return computed(() => {
      const birds = this.birdsStore.birdsList();

      // Obtener información del macho
      const male = birds.find(bird => bird.id === couple.maleId);

      // Obtener información de la hembra
      const female = birds.find(bird => bird.id === couple.femaleId);

      // Obtener pichones de esta pareja
      const offspring = this.getOffspringByCouple(couple)();

      return {
        male,
        female,
        offspring,
        couple
      };
    });
  }

  // Obtener temporadas disponibles
  readonly availableSeasons = computed(() => {
    const couples = this.couplesList() as Couples[];
    const seasons = [...new Set(couples.map((couple: Couples) => couple.season))];
    return seasons.sort((a: string, b: string) => b.localeCompare(a)); // Más reciente primero
  });

  // Métodos para cambiar temporada
  setSelectedSeason(season: string) {
    this._selectedSeason.set(season);
  }

  // Métodos de gestión
  async createCouple(couple: Omit<Couples, 'id'>) {
    try {
      this._isLoading.set(true);
      this._loadError.set(null);
      await this.couplesService.createCouple(couple);

      // Registrar la operación en los límites
      this.userLimitsService.incrementUsage('couples_create');

      this.toastService.success('Pareja creada exitosamente');
      // La lista se actualizará automáticamente por el observable
    } catch (error) {
      this._loadError.set('Error al crear la pareja');
      this.toastService.error('Error al crear la pareja. Por favor, inténtelo de nuevo.');
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  // Crear múltiples parejas en lote
  async createCouplesBatch(couples: Omit<Couples, 'id'>[]) {
    try {
      this._isLoading.set(true);
      this._loadError.set(null);
      await this.couplesService.createCouplesBatch(couples);

      // Registrar múltiples operaciones
      for (let i = 0; i < couples.length; i++) {
        this.userLimitsService.incrementUsage('couples_create');
      }

      this.toastService.success(`${couples.length} parejas creadas exitosamente`);
      // La lista se actualizará automáticamente por el observable
    } catch (error) {
      this._loadError.set('Error al crear las parejas');
      this.toastService.error('Error al crear las parejas. Por favor, inténtelo de nuevo.');
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  async updateCouple(id: string, couple: Partial<Couples>) {
    try {
      this._isLoading.set(true);
      this._loadError.set(null);
      await this.couplesService.updateCouple(id, couple);

      // Registrar la operación en los límites
      this.userLimitsService.incrementUsage('couples_update');

      this.toastService.success('Pareja actualizada exitosamente');
    } catch (error) {
      this._loadError.set('Error al actualizar la pareja');
      this.toastService.error('Error al actualizar la pareja. Por favor, inténtelo de nuevo.');
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  async deleteCouple(id: string, userId: string) {
    try {
      this._isLoading.set(true);
      this._loadError.set(null);
      await this.couplesService.deleteCouple(id, userId);

      // Registrar la operación en los límites
      this.userLimitsService.incrementUsage('couples_delete');

      this.toastService.success('Pareja eliminada exitosamente');
    } catch (error) {
      this._loadError.set('Error al eliminar la pareja');
      this.toastService.error('Error al eliminar la pareja. Por favor, inténtelo de nuevo.');
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  // Limpiar errores
  clearError() {
    this._loadError.set(null);
  }

  // Reinicializar estado
  resetState() {
    this._isLoading.set(false);
    this._loadError.set(null);
  }

  // Refrescar datos
  refresh() {
    // La actualización se hace automáticamente por el observable
    this._loadError.set(null);
  }
}

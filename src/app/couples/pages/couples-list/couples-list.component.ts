import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom, map, Observable, take } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { UserLimitsService } from '../../../shared/services/user-limits.service';
import { convertFirestoreDate } from '../../../shared/utils/date.utils';
import { Couples } from '../../interface/couples.interface';
import { CouplesStoreService } from '../../services/couples-store.service';

@Component({
  selector: 'app-couples-list',
  imports: [CommonModule, RouterLink],
  templateUrl: './couples-list.component.html',
  styles: []
})
export class CouplesListComponent implements OnInit {
  public couplesStore = inject(CouplesStoreService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private userLimitsService = inject(UserLimitsService);

  // Señales para el sistema de límites
  userStats = signal<any>(null);
  visibleCouples = signal<any[]>([]);
  hiddenCouplesCount = signal(0);

  ngOnInit() {
    // Limpiar cualquier error previo al cargar el componente
    this.couplesStore.clearError();

    // Cargar estadísticas del usuario y aplicar límites
    this.loadUserLimits();
  }

  private loadUserLimits() {
    // Obtener estadísticas del usuario
    this.userLimitsService.getUserStats().subscribe(stats => {
      this.userStats.set(stats);
      this.applyVisibilityLimits();
    });
  }

  private applyVisibilityLimits() {
    const stats = this.userStats();
    const allCouples = this.couplesStore.couplesList() || [];

    if (!stats) {
      this.visibleCouples.set(allCouples);
      this.hiddenCouplesCount.set(0);
      return;
    }

    // Aplicar límites de visibilidad
    const maxVisible = stats.visibleRecords?.couples || 10; // Plan gratuito por defecto
    const visible = allCouples.slice(0, maxVisible);
    const hidden = Math.max(0, allCouples.length - maxVisible);

    this.visibleCouples.set(visible);
    this.hiddenCouplesCount.set(hidden);
  }

  // Verificar si puede crear una nueva pareja
  canCreateCouple(): Observable<boolean> {
    return this.userLimitsService.canCreateRecord('couple');
  }

  // Verificar si puede editar una pareja específica
  canEditCouple(coupleIndex: number): Observable<boolean> {
    return this.userLimitsService.checkRecordAccess('couple', coupleIndex).pipe(
      map(access => access.editable)
    );
  }

  // Obtener el requisito del plan para mostrar en UI
  getPlanRequirement(): string {
    const stats = this.userStats();
    if (!stats) return 'Cargando...';

    switch (stats.planType) {
      case 'free': return 'Requiere Plan Premium';
      case 'trial': return 'Solo durante prueba';
      default: return 'Disponible';
    }
  }

  // Navegación a upgrade de plan
  upgradePlan() {
    this.router.navigate(['/subscription']);
  }

  // Getters para el template
  get filteredCouples() {
    return this.couplesStore.filteredCouples;
  }

  get isLoading() {
    return this.couplesStore.isLoading;
  }

  get loadError() {
    return this.couplesStore.loadError;
  }

  get statistics() {
    return this.couplesStore.statistics;
  }

  get selectedSeason() {
    return this.couplesStore.selectedSeason;
  }

  get availableSeasons() {
    return this.couplesStore.availableSeasons;
  }

  // Métodos para el template
  onSeasonChange(event: Event) {
    const season = (event.target as HTMLSelectElement).value;
    this.couplesStore.setSelectedSeason(season);
  }

  getCoupleDetails(couple: Couples) {
    return this.couplesStore.getCoupleDetails(couple);
  }

  trackByCouple(index: number, couple: Couples): string {
    return couple.id;
  }
  // Eliminar pareja con confirmación y validación de límites
  async confirmDeleteCouple(couple: Couples, index: number) {
    // Verificar permisos de eliminación
    this.userLimitsService.checkRecordAccess('couple', index + 1).subscribe(access => {
      if (!access.deletable) {
        this.toastService.error(
          access.reason || 'No tienes permisos para eliminar este registro con tu plan actual.',
          'Acción no permitida'
        );

        if (access.suggestion) {
          this.toastService.confirm(
            access.suggestion,
            () => this.upgradePlan(),
            undefined,
            'Actualizar Plan'
          );
        }
        return;
      }

      const coupleDetails = this.getCoupleDetails(couple)();
      const maleInfo = coupleDetails.male ? `N° ${coupleDetails.male.ringNumber}` : 'Sin anillo';
      const femaleInfo = coupleDetails.female ? `N° ${coupleDetails.female.ringNumber}` : 'Sin anillo';

      this.toastService.confirm(
        `¿Eliminar pareja del Nido ${couple.nestCode}?\nMacho: ${maleInfo} | Hembra: ${femaleInfo}`,
        () => this.deleteCouple(couple),
        undefined,
        'Confirmar Eliminación'
      );
    });
  }

  // Navegar a agregar nueva pareja con validación de límites
  navigateToAddCouple() {
    this.canCreateCouple().subscribe(canCreate => {
      if (canCreate) {
        this.router.navigate(['/couples/couples-add']);
      } else {
        this.toastService.error(
          'Has alcanzado el límite de parejas para tu plan actual. Actualiza tu suscripción para crear más.',
          'Límite alcanzado'
        );

        // Mostrar opción de upgrade
        this.toastService.confirm(
          '¿Quieres ver los planes disponibles?',
          () => this.upgradePlan(),
          undefined,
          'Actualizar Plan'
        );
      }
    });
  }

  // Eliminar pareja
  private async deleteCouple(couple: Couples) {
    try {
      const user = await firstValueFrom(
        this.authService.authState$.pipe(
          map(user => user),
          take(1)
        )
      );

      if (!user?.email) {
        this.toastService.error('Usuario no autenticado. Por favor, inicie sesión nuevamente.');
        return;
      }

      if (!couple.id) {
        this.toastService.error('Error: ID de pareja no encontrado');
        return;
      }

      await this.couplesStore.deleteCouple(couple.id, user.email);

      // Recargar límites después de eliminar
      this.loadUserLimits();
    } catch (error) {
      console.error('Error deleting couple:', error);
      // El store ya maneja el toast de error
    }
  }

  // Usar función de utilidad importada
  convertFirestoreDate = convertFirestoreDate;
}

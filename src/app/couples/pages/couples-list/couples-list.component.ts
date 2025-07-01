import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CouplesStoreService } from '../../services/couples-store.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Couples } from '../../interface/couples.interface';
import { firstValueFrom, take, map } from 'rxjs';

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

  ngOnInit() {
    // Limpiar cualquier error previo al cargar el componente
    this.couplesStore.clearError();
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
  // Eliminar pareja con confirmación
  async confirmDeleteCouple(couple: Couples) {
    const coupleDetails = this.getCoupleDetails(couple)();
    const maleInfo = coupleDetails.male ? `N° ${coupleDetails.male.ringNumber}` : 'Sin anillo';
    const femaleInfo = coupleDetails.female ? `N° ${coupleDetails.female.ringNumber}` : 'Sin anillo';

    this.toastService.confirm(
      `¿Eliminar pareja del Nido ${couple.nestCode}?\nMacho: ${maleInfo} | Hembra: ${femaleInfo}`,
      () => this.deleteCouple(couple),
      undefined,
      'Confirmar Eliminación'
    );
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
    } catch (error) {
      console.error('Error deleting couple:', error);
      // El store ya maneja el toast de error
    }
  }
}

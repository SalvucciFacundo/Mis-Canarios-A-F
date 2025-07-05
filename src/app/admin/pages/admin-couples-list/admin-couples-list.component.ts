import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from '../../../auth/interface/user.interface';
import { UsersStoreService } from '../../../auth/services/users-store.service';
import { Couples } from '../../../couples/interface/couples.interface';
import { CouplesService } from '../../../couples/services/couples.service';

/**
 * Lista de parejas para administración con carga bajo demanda.
 */
@Component({
  selector: 'app-admin-couples-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [UsersStoreService, CouplesService],
  templateUrl: './admin-couples-list.component.html',
  styleUrls: ['./admin-couples-list.component.css']
})
export class AdminCouplesListComponent {
  // Signals para estado reactivo
  users = signal<User[]>([]);
  selectedUser = signal<User | null>(null);
  couples = signal<CoupleWithUserEmail[]>([]);
  loading = signal(false);
  loadingUsers = signal(false);
  loadingCouples = signal(false);
  error = signal<string | null>(null);

  // Filtros y búsqueda
  searchTerm = signal('');
  searchUser = signal('');
  selectedSeason = signal('all');
  sortBy = signal<'nestCode' | 'season' | 'maleId' | 'femaleId'>('nestCode');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Modal states
  showModal = signal(false);
  modalType = signal<'view' | 'edit' | 'delete' | null>(null);
  selectedCouple = signal<CoupleWithUserEmail | null>(null);

  // Form states para edición
  editForm = signal({
    season: '',
    nestCode: '',
    maleId: '',
    femaleId: '',
    posture: '',
    currentPostureNumber: 0,
    postureStartDate: '',
    postureEndDate: '',
    hatchedEggs: 0,
    unhatchedEggs: 0,
    fertiliceEggs: 0,
    unFertiliceEggs: 0,
    brokenEggs: 0,
    deathPiichons: 0,
    observations: '',
    postureObservations: ''
  });

  // Loading states para acciones
  savingCouple = signal(false);
  deletingCouple = signal(false);

  // Notification state
  notification = signal<{ message: string; type: 'success' | 'error' } | null>(null);

  // User couples count cache
  userCoupleCounts = signal<{ [email: string]: number }>({});
  loadingCoupleCounts = signal(false);

  // Computed para filtros
  filteredUsers = computed(() => {
    const search = this.searchUser().toLowerCase();
    if (!search) return this.users();
    return this.users().filter(user =>
      user.email.toLowerCase().includes(search) ||
      user.name.toLowerCase().includes(search)
    );
  });

  filteredCouples = computed(() => {
    let filtered = this.couples();

    // Filtro por búsqueda
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(couple =>
        (couple.nestCode || '').toLowerCase().includes(search) ||
        (couple.maleId || '').toLowerCase().includes(search) ||
        (couple.femaleId || '').toLowerCase().includes(search) ||
        (couple.season || '').toLowerCase().includes(search)
      );
    }

    // Filtro por temporada
    if (this.selectedSeason() !== 'all') {
      filtered = filtered.filter(couple => couple.season === this.selectedSeason());
    }

    // Ordenamiento
    const sortBy = this.sortBy();
    const direction = this.sortDirection();
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      // Convertir a string para comparación
      const aStr = (aVal?.toString() || '').toLowerCase();
      const bStr = (bVal?.toString() || '').toLowerCase();

      if (aStr < bStr) return direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  });

  // Computed para estadísticas
  totalCouples = computed(() => this.couples().length);
  couplesWithPosture = computed(() => this.couples().filter(c => c.posture).length);
  couplesWithEggs = computed(() => this.couples().filter(c => (c.hatchedEggs || 0) + (c.unhatchedEggs || 0) > 0).length);

  // Temporadas únicas
  availableSeasons = computed(() => {
    const seasons = [...new Set(this.couples().map(c => c.season))];
    return seasons.sort().reverse();
  });

  constructor(
    private usersStore: UsersStoreService,
    private couplesService: CouplesService
  ) {
    this.loadUsers();

    // Listener para cerrar modal con Escape
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.showModal()) {
        this.closeModal();
      }
    });
  }

  async loadUsers(): Promise<void> {
    this.loadingUsers.set(true);
    this.error.set(null);
    try {
      const users = await this.usersStore.getAllUsersForAdmin();
      this.users.set(users);
      // Cargar conteos de parejas para todos los usuarios
      await this.loadCoupleCountsForAllUsers(users);
    } catch (e) {
      this.error.set('Error al cargar usuarios');
    } finally {
      this.loadingUsers.set(false);
    }
  }

  async loadCoupleCountsForAllUsers(users: User[]): Promise<void> {
    this.loadingCoupleCounts.set(true);
    try {
      const counts: { [email: string]: number } = {};

      // Cargar conteos en paralelo para mejor rendimiento
      const countPromises = users.map(async (user) => {
        try {
          const couples = await new Promise<Couples[]>((resolve, reject) => {
            this.couplesService.getCouplesByUser(user.email).subscribe({
              next: (data) => resolve(data),
              error: (error) => reject(error)
            });
          });
          counts[user.email] = couples?.length || 0;
        } catch (e) {
          // Si hay error al cargar las parejas de un usuario, mostrar 0
          counts[user.email] = 0;
        }
      });

      await Promise.all(countPromises);
      this.userCoupleCounts.set(counts);
    } catch (e) {
      console.error('Error al cargar conteos de parejas:', e);
    } finally {
      this.loadingCoupleCounts.set(false);
    }
  }

  async selectUser(user: User): Promise<void> {
    this.selectedUser.set(user);
    this.searchUser.set('');
    await this.loadCouplesForUser(user.email);
  }

  async loadCouplesForUser(email: string): Promise<void> {
    this.loadingCouples.set(true);
    this.error.set(null);
    try {
      const couples = await new Promise<Couples[]>((resolve, reject) => {
        this.couplesService.getCouplesByUser(email).subscribe({
          next: (data) => resolve(data),
          error: (error) => reject(error)
        });
      });
      const couplesWithEmail: CoupleWithUserEmail[] = (couples || []).map(couple => ({
        ...couple,
        userEmail: email
      }));
      this.couples.set(couplesWithEmail);

      // Actualizar el conteo en el cache
      this.userCoupleCounts.update(counts => ({
        ...counts,
        [email]: couples?.length || 0
      }));
    } catch (e) {
      this.error.set('Error al cargar parejas del usuario');
    } finally {
      this.loadingCouples.set(false);
    }
  }

  clearSelection(): void {
    this.selectedUser.set(null);
    this.couples.set([]);
    this.searchUser.set('');
    this.clearFilters();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedSeason.set('all');
    this.sortBy.set('nestCode');
    this.sortDirection.set('asc');
  }

  setSortBy(field: 'nestCode' | 'season' | 'maleId' | 'femaleId'): void {
    if (this.sortBy() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.sortDirection.set('asc');
    }
  }

  trackById(index: number, couple: CoupleWithUserEmail): string | number {
    return couple.id || index;
  }

  // Modal actions
  openModal(type: 'view' | 'edit' | 'delete', couple: CoupleWithUserEmail): void {
    this.selectedCouple.set(couple);
    this.modalType.set(type);
    this.showModal.set(true);

    if (type === 'edit') {
      this.editForm.set({
        season: couple.season || '',
        nestCode: couple.nestCode || '',
        maleId: couple.maleId || '',
        femaleId: couple.femaleId || '',
        posture: couple.posture || '',
        currentPostureNumber: couple.currentPostureNumber || 0,
        postureStartDate: couple.postureStartDate ? new Date(couple.postureStartDate).toISOString().split('T')[0] : '',
        postureEndDate: couple.postureEndDate ? new Date(couple.postureEndDate).toISOString().split('T')[0] : '',
        hatchedEggs: couple.hatchedEggs || 0,
        unhatchedEggs: couple.unhatchedEggs || 0,
        fertiliceEggs: couple.fertiliceEggs || 0,
        unFertiliceEggs: couple.unFertiliceEggs || 0,
        brokenEggs: couple.brokenEggs || 0,
        deathPiichons: couple.deathPiichons || 0,
        observations: couple.observations || '',
        postureObservations: couple.postureObservations || ''
      });
    }
  }

  closeModal(): void {
    this.showModal.set(false);
    this.modalType.set(null);
    this.selectedCouple.set(null);
    this.savingCouple.set(false);
    this.deletingCouple.set(false);
  }

  async saveCouple(): Promise<void> {
    const couple = this.selectedCouple();
    const form = this.editForm();

    if (!couple || !this.selectedUser()) return;

    this.savingCouple.set(true);
    try {
      const updatedCouple: Couples = {
        ...couple,
        season: form.season,
        nestCode: form.nestCode,
        maleId: form.maleId,
        femaleId: form.femaleId,
        posture: form.posture,
        currentPostureNumber: form.currentPostureNumber,
        postureStartDate: form.postureStartDate ? new Date(form.postureStartDate) : undefined,
        postureEndDate: form.postureEndDate ? new Date(form.postureEndDate) : undefined,
        hatchedEggs: form.hatchedEggs,
        unhatchedEggs: form.unhatchedEggs,
        fertiliceEggs: form.fertiliceEggs,
        unFertiliceEggs: form.unFertiliceEggs,
        brokenEggs: form.brokenEggs,
        deathPiichons: form.deathPiichons,
        observations: form.observations,
        postureObservations: form.postureObservations,
        modificationDate: new Date(),
        userId: this.selectedUser()!.email
      };

      await this.couplesService.updateCouple(couple.id, updatedCouple);

      // Actualizar la lista local
      const updatedCouples = this.couples().map(c =>
        c.id === couple.id ? { ...updatedCouple, userEmail: couple.userEmail } : c
      );
      this.couples.set(updatedCouples);

      // Mostrar notificación de éxito
      this.showNotification('Pareja actualizada correctamente', 'success');
      this.closeModal();
    } catch (e) {
      this.error.set('Error al actualizar la pareja');
      this.showNotification('Error al actualizar la pareja', 'error');
    } finally {
      this.savingCouple.set(false);
    }
  }

  async deleteCouple(): Promise<void> {
    const couple = this.selectedCouple();

    if (!couple || !this.selectedUser()) return;

    this.deletingCouple.set(true);
    try {
      await this.couplesService.deleteCouple(couple.id, this.selectedUser()!.email);

      // Remover de la lista local
      const updatedCouples = this.couples().filter(c => c.id !== couple.id);
      this.couples.set(updatedCouples);

      // Actualizar el conteo en el cache
      this.userCoupleCounts.update(counts => ({
        ...counts,
        [this.selectedUser()!.email]: updatedCouples.length
      }));

      // Mostrar notificación de éxito
      this.showNotification('Pareja eliminada correctamente', 'success');
      this.closeModal();
    } catch (e) {
      this.error.set('Error al eliminar la pareja');
      this.showNotification('Error al eliminar la pareja', 'error');
    } finally {
      this.deletingCouple.set(false);
    }
  }

  // Helpers para formulario
  updateEditForm(field: string, value: any): void {
    this.editForm.update(form => ({ ...form, [field]: value }));
  }

  getModalTitle(): string {
    const type = this.modalType();
    switch (type) {
      case 'view': return 'Detalles de la Pareja';
      case 'edit': return 'Editar Pareja';
      case 'delete': return 'Eliminar Pareja';
      default: return '';
    }
  }

  showNotification(message: string, type: 'success' | 'error'): void {
    this.notification.set({ message, type });
    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      this.notification.set(null);
    }, 5000);
  }

  hideNotification(): void {
    this.notification.set(null);
  }

  getCoupleCountForUser(email: string): number {
    return this.userCoupleCounts()[email] || 0;
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-ES');
  }
}

export interface CoupleWithUserEmail extends Couples {
  userEmail: string;
}

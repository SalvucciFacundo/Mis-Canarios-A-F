import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from '../../../auth/interface/user.interface';
import { UsersStoreService } from '../../../auth/services/users-store.service';
import { Birds } from '../../../birds/interface/birds.interface';
import { BirdsRegisterService } from '../../../birds/services/birds-register.service';

/**
 * Lista de canarios para administración con carga bajo demanda.
 */
@Component({
  selector: 'app-admin-birds-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [UsersStoreService, BirdsRegisterService],
  templateUrl: './admin-birds-list.component.html',
  styleUrls: ['./admin-birds-list.component.css']
})
export class AdminBirdsListComponent {
  // Signals para estado reactivo
  users = signal<User[]>([]);
  selectedUser = signal<User | null>(null);
  birds = signal<BirdWithUserEmail[]>([]);
  loading = signal(false);
  loadingUsers = signal(false);
  loadingBirds = signal(false);
  error = signal<string | null>(null);

  // Filtros y búsqueda
  searchTerm = signal('');
  searchUser = signal('');
  selectedState = signal('all');
  selectedSeason = signal('all');
  sortBy = signal<'ringNumber' | 'line' | 'season' | 'state'>('ringNumber');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Estados disponibles
  states = ['all', 'criadero', 'vendido', 'muerto'];

  // Modal states
  showModal = signal(false);
  modalType = signal<'view' | 'edit' | 'delete' | null>(null);
  selectedBird = signal<BirdWithUserEmail | null>(null);

  // Form states para edición
  editForm = signal({
    ringNumber: 0,
    line: '',
    season: 0,
    origin: '',
    state: '',
    stateObservation: '',
    gender: '',
    ringColor: '',
    observations: ''
  });

  // Loading states para acciones
  savingBird = signal(false);
  deletingBird = signal(false);

  // Notification state
  notification = signal<{ message: string; type: 'success' | 'error' } | null>(null);

  // User birds count cache
  userBirdCounts = signal<{ [email: string]: number }>({});
  loadingBirdCounts = signal(false);

  // Computed para filtros
  filteredUsers = computed(() => {
    const search = this.searchUser().toLowerCase();
    if (!search) return this.users();
    return this.users().filter(user =>
      user.email.toLowerCase().includes(search) ||
      user.name.toLowerCase().includes(search)
    );
  });

  filteredBirds = computed(() => {
    let filtered = this.birds();

    // Filtro por búsqueda
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(bird =>
        (bird.ringNumber?.toString() || '').toLowerCase().includes(search) ||
        (bird.line || '').toLowerCase().includes(search) ||
        (bird.origin || '').toLowerCase().includes(search)
      );
    }

    // Filtro por estado
    if (this.selectedState() !== 'all') {
      filtered = filtered.filter(bird => bird.state === this.selectedState());
    }

    // Filtro por temporada
    if (this.selectedSeason() !== 'all') {
      filtered = filtered.filter(bird => bird.season?.toString() === this.selectedSeason());
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
  totalBirds = computed(() => this.birds().length);
  activeBirds = computed(() => this.birds().filter(b => b.state === 'criadero').length);
  soldBirds = computed(() => this.birds().filter(b => b.state === 'vendido').length);
  deadBirds = computed(() => this.birds().filter(b => b.state === 'muerto').length);

  // Temporadas únicas
  availableSeasons = computed(() => {
    const seasons = [...new Set(this.birds().map(b => b.season))];
    return seasons.sort().reverse();
  });

  constructor(
    private usersStore: UsersStoreService,
    private birdsRegister: BirdsRegisterService
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
      // Cargar conteos de canarios para todos los usuarios
      await this.loadBirdCountsForAllUsers(users);
    } catch (e) {
      this.error.set('Error al cargar usuarios');
    } finally {
      this.loadingUsers.set(false);
    }
  }

  async loadBirdCountsForAllUsers(users: User[]): Promise<void> {
    this.loadingBirdCounts.set(true);
    try {
      const counts: { [email: string]: number } = {};

      // Cargar conteos en paralelo para mejor rendimiento
      const countPromises = users.map(async (user) => {
        try {
          const birds = await this.birdsRegister.getBirds(user.email);
          counts[user.email] = birds.length;
        } catch (e) {
          // Si hay error al cargar los canarios de un usuario, mostrar 0
          counts[user.email] = 0;
        }
      });

      await Promise.all(countPromises);
      this.userBirdCounts.set(counts);
    } catch (e) {
      console.error('Error al cargar conteos de canarios:', e);
    } finally {
      this.loadingBirdCounts.set(false);
    }
  }

  async selectUser(user: User): Promise<void> {
    this.selectedUser.set(user);
    this.searchUser.set('');
    await this.loadBirdsForUser(user.email);
  }

  async loadBirdsForUser(email: string): Promise<void> {
    this.loadingBirds.set(true);
    this.error.set(null);
    try {
      const birds = await this.birdsRegister.getBirds(email);
      const birdsWithEmail: BirdWithUserEmail[] = birds.map(bird => ({
        ...bird,
        userEmail: email
      }));
      this.birds.set(birdsWithEmail);

      // Actualizar el conteo en el cache
      this.userBirdCounts.update(counts => ({
        ...counts,
        [email]: birds.length
      }));
    } catch (e) {
      this.error.set('Error al cargar canarios del usuario');
    } finally {
      this.loadingBirds.set(false);
    }
  }

  clearSelection(): void {
    this.selectedUser.set(null);
    this.birds.set([]);
    this.searchUser.set('');
    this.clearFilters();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedState.set('all');
    this.selectedSeason.set('all');
    this.sortBy.set('ringNumber');
    this.sortDirection.set('asc');
  }

  setSortBy(field: 'ringNumber' | 'line' | 'season' | 'state'): void {
    if (this.sortBy() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.sortDirection.set('asc');
    }
  }

  trackById(index: number, bird: BirdWithUserEmail): string | number {
    return bird.id || index;
  }

  getStateColor(state?: string): string {
    switch (state) {
      case 'criadero': return 'bg-green-100 text-green-800';
      case 'vendido': return 'bg-orange-100 text-orange-800';
      case 'muerto': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStateIcon(state?: string): string {
    switch (state) {
      case 'criadero': return '🏠';
      case 'vendido': return '💰';
      case 'muerto': return '💀';
      default: return '❓';
    }
  }

  // Modal actions
  openModal(type: 'view' | 'edit' | 'delete', bird: BirdWithUserEmail): void {
    this.selectedBird.set(bird);
    this.modalType.set(type);
    this.showModal.set(true);

    if (type === 'edit') {
      this.editForm.set({
        ringNumber: bird.ringNumber || 0,
        line: bird.line || '',
        season: bird.season || 0,
        origin: bird.origin || '',
        state: bird.state || '',
        stateObservation: bird.stateObservation || '',
        gender: bird.gender || '',
        ringColor: bird.ringColor || '',
        observations: bird.observations || ''
      });
    }
  }

  closeModal(): void {
    this.showModal.set(false);
    this.modalType.set(null);
    this.selectedBird.set(null);
    this.savingBird.set(false);
    this.deletingBird.set(false);
  }

  async saveBird(): Promise<void> {
    const bird = this.selectedBird();
    const form = this.editForm();

    if (!bird || !this.selectedUser()) return;

    this.savingBird.set(true);
    try {
      const updatedBird: Birds = {
        ...bird,
        ringNumber: form.ringNumber,
        line: form.line,
        season: form.season,
        origin: form.origin,
        state: form.state,
        stateObservation: form.stateObservation,
        gender: form.gender,
        ringColor: form.ringColor,
        observations: form.observations,
        modificationDate: new Date()
      };

      await this.birdsRegister.updateBird(this.selectedUser()!.email, bird.id!, updatedBird);

      // Actualizar la lista local
      const updatedBirds = this.birds().map(b =>
        b.id === bird.id ? { ...updatedBird, userEmail: bird.userEmail } : b
      );
      this.birds.set(updatedBirds);

      // Mostrar notificación de éxito
      this.showNotification('Canario actualizado correctamente', 'success');
      this.closeModal();
    } catch (e) {
      this.error.set('Error al actualizar el canario');
      this.showNotification('Error al actualizar el canario', 'error');
    } finally {
      this.savingBird.set(false);
    }
  }

  async deleteBird(): Promise<void> {
    const bird = this.selectedBird();

    if (!bird || !this.selectedUser()) return;

    this.deletingBird.set(true);
    try {
      await this.birdsRegister.deleteBird(this.selectedUser()!.email, bird.id!);

      // Remover de la lista local
      const updatedBirds = this.birds().filter(b => b.id !== bird.id);
      this.birds.set(updatedBirds);

      // Actualizar el conteo en el cache
      this.userBirdCounts.update(counts => ({
        ...counts,
        [this.selectedUser()!.email]: updatedBirds.length
      }));

      // Mostrar notificación de éxito
      this.showNotification('Canario eliminado correctamente', 'success');
      this.closeModal();
    } catch (e) {
      this.error.set('Error al eliminar el canario');
      this.showNotification('Error al eliminar el canario', 'error');
    } finally {
      this.deletingBird.set(false);
    }
  }

  // Helpers para formulario
  updateEditForm(field: string, value: any): void {
    this.editForm.update(form => ({ ...form, [field]: value }));
  }

  getModalTitle(): string {
    const type = this.modalType();
    switch (type) {
      case 'view': return 'Detalles del Canario';
      case 'edit': return 'Editar Canario';
      case 'delete': return 'Eliminar Canario';
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

  getBirdCountForUser(email: string): number {
    return this.userBirdCounts()[email] || 0;
  }
}

export interface BirdWithUserEmail extends Birds {
  userEmail: string;
}

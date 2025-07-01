import { CommonModule } from '@angular/common';
import { Component, computed, signal, HostListener, inject } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { BirdsStoreService } from '../../services/birds-store.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-birds-list',
  imports: [CommonModule, RouterModule],
  templateUrl: './birds-list.component.html',
  styleUrl: './birds-list.component.css'
})
export class BirdsListComponent {

  mostrarInactivos = signal(false);
  scrollY = signal(0);
  private toastService = inject(ToastService);

  constructor(public birdsStore: BirdsStoreService) { }

  @HostListener('window:scroll')
  onScroll() {
    this.scrollY.set(window.scrollY);
  }

  filteredBirds = computed(() => {
    const term = this.search().toLowerCase().trim();
    const mostrarTodos = this.mostrarInactivos();

    return this.birds().filter(bird => {
      const visible = mostrarTodos || (bird.state !== 'vendido' && bird.state !== 'muerto');
      const coincideBusqueda =
        bird.line?.toLowerCase().includes(term) ||
        bird.origin?.toLowerCase().includes(term) ||
        bird.ringNumber?.toString().includes(term);

      return visible && coincideBusqueda;
    });
  });

  onToggleMostrarInactivos(event: Event) {
    const checked = (event.target as HTMLInputElement)?.checked ?? false;
    this.mostrarInactivos.set(checked);
  }

  get canariosActivos() {
    return this.birds()?.filter(b => b.state !== 'vendido' && b.state !== 'muerto')?.length ?? 0;
  }

  get canariosInactivos() {
    return this.birds()?.filter(b => b.state === 'vendido' || b.state === 'muerto')?.length ?? 0;
  }



  get search() {
    return this.birdsStore.search;
  }

  get birds() {
    return this.birdsStore.birdsList;
  }

  get loading() {
    return this.birdsStore.isLoading;
  }

  get error() {
    return this.birdsStore.loadError;
  }

  onRefresh() {
    this.birdsStore.refresh();
  }

  // Métodos para el botón scroll to top
  showScrollToTop(): boolean {
    return this.scrollY() > 300; // Mostrar después de scrollear 300px
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  async eliminarCanario(bird: any) {
    const email = this.birdsStore.userEmail();
    if (!email || !bird.id) return;

    // Mostrar confirmación
    this.toastService.confirm(
      `¿Estás seguro de que deseas eliminar el canario ${bird.ringNumber || 'sin anillo'}? Esta acción no se puede deshacer.`,
      async () => {
        await this.birdsStore.eliminarCanario(email, bird.id);
      },
      undefined,
      'Confirmar eliminación'
    );
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




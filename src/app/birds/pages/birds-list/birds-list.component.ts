import { CommonModule } from '@angular/common';
import { Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { map, Observable } from 'rxjs';
import { ToastService } from '../../../shared/services/toast.service';
import { UserLimitsService } from '../../../shared/services/user-limits.service';
import { BirdsStoreService } from '../../services/birds-store.service';

@Component({
  selector: 'app-birds-list',
  imports: [CommonModule, RouterModule, RouterLink],
  templateUrl: './birds-list.component.html',
  styleUrl: './birds-list.component.css'
})
export class BirdsListComponent implements OnInit {

  mostrarInactivos = signal(false);
  scrollY = signal(0);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private userLimitsService = inject(UserLimitsService);

  // Señales para el sistema de límites
  userStats = signal<any>(null);
  visibleBirds = signal<any[]>([]);
  hiddenBirdsCount = signal(0);

  constructor(public birdsStore: BirdsStoreService) { }

  ngOnInit() {
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
    const allBirds = this.birds() || [];

    if (!stats) {
      this.visibleBirds.set(allBirds);
      this.hiddenBirdsCount.set(0);
      return;
    }

    // Aplicar límites de visibilidad
    const maxVisible = stats.visibleRecords?.birds || 30; // Plan gratuito por defecto
    const visible = allBirds.slice(0, maxVisible);
    const hidden = Math.max(0, allBirds.length - maxVisible);

    this.visibleBirds.set(visible);
    this.hiddenBirdsCount.set(hidden);
  }

  // Verificar si puede crear un nuevo canario
  canCreateBird(): Observable<boolean> {
    return this.userLimitsService.canCreateRecord('bird');
  }

  // Verificar si puede editar un canario específico
  canEditBird(birdIndex: number): Observable<boolean> {
    return this.userLimitsService.checkRecordAccess('bird', birdIndex).pipe(
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

  @HostListener('window:scroll')
  onScroll() {
    this.scrollY.set(window.scrollY);
  }

  filteredBirds = computed(() => {
    const term = this.search().toLowerCase().trim();
    const mostrarTodos = this.mostrarInactivos();
    const birdsToFilter = this.visibleBirds(); // Usar visibleBirds en lugar de birds

    return birdsToFilter.filter(bird => {
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

  async eliminarCanario(bird: any, index: number) {
    const email = this.birdsStore.userEmail();
    if (!email || !bird.id) return;

    // Verificar permisos de eliminación
    this.userLimitsService.checkRecordAccess('bird', index + 1).subscribe(access => {
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

      // Mostrar confirmación
      this.toastService.confirm(
        `¿Estás seguro de que deseas eliminar el canario ${bird.ringNumber || 'sin anillo'}? Esta acción no se puede deshacer.`,
        async () => {
          await this.birdsStore.eliminarCanario(email, bird.id);
          // Recargar límites después de eliminar
          this.loadUserLimits();
        },
        undefined,
        'Confirmar eliminación'
      );
    });
  }

  // Navegar a agregar nuevo canario con validación de límites
  navigateToAddBird() {
    this.canCreateBird().subscribe(canCreate => {
      if (canCreate) {
        this.router.navigate(['/birds/birds-add']);
      } else {
        this.toastService.error(
          'Has alcanzado el límite de canarios para tu plan actual. Actualiza tu suscripción para crear más.',
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




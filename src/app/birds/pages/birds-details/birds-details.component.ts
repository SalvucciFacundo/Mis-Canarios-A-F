import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { UserLimitsService } from '../../../shared/services/user-limits.service';
import { BirdsStoreService } from '../../services/birds-store.service';

@Component({
  selector: 'app-birds-details',
  imports: [CommonModule],
  templateUrl: './birds-details.component.html',
  styleUrl: './birds-details.component.css'
})
export class BirdsDetailsComponent implements OnInit, OnDestroy {
  private id = signal<string | null>(null);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private userLimitsService = inject(UserLimitsService);
  private routeSubscription?: Subscription;
  private permissionsSubscription?: Subscription;

  // Signal para los permisos de edición
  private canEditSignal = signal<boolean>(false);

  constructor(private route: ActivatedRoute, public birdsStore: BirdsStoreService) {
  }

  ngOnInit() {
    // Suscribirse a los cambios de parámetros de la ruta
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const paramId = params.get('id');
      if (paramId) {
        this.id.set(paramId);
      }
    });

    // Suscribirse a los permisos de edición
    this.permissionsSubscription = this.userLimitsService.canEditRecord('bird').subscribe(canEdit => {
      this.canEditSignal.set(canEdit);
      console.log('🔒 [BirdsDetails] canEdit updated:', canEdit);
    });
  }

  ngOnDestroy() {
    // Limpiar las suscripciones
    this.routeSubscription?.unsubscribe();
    this.permissionsSubscription?.unsubscribe();
  }

  readonly bird = computed(() => {
    const birds = this.birdsStore.birdsList();
    const id = this.id();
    return birds.find(b => b.id === id);
  });

  // Computed para verificar permisos de edición
  readonly canEdit = computed(() => {
    return this.canEditSignal();
  });

  // Métodos para obtener información de padre y madre
  readonly fatherInfo = computed(() => {
    const currentBird = this.bird();
    if (!currentBird?.father) return null;

    const birds = this.birdsStore.birdsList();
    const father = birds.find(b => b.id === currentBird.father);
    return father;
  });

  readonly motherInfo = computed(() => {
    const currentBird = this.bird();
    if (!currentBird?.mother) return null;

    const birds = this.birdsStore.birdsList();
    const mother = birds.find(b => b.id === currentBird.mother);
    return mother;
  });

  // Método para formatear la información de padre/madre
  formatParentInfo(parent: any): string {
    if (!parent) return '—';

    const ringInfo = parent.ringNumber ? `N° anillo: ${parent.ringNumber}` : 'Sin anillo';
    const lineInfo = parent.line ? `Línea: ${parent.line}` : 'Sin línea';

    return `${ringInfo} • ${lineInfo}`;
  }

  // Navegar a editar
  async editBird() {
    // Verificar permisos usando Observable
    const canEdit = await firstValueFrom(this.userLimitsService.canEditRecord('bird'));

    if (!canEdit) {
      this.toastService.warning('Plan Free: solo puedes ver los canarios. Actualiza a Premium para editar.');
      return;
    }

    const id = this.id();
    if (id) {
      this.router.navigate(['/birds/birds-edit', id]);
    }
  }

  // Eliminar canario con confirmación
  async deleteBird() {
    // Verificar permisos usando Observable
    const canEdit = await firstValueFrom(this.userLimitsService.canEditRecord('bird'));

    if (!canEdit) {
      this.toastService.warning('Plan Free: solo puedes ver los canarios. Actualiza a Premium para eliminar.');
      return;
    }

    const currentBird = this.bird();
    if (!currentBird) return;

    const confirmMessage = `¿Está seguro de eliminar el canario N° ${currentBird.ringNumber || 'Sin anillo'}?

Línea: ${currentBird.line || 'Sin línea'}
Temporada: ${currentBird.season || 'N/A'}

Esta acción no se puede deshacer.`;

    this.toastService.confirm(
      confirmMessage,
      async () => {
        try {
          const userEmail = this.authService.currentUserEmail();
          if (!userEmail) {
            this.toastService.error('Usuario no autenticado');
            return;
          }
          await this.birdsStore.eliminarCanario(userEmail, currentBird.id!);
          this.goBack(); // Usar goBack() para respetar la navegación
        } catch (error) {
          // El error ya se maneja en el store
        }
      },
      undefined,
      'Confirmar eliminación'
    );
  }

  // Volver a la lista o a la pareja anterior
  goBack() {
    const queryParams = this.route.snapshot.queryParams;

    // Si viene de una pareja específica, volver a ella
    if (queryParams['returnTo'] === 'couple' && queryParams['coupleId']) {
      this.router.navigate(['/couples/couples-details', queryParams['coupleId']]);
    } else {
      // Navegación normal a la lista de pájaros
      this.router.navigate(['/birds/birds-list']);
    }
  }

  // Navegar a detalles del padre
  viewFatherDetails() {
    const father = this.fatherInfo();
    if (father?.id) {
      this.router.navigate(['/birds/birds-details', father.id]);
    }
  }

  // Navegar a detalles de la madre
  viewMotherDetails() {
    const mother = this.motherInfo();
    if (mother?.id) {
      this.router.navigate(['/birds/birds-details', mother.id]);
    }
  }

  // Mostrar toast cuando no se puede editar
  showEditNotAllowedToast() {
    this.toastService.warning('Plan Free: solo puedes ver los canarios. Actualiza a Premium para editar.');
  }

  // Mostrar toast cuando no se puede eliminar
  showDeleteNotAllowedToast() {
    this.toastService.warning('Plan Free: solo puedes ver los canarios. Actualiza a Premium para eliminar.');
  }
}

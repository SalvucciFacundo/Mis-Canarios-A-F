import { Component, computed, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { Birds } from '../../interface/birds.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { BirdsRegisterService } from '../../services/birds-register.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { firstValueFrom, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
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
  private routeSubscription?: Subscription;

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
  }

  ngOnDestroy() {
    // Limpiar la suscripción
    this.routeSubscription?.unsubscribe();
  }

  readonly bird = computed(() => {
    const birds = this.birdsStore.birdsList();
    const id = this.id();
    return birds.find(b => b.id === id);
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
  editBird() {
    const id = this.id();
    if (id) {
      this.router.navigate(['/birds/birds-edit', id]);
    }
  }

  // Eliminar canario con confirmación
  async deleteBird() {
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
}

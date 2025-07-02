import { Component, inject, signal, computed, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CouplesStoreService } from '../../services/couples-store.service';
import { BirdsStoreService } from '../../../birds/services/birds-store.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Couples } from '../../interface/couples.interface';
import { Birds } from '../../../birds/interface/birds.interface';
import { Timestamp } from 'firebase/firestore';
import { convertFirestoreDate, formatDateForInput, daysBetween } from '../../../shared/utils/date.utils';

@Component({
  selector: 'app-couples-details',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './couples-details.component.html',
  styleUrl: './couples-details.component.css'
})
export class CouplesDetailsComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private couplesStore = inject(CouplesStoreService);
  private birdsStore = inject(BirdsStoreService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  // State
  coupleId = signal<string | null>(null);
  isLoading = signal(true);
  showPostureForm = signal(false);
  isUpdatingPosture = signal(false);
  private autoSaveTimeout: any = null;
  justSaved = signal(false);
  private justSavedTimeout: any = null;

  // Formulario para gestión de posturas
  postureForm: FormGroup = this.fb.group({
    postureStartDate: [''],
    postureEndDate: [''],
    hatchedEggs: [0, [Validators.min(0)]],
    unhatchedEggs: [0, [Validators.min(0)]],
    fertiliceEggs: [0, [Validators.min(0)]],
    unFertiliceEggs: [0, [Validators.min(0)]],
    brokenEggs: [0, [Validators.min(0)]],
    deathPiichons: [0, [Validators.min(0)]],
    postureObservations: [''],  // Campo específico para observaciones de postura
    _isAutoSave: [false]  // Campo auxiliar para control de auto-guardado
  });

  // Computed values
  couple = computed(() => {
    const id = this.coupleId();
    if (!id) return null;

    const couples = this.couplesStore.couplesList();
    return couples.find(c => c.id === id) || null;
  });

  coupleDetails = computed(() => {
    const currentCouple = this.couple();
    if (!currentCouple) return null;

    return this.couplesStore.getCoupleDetails(currentCouple)();
  });

  // Estado de la postura para mostrar timeline (3 estados: Sin iniciar, Iniciada, Finalizada)
  postureStatus = computed(() => {
    const currentCouple = this.couple();
    if (!currentCouple) return 'not-started';

    const hasStartDate = !!currentCouple.postureStartDate;
    const hasEndDate = !!currentCouple.postureEndDate;

    if (!hasStartDate) return 'not-started';    // Sin iniciar
    if (hasEndDate) return 'completed';         // Finalizada
    return 'started';                           // Iniciada
  });

  // Días desde inicio de postura
  daysFromStart = computed(() => {
    const currentCouple = this.couple();
    if (!currentCouple?.postureStartDate) return 0;

    const startDate = this.convertFirestoreDate(currentCouple.postureStartDate);
    if (!startDate) return 0;

    const today = new Date();
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  });

  // Número de postura actual (se puede expandir para historial múltiple)
  currentPostureNumber = computed(() => {
    const currentCouple = this.couple();
    if (!currentCouple) return 1;

    // Por ahora retornamos 1, pero en el futuro se puede implementar
    // un sistema de historial de posturas múltiples para obtener
    // el número de postura actual basado en las anteriores
    return 1;
  });
  ngOnInit() {
    // Obtener el ID de la ruta
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.coupleId.set(id);
      this.isLoading.set(false);

      // Cargar datos de postura si ya existe una postura iniciada
      // Usar setTimeout para evitar ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        const status = this.postureStatus();
        console.log('Verificando status de postura en ngOnInit:', status);
        if (status === 'started') {
          console.log('Postura está iniciada, cargando datos...');
          // Cargar los datos ANTES de mostrar el formulario
          this.loadPostureData();
        }
      }, 0);
    } else {
      this.toastService.error('ID de pareja no válido');
      this.router.navigate(['/couples']);
    }
  }

  // Navegar a editar
  editCouple() {
    const id = this.coupleId();
    if (id) {
      this.router.navigate(['/couples/couples-edit', id]);
    }
  }

  // Eliminar pareja con confirmación
  deleteCouple() {
    const currentCouple = this.couple();
    if (!currentCouple) return;

    const details = this.coupleDetails();
    const confirmMessage = `¿Está seguro de eliminar la pareja del nido ${currentCouple.nestCode}?

Macho: ${details?.male?.ringNumber || 'Sin anillo'}
Hembra: ${details?.female?.ringNumber || 'Sin anillo'}

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
          await this.couplesStore.deleteCouple(currentCouple.id!, userEmail);
          this.router.navigate(['/couples']);
        } catch (error) {
          // El error ya se maneja en el store
        }
      },
      undefined,
      'Confirmar eliminación'
    );
  }

  // Volver a la lista
  goBack() {
    this.router.navigate(['/couples']);
  }

  // Navegar a registro múltiple de pichones
  addMultipleOffspring() {
    const currentCouple = this.couple();
    const details = this.coupleDetails();

    if (!currentCouple || !details?.male || !details?.female) {
      this.toastService.error('No se puede agregar pichones sin padres definidos');
      return;
    }

    // Navegar a la página de agregar canario con modo de registro múltiple
    this.router.navigate(['/birds/birds-add'], {
      queryParams: {
        mode: 'batch-add',
        fatherId: details.male.id,
        motherId: details.female.id,
        season: currentCouple.season,
        posture: this.currentPostureNumber(),
        registrationSource: 'breeding',
        returnTo: 'couple',
        coupleId: currentCouple.id
      }
    });
  }

  // Navegar a detalles del pichón
  viewBirdDetails(birdId: string) {
    const currentCouple = this.couple();
    this.router.navigate(['/birds/birds-details', birdId], {
      queryParams: {
        returnTo: 'couple',
        coupleId: currentCouple?.id
      }
    });
  }

  // Usar funciones de utilidad importadas
  convertFirestoreDate = convertFirestoreDate;
  formatDateForInput = formatDateForInput;

  // Track by function for performance
  trackByBirdId(index: number, bird: Birds): string {
    return bird.id || `bird-${index}`;
  }

  // === MÉTODOS DE GESTIÓN DE POSTURAS ===

  // Mostrar/ocultar formulario de postura
  togglePostureForm() {
    this.showPostureForm.set(!this.showPostureForm());
    if (this.showPostureForm() && this.postureStatus() === 'started') {
      // Solo cargar datos si el formulario se está abriendo y hay una postura iniciada
      setTimeout(() => {
        this.loadPostureData();
      }, 0);
    }
  }

  // Cargar datos actuales de postura en el formulario
  loadPostureData() {
    const currentCouple = this.couple();
    if (!currentCouple) return;

    console.log('Cargando datos de postura:', {
      hatchedEggs: currentCouple.hatchedEggs,
      unhatchedEggs: currentCouple.unhatchedEggs,
      fertiliceEggs: currentCouple.fertiliceEggs,
      unFertiliceEggs: currentCouple.unFertiliceEggs,
      brokenEggs: currentCouple.brokenEggs,
      deathPiichons: currentCouple.deathPiichons
    });

    // Asegurar que los valores numéricos sean números, no undefined
    const formData = {
      postureStartDate: this.formatDateForInput(this.convertFirestoreDate(currentCouple.postureStartDate)),
      postureEndDate: this.formatDateForInput(this.convertFirestoreDate(currentCouple.postureEndDate)),
      hatchedEggs: currentCouple.hatchedEggs ?? 0,
      unhatchedEggs: currentCouple.unhatchedEggs ?? 0,
      fertiliceEggs: currentCouple.fertiliceEggs ?? 0,
      unFertiliceEggs: currentCouple.unFertiliceEggs ?? 0,
      brokenEggs: currentCouple.brokenEggs ?? 0,
      deathPiichons: currentCouple.deathPiichons ?? 0,
      postureObservations: currentCouple.postureObservations || ''  // Usar campo específico
    };

    console.log('Datos a cargar en formulario:', formData);
    this.postureForm.patchValue(formData);

    // Forzar la detección de cambios después de un pequeño delay
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 10);
  }

  // Guardar cambios de postura con debounce
  async savePostureChanges() {
    if (this.postureForm.invalid) {
      this.toastService.error('Por favor, corrija los errores en el formulario');
      return;
    }

    const currentCouple = this.couple();
    if (!currentCouple) return;

    // Cancelar guardado anterior si existe
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    // Esperar 500ms antes de guardar para evitar múltiples llamadas
    this.autoSaveTimeout = setTimeout(async () => {
      this.isUpdatingPosture.set(true);

      try {
        const userEmail = this.authService.currentUserEmail();
        if (!userEmail) {
          this.toastService.error('Usuario no autenticado');
          return;
        }

        const formData = this.postureForm.value;

        // Preparar datos sin campos undefined para evitar errores de Firebase
        const updateData: Partial<Couples> = {
          userId: userEmail,
          hatchedEggs: formData.hatchedEggs || 0,
          unhatchedEggs: formData.unhatchedEggs || 0,
          fertiliceEggs: formData.fertiliceEggs || 0,
          unFertiliceEggs: formData.unFertiliceEggs || 0,
          brokenEggs: formData.brokenEggs || 0,
          deathPiichons: formData.deathPiichons || 0,
          postureObservations: formData.postureObservations || '',
          modificationDate: new Date()
        };

        // Solo agregar fechas si tienen valor
        if (formData.postureStartDate) {
          updateData.postureStartDate = new Date(formData.postureStartDate);
        }
        if (formData.postureEndDate) {
          updateData.postureEndDate = new Date(formData.postureEndDate);
        }

        await this.couplesStore.updateCouple(currentCouple.id!, updateData);

        // Mostrar feedback visual
        this.justSaved.set(true);
        if (this.justSavedTimeout) {
          clearTimeout(this.justSavedTimeout);
        }
        this.justSavedTimeout = setTimeout(() => {
          this.justSaved.set(false);
        }, 2000);

        // Mostrar mensaje solo si no es auto-guardado de botones +/-
        if (!this.postureForm.get('_isAutoSave')?.value) {
          this.toastService.success('Datos de postura actualizados correctamente');
        }
      } catch (error) {
        this.toastService.error('Error al actualizar los datos de postura');
      } finally {
        this.isUpdatingPosture.set(false);
        // Limpiar flag de auto-save
        this.postureForm.patchValue({ _isAutoSave: false });
      }
    }, 500);
  }

  // Iniciar postura rápidamente
  async startPosture() {
    const currentCouple = this.couple();
    if (!currentCouple) return;

    const userEmail = this.authService.currentUserEmail();
    if (!userEmail) {
      this.toastService.error('Usuario no autenticado');
      return;
    }

    try {
      const updateData = {
        userId: userEmail,
        postureStartDate: new Date(),
        modificationDate: new Date()
      };
      await this.couplesStore.updateCouple(currentCouple.id!, updateData);
      this.toastService.success('Postura iniciada - Puedes registrar los datos de huevos');

      // Cargar datos del formulario automáticamente después de un breve delay
      // para evitar ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        this.loadPostureData();
      }, 0);
    } catch (error) {
      this.toastService.error('Error al iniciar postura');
    }
  }

  // Finalizar postura rápidamente
  async endPosture() {
    const currentCouple = this.couple();
    if (!currentCouple) return;

    const userEmail = this.authService.currentUserEmail();
    if (!userEmail) {
      this.toastService.error('Usuario no autenticado');
      return;
    }

    try {
      const updateData = {
        userId: userEmail,
        postureEndDate: new Date(),
        modificationDate: new Date()
      };
      await this.couplesStore.updateCouple(currentCouple.id!, updateData);
      this.toastService.success('Postura finalizada');
    } catch (error) {
      this.toastService.error('Error al finalizar postura');
    }
  }

  // Obtener color del estado de postura
  getPostureStatusColor(): string {
    switch (this.postureStatus()) {
      case 'not-started': return 'text-gray-500';
      case 'started': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      default: return 'text-gray-500';
    }
  }

  // Obtener texto del estado de postura
  getPostureStatusText(): string {
    switch (this.postureStatus()) {
      case 'not-started': return 'Sin iniciar';
      case 'started': return 'Iniciada';
      case 'completed': return 'Finalizada';
      default: return 'Desconocido';
    }
  }

  // Métodos para incrementar/decrementar valores en el formulario
  incrementValue(fieldName: string) {
    const currentValue = this.postureForm.get(fieldName)?.value || 0;

    // Usar setTimeout para evitar ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.postureForm.patchValue({
        [fieldName]: currentValue + 1,
        _isAutoSave: true  // Flag para indicar que es auto-guardado
      });
      this.cdr.detectChanges(); // Forzar detección de cambios
      this.savePostureChanges(); // Auto-guardar
    }, 0);
  }

  decrementValue(fieldName: string) {
    const currentValue = this.postureForm.get(fieldName)?.value || 0;
    if (currentValue > 0) {
      // Usar setTimeout para evitar ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        this.postureForm.patchValue({
          [fieldName]: currentValue - 1,
          _isAutoSave: true  // Flag para indicar que es auto-guardado
        });
        this.cdr.detectChanges(); // Forzar detección de cambios
        this.savePostureChanges(); // Auto-guardar
      }, 0);
    }
  }

  // Cleanup para evitar memory leaks
  ngOnDestroy() {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
    if (this.justSavedTimeout) {
      clearTimeout(this.justSavedTimeout);
    }
  }
}

import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, computed, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { Birds } from '../../../birds/interface/birds.interface';
import { BirdsStoreService } from '../../../birds/services/birds-store.service';
import { ToastService } from '../../../shared/services/toast.service';
import { UserLimitsService } from '../../../shared/services/user-limits.service';
import { convertFirestoreDate, formatDateForInput } from '../../../shared/utils/date.utils';
import { Couples } from '../../interface/couples.interface';
import { CouplesStoreService } from '../../services/couples-store.service';

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
  private userLimitsService = inject(UserLimitsService);
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

  // Signal para trackear la cantidad de pichones y forzar updates
  private offspringCount = signal(0);

  // Effect para detectar cambios en el número de pichones (debe estar como inicializador de campo)
  private offspringChangeEffect = effect(() => {
    const details = this.coupleDetails();
    const currentCount = details?.offspring?.length || 0;
    const previousCount = this.offspringCount();

    // Si el número de pichones cambió, actualizar acordeones
    if (currentCount !== previousCount) {
      console.log(`Detectado cambio en pichones: ${previousCount} -> ${currentCount}`);
      this.offspringCount.set(currentCount);

      if (currentCount > 0) {
        // Pequeño delay para asegurar que los datos estén actualizados
        setTimeout(() => {
          console.log('Actualizando acordeones por cambio en pichones...');
          this.initializeAccordions();
        }, 300);
      } else {
        this.accordionStates.set({});
      }
    }
  });

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
    if (hasEndDate) return 'completed';         // Finalizada (pero puede iniciar una nueva)
    return 'started';                           // Iniciada
  });

  // Verificar si puede agregar pichones
  canAddOffspring = computed(() => {
    const status = this.postureStatus();
    // Solo puede agregar pichones cuando la postura está iniciada
    return status === 'started';
  });
  // Agrupar pichones por postura para mostrar en acordeones
  offspringByPosture = computed(() => {
    const details = this.coupleDetails();
    if (!details?.offspring || details.offspring.length === 0) {
      return [];
    }

    // Agrupar por número de postura
    const groups = new Map<number, Birds[]>();

    details.offspring.forEach((bird) => {
      // Usar 1 como valor por defecto si no tiene postura asignada
      const postureNum = bird.posture && bird.posture > 0 ? bird.posture : 1;

      if (!groups.has(postureNum)) {
        groups.set(postureNum, []);
      }
      groups.get(postureNum)!.push(bird);
    });

    // Convertir a array y ordenar por número de postura (más reciente primero)
    const result = Array.from(groups.entries())
      .map(([postureNum, birds]) => ({
        postureNumber: postureNum,
        birds: birds.sort((a, b) => (b.creationDate?.getTime() || 0) - (a.creationDate?.getTime() || 0)),
        count: birds.length
      }))
      .sort((a, b) => b.postureNumber - a.postureNumber);

    return result;
  });

  // Computed para verificar permisos de edición
  readonly canEdit = computed(() => {
    return this.userLimitsService.canEditRecord('couple');
  });

  // Estado de acordeones para cada postura
  accordionStates = signal<{ [key: number]: boolean }>({});

  // Toggle acordeón
  toggleAccordion(postureNumber: number) {
    this.accordionStates.update(states => {
      const newStates = { ...states };
      newStates[postureNumber] = !newStates[postureNumber];
      return newStates;
    });
  }

  // Verificar si un acordeón está abierto
  isAccordionOpen(postureNumber: number): boolean {
    return this.accordionStates()[postureNumber] || false;
  }

  ngOnInit() {
    // Obtener el ID de la ruta
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.coupleId.set(id);
      this.isLoading.set(false);

      // Cargar datos de postura si ya existe una postura iniciada
      // Usar setTimeout para evitar ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        // Migrar parejas existentes que no tengan currentPostureNumber
        this.migrateCurrentPostureNumber();

        const status = this.postureStatus();
        if (status === 'started') {
          // Cargar los datos ANTES de mostrar el formulario
          this.loadPostureData();
        }

        // Inicializar acordeones
        this.initializeAccordions();

        // Inicializar contador de pichones para el effect
        const details = this.coupleDetails();
        this.offspringCount.set(details?.offspring?.length || 0);
      }, 0);

      // Escuchar cambios en la URL para detectar regreso desde agregar pichón
      this.route.queryParams.subscribe(params => {
        if (params['refreshAccordions'] === 'true') {
          console.log('🔄 Recibido parámetro refreshAccordions=true');

          // Usar pooling para detectar cambios en los datos
          this.pollForDataChanges();

          // También limpiar el parámetro de la URL después de un momento
          setTimeout(() => {
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: {},
              replaceUrl: true
            });
          }, 2000);
        }
      });
    } else {
      this.toastService.error('ID de pareja no válido');
      this.router.navigate(['/couples']);
    }
  }

  // Inicializar acordeones
  private initializeAccordions() {
    const postureGroups = this.offspringByPosture();

    if (postureGroups.length > 0) {
      // Obtener el estado actual
      const currentStates = this.accordionStates();

      // Solo abrir el primer acordeón (el de número más alto/más reciente)
      const firstPostureNumber = postureGroups[0].postureNumber;

      // Crear nuevo estado manteniendo los estados existentes si es posible
      const newState: { [key: number]: boolean } = {};
      postureGroups.forEach((group) => {
        // Si ya existía un estado para esta postura, mantenerlo
        // Si no, solo abrir el primer grupo (más reciente)
        if (currentStates[group.postureNumber] !== undefined) {
          newState[group.postureNumber] = currentStates[group.postureNumber];
        } else {
          newState[group.postureNumber] = group.postureNumber === firstPostureNumber;
        }
      });

      this.accordionStates.set(newState);
    } else {
      // Si no hay pichones, inicializar estado vacío
      this.accordionStates.set({});
    }
  }

  ngOnDestroy() {
    // Limpiar timeouts si existen
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
    if (this.justSavedTimeout) {
      clearTimeout(this.justSavedTimeout);
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

  // Usar funciones de utilidad importadas
  convertFirestoreDate = convertFirestoreDate;
  formatDateForInput = formatDateForInput;

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

  // Iniciar postura rápidamente (o iniciar nueva postura después de finalizada)
  async startPosture() {
    const currentCouple = this.couple();
    if (!currentCouple) return;

    const userEmail = this.authService.currentUserEmail();
    if (!userEmail) {
      this.toastService.error('Usuario no autenticado');
      return;
    }

    try {
      const status = this.postureStatus();
      let updateData: any = {
        userId: userEmail,
        modificationDate: new Date()
      };

      if (status === 'not-started') {
        // Primera postura
        updateData.postureStartDate = new Date();
        updateData.currentPostureNumber = 1; // Establecer explícitamente el número de postura
        this.toastService.success('Postura iniciada - Puedes registrar los datos de huevos');
      } else if (status === 'completed') {
        // Nueva postura: calcular el siguiente número basándose en el actual
        let currentNumber = 1;

        if (currentCouple.currentPostureNumber && currentCouple.currentPostureNumber > 0) {
          // Usar el número explícito si existe
          currentNumber = currentCouple.currentPostureNumber;
        } else {
          // Fallback: calcular basándose en pichones existentes
          const details = this.coupleDetails();
          if (details?.offspring && details.offspring.length > 0) {
            details.offspring.forEach(bird => {
              if (bird.posture && bird.posture > currentNumber) {
                currentNumber = bird.posture;
              }
            });
          }
        }

        const nextPostureNumber = currentNumber + 1;

        updateData = {
          ...updateData,
          postureStartDate: new Date(),
          postureEndDate: null, // Limpiar fecha de fin
          currentPostureNumber: nextPostureNumber, // Establecer el número de la nueva postura
          // Limpiar estadísticas de huevos para la nueva postura
          hatchedEggs: 0,
          unhatchedEggs: 0,
          fertiliceEggs: 0,
          unFertiliceEggs: 0,
          brokenEggs: 0,
          deathPiichons: 0,
          postureObservations: '' // Limpiar observaciones de postura anterior
        };
        this.toastService.success(`Nueva postura #${nextPostureNumber} iniciada - Datos anteriores guardados como historial`);
      }

      await this.couplesStore.updateCouple(currentCouple.id!, updateData);

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
        // NO modificamos currentPostureNumber aquí - se mantiene hasta iniciar nueva postura
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

  // Número de postura mostrado en el título (usando el campo explícito currentPostureNumber)
  currentPostureNumber = computed(() => {
    const currentCouple = this.couple();
    if (!currentCouple) return 1;

    // Si tenemos el número explícito en la BD, usarlo (este es el método preferido)
    if (currentCouple.currentPostureNumber && currentCouple.currentPostureNumber > 0) {
      return currentCouple.currentPostureNumber;
    }

    // Fallback: calcular basándose en pichones existentes (para parejas antiguas)
    const details = this.coupleDetails();
    let maxPosture = 0;
    if (details?.offspring && details.offspring.length > 0) {
      details.offspring.forEach(bird => {
        if (bird.posture && bird.posture > maxPosture) {
          maxPosture = bird.posture;
        }
      });
    }

    const status = this.postureStatus();
    if (status === 'completed') {
      return maxPosture + 1;
    } else if (status === 'started') {
      return maxPosture > 0 ? maxPosture : 1;
    } else {
      return maxPosture > 0 ? maxPosture + 1 : 1;
    }
  });

  // Número de postura para asignar a nuevos pichones (solo cuando postura está activa)
  postureNumberForNewOffspring = computed(() => {
    const status = this.postureStatus();

    // Solo calcular si la postura está activa
    if (status !== 'started') return 1;

    // Usar el mismo número que se muestra en el título
    return this.currentPostureNumber();
  });

  // Track by function for performance
  trackByBirdId(index: number, bird: Birds): string {
    return bird.id || `bird-${index}`;
  }

  // Track by function para grupos de postura
  trackByPostureNumber(index: number, postureGroup: { postureNumber: number, birds: Birds[], count: number }): number {
    return postureGroup.postureNumber;
  }

  // Navegar a agregar pichón múltiple
  addMultipleOffspring() {
    const couple = this.couple();
    if (!couple || !this.canAddOffspring()) return;

    const postureForNewOffspring = this.postureNumberForNewOffspring();

    this.router.navigate(['/birds/birds-add'], {
      queryParams: {
        mode: 'batch-add',
        fatherId: couple.maleId,
        motherId: couple.femaleId,
        season: couple.season,
        posture: postureForNewOffspring,
        coupleId: couple.id,
        returnTo: 'couple',
        registrationSource: 'breeding'
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

  // Volver a la lista de parejas
  goBack() {
    this.router.navigate(['/couples']);
  }

  // Navegar a editar
  async editCouple() {
    // Verificar permisos usando Observable
    const canEdit = await firstValueFrom(this.userLimitsService.canEditRecord('couple'));

    if (!canEdit) {
      this.toastService.warning('Plan Free: solo puedes ver las parejas. Actualiza a Premium para editar.');
      return;
    }

    const id = this.coupleId();
    if (id) {
      this.router.navigate(['/couples/couples-edit', id]);
    }
  }

  // Eliminar pareja con confirmación
  async deleteCouple() {
    // Verificar permisos usando Observable
    const canEdit = await firstValueFrom(this.userLimitsService.canEditRecord('couple'));

    if (!canEdit) {
      this.toastService.warning('Plan Free: solo puedes ver las parejas. Actualiza a Premium para eliminar.');
      return;
    }

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
          this.toastService.success('Pareja eliminada exitosamente');
          this.router.navigate(['/couples']);
        } catch (error) {
          this.toastService.error('Error al eliminar la pareja');
        }
      }
    );
  }

  // Mostrar toast cuando no se puede editar
  showEditNotAllowedToast() {
    this.toastService.warning('Plan Free: solo puedes ver las parejas. Actualiza a Premium para editar.');
  }

  // Mostrar toast cuando no se puede eliminar
  showDeleteNotAllowedToast() {
    this.toastService.warning('Plan Free: solo puedes ver las parejas. Actualiza a Premium para eliminar.');
  }

  // Migrar parejas existentes para asignar currentPostureNumber si no lo tienen
  private async migrateCurrentPostureNumber() {
    const currentCouple = this.couple();
    if (!currentCouple) return;

    // Si ya tiene currentPostureNumber, no hacer nada
    if (currentCouple.currentPostureNumber && currentCouple.currentPostureNumber > 0) return;

    const userEmail = this.authService.currentUserEmail();
    if (!userEmail) return;

    // Calcular el número basándose en los pichones existentes
    const details = this.coupleDetails();
    let maxPosture = 0;
    if (details?.offspring && details.offspring.length > 0) {
      details.offspring.forEach(bird => {
        if (bird.posture && bird.posture > maxPosture) {
          maxPosture = bird.posture;
        }
      });
    }

    const status = this.postureStatus();
    let postureNumber = 1;

    if (status === 'completed') {
      postureNumber = maxPosture + 1;
    } else if (status === 'started') {
      postureNumber = maxPosture > 0 ? maxPosture : 1;
    } else {
      postureNumber = maxPosture > 0 ? maxPosture + 1 : 1;
    }

    try {
      await this.couplesStore.updateCouple(currentCouple.id!, {
        userId: userEmail,
        currentPostureNumber: postureNumber,
        modificationDate: new Date()
      });
      console.log(`Migración completada: asignado currentPostureNumber = ${postureNumber}`);
    } catch (error) {
      console.error('Error en migración de currentPostureNumber:', error);
    }
  }

  // Forzar refresco completo de acordeones (usado cuando se agregan nuevos pichones)
  private forceRefreshAccordions() {
    console.log('🔄 Forzando refresco de acordeones...');

    // Forzar recálculo del computed y datos del store
    this.cdr.detectChanges();

    // Esperar un momento para que los datos se actualicen
    setTimeout(() => {
      const details = this.coupleDetails();
      const newCount = details?.offspring?.length || 0;
      console.log(`📊 Pichones detectados: ${newCount}`);

      // Actualizar contador de pichones
      this.offspringCount.set(newCount);

      const postureGroups = this.offspringByPosture();
      console.log('📋 Grupos de postura:', postureGroups);

      if (postureGroups.length > 0) {
        // Abrir automáticamente el acordeón más reciente
        const mostRecentPosture = postureGroups[0].postureNumber;
        console.log(`🎯 Abriendo acordeón más reciente: Postura #${mostRecentPosture}`);

        const newState: { [key: number]: boolean } = {};
        postureGroups.forEach((group) => {
          newState[group.postureNumber] = group.postureNumber === mostRecentPosture;
        });

        this.accordionStates.set(newState);
        console.log('✅ Acordeones actualizados');
      } else {
        console.log('⚠️ No se encontraron grupos de postura');
      }
    }, 100);
  }

  // Función para hacer pooling de cambios en los datos
  private pollForDataChanges() {
    console.log('🔍 Iniciando pooling para detectar cambios...');

    const currentDetails = this.coupleDetails();
    const currentCount = currentDetails?.offspring?.length || 0;

    let attempts = 0;
    const maxAttempts = 10;

    const poll = () => {
      attempts++;
      console.log(`🔍 Pooling intento ${attempts}/${maxAttempts}`);

      // Forzar recálculo
      this.cdr.detectChanges();

      const newDetails = this.coupleDetails();
      const newCount = newDetails?.offspring?.length || 0;

      if (newCount !== currentCount) {
        console.log(`✅ Cambio detectado: ${currentCount} -> ${newCount}`);
        this.forceRefreshAccordions();
        return;
      }

      if (attempts < maxAttempts) {
        setTimeout(poll, 200); // Intentar cada 200ms
      } else {
        console.log('⏰ Pooling terminado sin detectar cambios');
        // Forzar refresh de todas formas
        this.forceRefreshAccordions();
      }
    };

    setTimeout(poll, 100); // Empezar después de 100ms
  }

  // Obtener fechas de una postura específica
  getPostureDates(postureNumber: number) {
    const currentCouple = this.couple();
    if (!currentCouple) return { start: null, end: null };

    // Para la postura actual, siempre usar las fechas de la pareja
    // (independientemente de si currentPostureNumber coincide exactamente)
    const currentPostureNum = this.currentPostureNumber();

    if (postureNumber === currentPostureNum) {
      const dates = {
        start: this.convertFirestoreDate(currentCouple.postureStartDate),
        end: this.convertFirestoreDate(currentCouple.postureEndDate)
      };
      return dates;
    }

    // Para posturas anteriores, intentar obtener fechas de los pichones
    const details = this.coupleDetails();
    if (details?.offspring && details.offspring.length > 0) {
      const postureOffspring = details.offspring.filter(bird => bird.posture === postureNumber);

      if (postureOffspring.length > 0) {
        // Encontrar la fecha más temprana como inicio aproximado
        const dates = postureOffspring
          .map(bird => bird.creationDate)
          .filter(date => date !== null && date !== undefined)
          .sort((a, b) => a!.getTime() - b!.getTime());

        if (dates.length > 0) {
          return {
            start: dates[0],
            end: null // No sabemos la fecha de fin para posturas anteriores
          };
        }
      }
    }

    return { start: null, end: null };
  }

  // Verificar si una postura es la actual
  isCurrentPosture(postureNumber: number): boolean {
    const currentPostureNum = this.currentPostureNumber();
    return postureNumber === currentPostureNum;
  }

  // Obtener el estado de una postura específica
  getPostureStatus(postureNumber: number): 'not-started' | 'started' | 'completed' {
    const currentPostureNum = this.currentPostureNumber();

    // Solo la postura actual puede tener estado dinámico
    if (postureNumber === currentPostureNum) {
      return this.postureStatus();
    }

    // Posturas anteriores siempre están completadas
    return 'completed';
  }

  // Formatear fechas para mostrar en acordeones
  formatDateForDisplay(date: Date | null): string {
    if (!date) return 'Sin fecha';

    try {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  // Función de debug temporal - REMOVER después de pruebas
  debugPostureInfo(postureNumber: number) {
    const currentCouple = this.couple();
    const dates = this.getPostureDates(postureNumber);
    const currentPostureNum = this.currentPostureNumber();

    console.log(`Debug Postura ${postureNumber}:`, {
      postureNumber: postureNumber,
      currentPostureNumber: currentCouple?.currentPostureNumber,
      computedCurrentPostureNumber: currentPostureNum,
      isCurrentPosture: this.isCurrentPosture(postureNumber),
      comparison: `${postureNumber} === ${currentPostureNum}`,
      dates: dates,
      postureStartDate: currentCouple?.postureStartDate,
      postureEndDate: currentCouple?.postureEndDate
    });

    return '';
  }

}

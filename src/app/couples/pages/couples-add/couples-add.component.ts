import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { map, take, firstValueFrom } from 'rxjs';
import { CouplesStoreService } from '../../services/couples-store.service';
import { CouplesService } from '../../services/couples.service';
import { BirdsStoreService } from '../../../birds/services/birds-store.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { BirdsAutocompleteComponent } from '../../../shared/birds-autocomplete.component';
import { Birds } from '../../../birds/interface/birds.interface';
import { Couples } from '../../interface/couples.interface';

@Component({
  selector: 'app-couples-add',
  imports: [CommonModule, ReactiveFormsModule, BirdsAutocompleteComponent],
  templateUrl: './couples-add.component.html',
  styles: []
})
export class CouplesAddComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private couplesStore = inject(CouplesStoreService);
  private couplesService = inject(CouplesService);
  private birdsStore = inject(BirdsStoreService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  // Formulario reactivo
  coupleForm: FormGroup = this.fb.group({
    season: ['', Validators.required],
    nestCode: ['', Validators.required],
    maleId: ['', Validators.required],
    femaleId: ['', Validators.required],
    observations: ['']
  });

  // Signals para estado del componente
  selectedMale = signal<Birds | null>(null);
  selectedFemale = signal<Birds | null>(null);
  isSubmitting = signal(false);
  showNewBirdModal = signal(false);
  modalType = signal<'male' | 'female'>('male');

  // Signals para validaciones
  nestOccupiedWarning = signal(false);
  maleActiveWarning = signal(false);
  femaleActiveError = signal(false);

  // Sistema de caché para parejas (similar a birds-add)
  couplesDraft = signal<Omit<Couples, 'id'>[]>([]);

  // Computed para temporadas disponibles
  availableSeasons = computed(() => {
    const currentYear = new Date().getFullYear();
    return [
      currentYear.toString(),
      (currentYear + 1).toString(),
      (currentYear - 1).toString()
    ];
  });

  // Computed para machos disponibles (estado criadero + género macho o desconocido)
  availableMales = computed(() => {
    const birds = this.birdsStore.birdsList();
    return birds.filter(bird =>
      bird.state === 'criadero' &&
      (bird.gender === 'macho' || bird.gender === 'desconocido' || !bird.gender)
    );
  });

  // Computed para hembras disponibles (estado criadero + género hembra o desconocido)
  availableFemales = computed(() => {
    const birds = this.birdsStore.birdsList();
    return birds.filter(bird =>
      bird.state === 'criadero' &&
      (bird.gender === 'hembra' || bird.gender === 'desconocido' || !bird.gender)
    );
  });

  ngOnInit() {
    // Establecer temporada actual por defecto
    this.coupleForm.patchValue({
      season: new Date().getFullYear().toString()
    });

    // Escuchar cambios en nestCode para validar ocupación
    this.coupleForm.get('nestCode')?.valueChanges.subscribe(nestCode => {
      if (nestCode) {
        this.checkNestOccupied(nestCode);
      }
    });
  }

  // Función para mostrar información del ave en el autocomplete
  displayBirdFn = (bird: Birds): string => {
    if (!bird) return '';
    const ring = bird.ringNumber ? `N° ${bird.ringNumber}` : 'Sin anillo';
    const line = bird.line ? ` - ${bird.line}` : '';
    const gender = bird.gender ? ` (${bird.gender})` : '';
    return `${ring}${line}${gender}`;
  };

  // Seleccionar macho
  onMaleSelected(birdId: string) {
    const bird = this.availableMales().find(b => b.id === birdId);
    if (bird) {
      this.selectedMale.set(bird);
      this.coupleForm.patchValue({ maleId: birdId });
      // Marcar el campo como touched para activar validaciones
      this.coupleForm.get('maleId')?.markAsTouched();
      this.checkMaleActive(birdId);
    } else {
      // Si no se selecciona un ave válida, limpiar el campo
      this.selectedMale.set(null);
      this.coupleForm.patchValue({ maleId: '' });
      this.coupleForm.get('maleId')?.markAsTouched();
    }
  }

  // Seleccionar hembra
  onFemaleSelected(birdId: string) {
    const bird = this.availableFemales().find(b => b.id === birdId);
    if (bird) {
      this.selectedFemale.set(bird);
      this.coupleForm.patchValue({ femaleId: birdId });
      // Marcar el campo como touched para activar validaciones
      this.coupleForm.get('femaleId')?.markAsTouched();
      this.checkFemaleActive(birdId);
    } else {
      // Si no se selecciona un ave válida, limpiar el campo
      this.selectedFemale.set(null);
      this.coupleForm.patchValue({ femaleId: '' });
      this.coupleForm.get('femaleId')?.markAsTouched();
    }
  }

  // Manejar blur del campo macho
  onMaleBlur() {
    // Marcar el campo como touched para activar validaciones
    this.coupleForm.get('maleId')?.markAsTouched();
  }

  // Manejar blur del campo hembra
  onFemaleBlur() {
    // Marcar el campo como touched para activar validaciones
    this.coupleForm.get('femaleId')?.markAsTouched();
  }

  // Verificar si el nido está ocupado
  private async checkNestOccupied(nestCode: string) {
    const season = this.coupleForm.get('season')?.value;

    try {
      // Obtener usuario de manera asíncrona sin múltiples suscripciones
      const user = await firstValueFrom(this.authService.authState$.pipe(take(1)));

      if (season && user?.email) {
        // Obtener todas las parejas del usuario y filtrar localmente para evitar errores de índice
        const allCouples = await firstValueFrom(
          this.couplesService.getCouplesByUser(user.email)
        );

        // Filtrar localmente las parejas que ocupan el nido
        const nestOccupied = allCouples.some(couple =>
          couple.nestCode === nestCode &&
          couple.season === season
        );

        this.nestOccupiedWarning.set(nestOccupied);
      }
    } catch (error: any) {
      console.error('Error checking nest occupation:', error);
      // Si hay cualquier error, asumir que no está ocupado
      this.nestOccupiedWarning.set(false);
    }
  }
  // Verificar si el macho ya está activo
  private async checkMaleActive(maleId: string) {
    try {
      const user = await firstValueFrom(this.authService.authState$.pipe(take(1)));

      if (user?.email) {
        // Obtener todas las parejas del usuario y filtrar localmente para evitar errores de índice
        const allCouples = await firstValueFrom(
          this.couplesService.getCouplesByUser(user.email)
        );

        // Filtrar localmente las parejas activas del macho
        const activeCouples = allCouples.filter(couple =>
          couple.maleId === maleId &&
          couple.posture &&
          !couple.postureEndDate
        );

        this.maleActiveWarning.set(activeCouples.length > 0);
      }
    } catch (error: any) {
      console.error('Error checking male active status:', error);
      // Si hay cualquier error, asumir que no está activo
      this.maleActiveWarning.set(false);
    }
  }

  // Verificar si la hembra ya está activa
  private async checkFemaleActive(femaleId: string) {
    try {
      const user = await firstValueFrom(this.authService.authState$.pipe(take(1)));

      if (user?.email) {
        // Obtener todas las parejas del usuario y filtrar localmente para evitar errores de índice
        const allCouples = await firstValueFrom(
          this.couplesService.getCouplesByUser(user.email)
        );

        // Filtrar localmente las parejas activas de la hembra
        const activeCouples = allCouples.filter(couple =>
          couple.femaleId === femaleId &&
          couple.posture &&
          !couple.postureEndDate
        );

        this.femaleActiveError.set(activeCouples.length > 0);
      }
    } catch (error: any) {
      console.error('Error checking female active status:', error);
      // Si hay cualquier error, asumir que no está activa
      this.femaleActiveError.set(false);
    }
  }

  // Abrir modal para agregar nuevo canario
  openNewBirdModal(type: 'male' | 'female') {
    this.modalType.set(type);
    this.showNewBirdModal.set(true);
  }

  // Cerrar modal
  closeNewBirdModal() {
    this.showNewBirdModal.set(false);
  }

  // Redirigir a formulario de nuevo canario
  redirectToNewBird() {
    this.router.navigate(['/birds/birds-create']);
  }

  // Enviar formulario
  async onSubmit() {
    if (this.coupleForm.invalid) {
      this.coupleForm.markAllAsTouched();
      this.toastService.warning('Por favor, completa todos los campos requeridos');
      return;
    }

    // No permitir crear si la hembra ya está activa
    if (this.femaleActiveError()) {
      this.toastService.error('No se puede crear la pareja. La hembra seleccionada ya está activa en otra pareja.');
      return;
    }

    this.isSubmitting.set(true);

    try {
      // Obtener usuario actual de manera asíncrona
      const user = await firstValueFrom(
        this.authService.authState$.pipe(
          map(user => user),
          take(1)
        )
      );

      if (!user?.email) {
        this.toastService.error('Usuario no autenticado. Por favor, inicie sesión nuevamente.');
        this.router.navigate(['/auth/sign-in']);
        return;
      }

      const formData = this.coupleForm.value;

      // Validar pareja antes de crear
      const validation = await this.couplesService.validateNewCouple(
        user.email,
        formData.maleId,
        formData.femaleId,
        formData.nestCode,
        formData.season
      );

      if (!validation.isValid) {
        validation.conflicts.forEach(conflict => {
          this.toastService.error(conflict);
        });
        return;
      }

      // Mostrar advertencias si las hay
      validation.warnings.forEach(warning => {
        this.toastService.warning(warning);
      });

      const newCouple: Omit<Couples, 'id'> = {
        userId: user.email,
        season: formData.season,
        nestCode: formData.nestCode,
        maleId: formData.maleId,
        femaleId: formData.femaleId,
        creationDate: new Date(),
        modificationDate: new Date()
      };

      // Solo agregar observations si tiene valor
      if (formData.observations && formData.observations.trim()) {
        newCouple.observations = formData.observations.trim();
      }

      await this.couplesStore.createCouple(newCouple);

      // No mostrar toast aquí porque el store ya lo hace
      // Navegar de vuelta a la lista
      this.router.navigate(['/couples']);

    } catch (error) {
      console.error('Error creating couple:', error);
      // No mostrar toast aquí porque el store ya lo hace
    } finally {
      this.isSubmitting.set(false);
    }
  }

  // Agregar pareja al borrador en lugar de guardar inmediatamente
  async addToDraft() {
    if (this.coupleForm.invalid) {
      this.coupleForm.markAllAsTouched();
      this.toastService.warning('Por favor, completa todos los campos requeridos');
      return;
    }

    // No permitir agregar si la hembra ya está activa
    if (this.femaleActiveError()) {
      this.toastService.error('No se puede agregar la pareja. La hembra seleccionada ya está activa en otra pareja.');
      return;
    }

    try {
      // Obtener usuario actual
      const user = await firstValueFrom(
        this.authService.authState$.pipe(
          map(user => user),
          take(1)
        )
      );

      if (!user?.email) {
        this.toastService.error('Usuario no autenticado. Por favor, inicie sesión nuevamente.');
        this.router.navigate(['/auth/sign-in']);
        return;
      }

      const formData = this.coupleForm.value;

      // Validar pareja antes de agregar al borrador
      const validation = await this.couplesService.validateNewCouple(
        user.email,
        formData.maleId,
        formData.femaleId,
        formData.nestCode,
        formData.season
      );

      if (!validation.isValid) {
        validation.conflicts.forEach(conflict => {
          this.toastService.error(conflict);
        });
        return;
      }

      // Mostrar advertencias si las hay
      validation.warnings.forEach(warning => {
        this.toastService.warning(warning);
      });

      // Verificar que no esté duplicado en el borrador actual
      const existsInDraft = this.couplesDraft().some(couple =>
        couple.maleId === formData.maleId &&
        couple.femaleId === formData.femaleId &&
        couple.season === formData.season
      );

      if (existsInDraft) {
        this.toastService.error('Esta pareja ya está en el borrador');
        return;
      }

      const newCouple: Omit<Couples, 'id'> = {
        userId: user.email,
        season: formData.season,
        nestCode: formData.nestCode,
        maleId: formData.maleId,
        femaleId: formData.femaleId,
        creationDate: new Date(),
        modificationDate: new Date()
      };

      // Solo agregar observations si tiene valor
      if (formData.observations && formData.observations.trim()) {
        newCouple.observations = formData.observations.trim();
      }

      // Agregar al borrador
      this.couplesDraft.update(list => [...list, newCouple]);

      // Limpiar formulario para siguiente pareja
      this.resetForm();

      this.toastService.success(`Pareja agregada a la lista. Total: ${this.couplesDraft().length}`);

    } catch (error) {
      console.error('Error adding couple to draft:', error);
      this.toastService.error('Error al agregar la pareja a la lista. Por favor, inténtelo de nuevo.');
    }
  }

  // Guardar todas las parejas de la lista
  async saveAllDraft() {
    if (this.couplesDraft().length === 0) {
      this.toastService.warning('No hay parejas en la lista para guardar');
      return;
    }

    this.isSubmitting.set(true);

    try {
      await this.couplesStore.createCouplesBatch(this.couplesDraft());

      // Limpiar lista
      this.couplesDraft.set([]);

      // Navegar de vuelta a la lista
      this.router.navigate(['/couples']);

    } catch (error) {
      console.error('Error saving couples batch:', error);
      // El store ya maneja el toast de error
    } finally {
      this.isSubmitting.set(false);
    }
  }

  // Eliminar pareja de la lista
  removeFromDraft(index: number) {
    this.couplesDraft.update(list => list.filter((_, i) => i !== index));
    this.toastService.success('Pareja eliminada de la lista');
  }
  // Eliminar pareja de la lista con confirmación
  confirmRemoveFromDraft(index: number) {
    const couple = this.couplesDraft()[index];
    const displayInfo = this.getCoupleDisplayInfo(couple);

    this.toastService.confirm(
      `Nido: ${couple.nestCode} - Macho: ${displayInfo.male.ring} | Hembra: ${displayInfo.female.ring}`,
      () => this.removeFromDraft(index),
      undefined,
      '¿Eliminar pareja de la lista?'
    );
  }

  // Limpiar todo el borrador
  clearDraft() {
    this.couplesDraft.set([]);
  }

  // Resetear formulario
  resetForm() {
    this.coupleForm.reset();
    // Restablecer valores por defecto
    this.coupleForm.patchValue({
      season: new Date().getFullYear().toString()
    });

    // Limpiar selections
    this.selectedMale.set(null);
    this.selectedFemale.set(null);

    // Limpiar validaciones
    this.nestOccupiedWarning.set(false);
    this.maleActiveWarning.set(false);
    this.femaleActiveError.set(false);
  }

  // Volver atrás
  goBack() {
    this.router.navigate(['/couples']);
  }

  // Obtener información para mostrar en la lista
  getCoupleDisplayInfo(couple: Omit<Couples, 'id'>) {
    const allBirds = this.birdsStore.birdsList();
    const maleBird = allBirds.find((b: Birds) => b.id === couple.maleId);
    const femaleBird = allBirds.find((b: Birds) => b.id === couple.femaleId);

    return {
      male: {
        ring: maleBird ? `N° ${maleBird.ringNumber}` : 'Sin anillo',
        gender: '♂'
      },
      female: {
        ring: femaleBird ? `N° ${femaleBird.ringNumber}` : 'Sin anillo',
        gender: '♀'
      }
    };
  }
}

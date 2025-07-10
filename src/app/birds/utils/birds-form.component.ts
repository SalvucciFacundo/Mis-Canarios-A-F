import { Component, computed, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BirdsStoreService } from '../services/birds-store.service';
import { CommonModule } from '@angular/common';
import { Birds } from '../interface/birds.interface';
import { BirdsAutocompleteComponent } from '../../shared/birds-autocomplete.component';
import { LineaAutocompleteComponent } from '../../shared/linea-autocomplete.component';
import { LoadingService } from '../../shared/services/loading.service';
import { getFieldError } from './field-error.util';

@Component({
  selector: 'app-birds-form',
  imports: [ReactiveFormsModule, CommonModule, BirdsAutocompleteComponent, LineaAutocompleteComponent],
  templateUrl: './birds-form.component.html',
  styleUrl: './birds-form.component.css'
})
export class BirdsFormComponent implements OnInit, OnChanges {

  @Input() initialData: any | null = null;
  @Input() preloadedData: Partial<Birds> | null = null;
  @Output() submitted = new EventEmitter<any>();
  @Output() cancelled = new EventEmitter<void>();

  birdForm: FormGroup;
  private loadingService = inject(LoadingService);

  constructor(private fb: FormBuilder, private store: BirdsStoreService, private router: Router) {
    this.birdForm = this.fb.group({
      origin: ['', Validators.required], // Procedencia del canario (apellido del vendedor, criador, etc.) - requerido
      season: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
      ringColor: ['color', [Validators.required, Validators.pattern(/^(?!color$).+/)]],
      ringNumber: ['', Validators.pattern(/^\d{1,4}$/)],
      gender: ['genero', [Validators.required, Validators.pattern(/^(?!genero$).+/)]],
      line: [''],
      state: ['criadero', [Validators.required, Validators.pattern(/^(?!seleccione$).+/)]],
      stateObservation: [''],
      father: [''],
      mother: [''],
      posture: ['', Validators.pattern(/^\d{1,4}$/)],
      observations: [''],
    });
  }
  limitarLongitud(event: Event, max: number) {
    const input = event.target as HTMLInputElement;
    if (input.value.length > max) {
      input.value = input.value.slice(0, max);
    }
    // sincroniza con el formControl correspondiente
    const control = this.birdForm.get(input.getAttribute('formControlName') || '');
    control?.setValue(input.value);
  }

  ngOnInit() {
    this.loadInitialData();
    this.loadPreloadedData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialData'] && changes['initialData'].currentValue) {
      this.loadInitialData();
    }
    if (changes['preloadedData'] && changes['preloadedData'].currentValue) {
      this.loadPreloadedData();
    }
  }

  private loadInitialData() {
    if (this.initialData) {
      this.birdForm.patchValue(this.initialData);

      // Forzar la detección de cambios para los componentes de autocompletar
      setTimeout(() => {
        if (this.initialData.line) {
          this.birdForm.get('line')?.setValue(this.initialData.line);
        }
        // Forzar actualización para padre y madre
        if (this.initialData.father) {
          this.birdForm.get('father')?.setValue(this.initialData.father);
        }
        if (this.initialData.mother) {
          this.birdForm.get('mother')?.setValue(this.initialData.mother);
        }
      }, 100);
    }
  }

  private loadPreloadedData() {
    if (this.preloadedData) {
      console.log('Cargando datos pre-cargados:', this.preloadedData);

      // Solo cargar los campos que tienen valor
      const preloadedFields: any = {};

      if (this.preloadedData.father) preloadedFields.father = this.preloadedData.father;
      if (this.preloadedData.mother) preloadedFields.mother = this.preloadedData.mother;
      if (this.preloadedData.season) preloadedFields.season = this.preloadedData.season.toString();
      if (this.preloadedData.posture) preloadedFields.posture = this.preloadedData.posture.toString();

      this.birdForm.patchValue(preloadedFields);
    }
  }

  onSubmit() {
    if (this.birdForm.valid) {
      const formData = {
        ...this.birdForm.value,
        registrationSource: 'manual' as const // Siempre 'manual' cuando se usa el formulario directamente
      };
      this.submitted.emit(formData);
    }
  }

  onCancel() {
    this.cancelled.emit();
  }
  availableMales = computed(() =>
    this.store.birdsList().filter(b =>
      (b.gender === 'macho' || b.gender === 'desconocido') &&
      b.state !== 'muerto' &&
      b.state !== 'vendido'
    )
  );

  availableFemales = computed(() =>
    this.store.birdsList().filter(b =>
      (b.gender === 'hembra' || b.gender === 'desconocido') &&
      b.state !== 'muerto' &&
      b.state !== 'vendido'
    )
  );


  formatBird(bird: Birds): string {
    return `N° anillo: ${bird.ringNumber} · Temporada: ${bird.season} · Género: ${bird.gender} · Línea: ${bird.line}`;
  }

  // Función para mostrar información del ave en el autocomplete
  displayBirdFn = (bird: Birds): string => {
    if (!bird) return '';
    const ring = bird.ringNumber ? `N° ${bird.ringNumber}` : 'Sin anillo';
    const line = bird.line ? ` - ${bird.line}` : '';
    const gender = bird.gender ? ` (${bird.gender})` : '';
    return `${ring}${line}${gender}`;
  };

  // Seleccionar padre
  onFatherSelected(birdId: string) {
    this.birdForm.patchValue({ father: birdId });
    this.birdForm.get('father')?.markAsTouched();
  }

  // Seleccionar madre
  onMotherSelected(birdId: string) {
    this.birdForm.patchValue({ mother: birdId });
    this.birdForm.get('mother')?.markAsTouched();
  }

  // Manejar blur del campo padre
  onFatherBlur() {
    this.birdForm.get('father')?.markAsTouched();
  }

  // Manejar blur del campo madre
  onMotherBlur() {
    this.birdForm.get('mother')?.markAsTouched();
  }

  // Seleccionar línea
  onLineSelected(linea: any) {
    this.birdForm.patchValue({ line: linea.name || linea });
  }

  getFormErrors(): { field: string; error: string }[] {
    const errors: { field: string; error: string }[] = [];
    Object.keys(this.birdForm.controls).forEach(key => {
      const control = this.birdForm.get(key);
      if (control && control.invalid) {
        const controlErrors = control.errors;
        if (controlErrors) {
          Object.keys(controlErrors).forEach(errorKey => {
            let errorMessage = '';
            let fieldName = this.getFieldDisplayName(key);

            if (errorKey === 'required') {
              errorMessage = `${fieldName} es obligatorio`;
            } else if (errorKey === 'pattern') {
              switch (key) {
                case 'season':
                  errorMessage = 'Debe ingresar el año completo (4 dígitos, ej: 2024)';
                  break;
                case 'ringNumber':
                  errorMessage = 'Solo se permiten números de hasta 4 dígitos';
                  break;
                case 'posture':
                  errorMessage = 'Solo se permiten números de hasta 4 dígitos';
                  break;
                case 'ringColor':
                  errorMessage = 'Debe seleccionar un color de anillo válido';
                  break;
                case 'gender':
                  errorMessage = 'Debe seleccionar un género válido';
                  break;
                case 'state':
                  errorMessage = 'Debe seleccionar un estado válido';
                  break;
                default:
                  errorMessage = `${fieldName} tiene formato inválido`;
              }
            } else {
              errorMessage = `${fieldName}: Error ${errorKey}`;
            }
            errors.push({ field: fieldName, error: errorMessage });
          });
        }
      }
    });
    return errors;
  }

  private getFieldDisplayName(fieldKey: string): string {
    const fieldNames: { [key: string]: string } = {
      'origin': 'Procedencia',
      'season': 'Temporada',
      'ringColor': 'Color de anillo',
      'ringNumber': 'Número de anillo',
      'gender': 'Género',
      'line': 'Línea',
      'state': 'Estado',
      'stateObservation': 'Observación del estado',
      'father': 'Padre',
      'mother': 'Madre',
      'posture': 'Número de postura',
      'observations': 'Observaciones'
    };
    return fieldNames[fieldKey] || fieldKey;
  }

  // Obtener datos del padre seleccionado
  getSelectedFather(): Birds | null {
    const fatherId = this.birdForm.get('father')?.value;
    if (!fatherId) return null;
    return this.availableMales().find(bird => bird.id === fatherId) || null;
  }

  // Obtener datos de la madre seleccionada
  getSelectedMother(): Birds | null {
    const motherId = this.birdForm.get('mother')?.value;
    if (!motherId) return null;
    return this.availableFemales().find(bird => bird.id === motherId) || null;
  }

  // Método público para resetear solo los campos no esenciales
  resetFormPartial() {
    console.log('Reseteando formulario parcialmente...');
    // Resetear solo los campos no esenciales, manteniendo padre, madre, temporada y postura
    this.birdForm.patchValue({
      origin: '',
      ringColor: 'color',
      ringNumber: '',
      gender: 'genero',
      line: '',
      state: 'seleccione',
      stateObservation: '',
      observations: ''
    });

    // Marcar como intocado para limpiar errores de validación
    this.birdForm.get('origin')?.markAsUntouched();
    this.birdForm.get('ringColor')?.markAsUntouched();
    this.birdForm.get('ringNumber')?.markAsUntouched();
    this.birdForm.get('gender')?.markAsUntouched();
    this.birdForm.get('line')?.markAsUntouched();
    this.birdForm.get('state')?.markAsUntouched();
    this.birdForm.get('stateObservation')?.markAsUntouched();
    this.birdForm.get('observations')?.markAsUntouched();
  }

  getFieldError = getFieldError;

}

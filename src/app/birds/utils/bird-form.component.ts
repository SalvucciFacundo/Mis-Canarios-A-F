import { Component, computed, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BirdsStoreService } from '../services/birds-store.service';
import { CommonModule } from '@angular/common';
import { Birds } from '../interface/birds.interface';
import { BirdsAutocompleteComponent } from '../../shared/birds-autocomplete.component';
import { LineaAutocompleteComponent } from '../../shared/linea-autocomplete.component';

@Component({
  selector: 'app-bird-form',
  imports: [ReactiveFormsModule, CommonModule, BirdsAutocompleteComponent, LineaAutocompleteComponent],
  templateUrl: './bird-form.component.html',
  styleUrl: './bird-form.component.css'
})
export class BirdFormComponent implements OnChanges {

  @Input() initialData: any | null = null;
  @Output() submitted = new EventEmitter<any>();
  @Output() cancelled = new EventEmitter<void>();

  birdForm: FormGroup;
  constructor(private fb: FormBuilder, private store: BirdsStoreService, private router: Router) {
    this.birdForm = this.fb.group({
      origin: [''],
      season: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
      ringColor: ['color', [Validators.required, Validators.pattern(/^(?!color$).+/)]],
      ringNumber: ['', Validators.pattern(/^\d{1,4}$/)],
      gender: ['genero', [Validators.required, Validators.pattern(/^(?!genero$).+/)]],
      line: [''],
      state: ['seleccione', [Validators.required, Validators.pattern(/^(?!seleccione$).+/)]],
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
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialData'] && changes['initialData'].currentValue) {
      this.loadInitialData();
    }
  }

  private loadInitialData() {
    if (this.initialData) {
      console.log('Cargando datos iniciales:', this.initialData);
      this.birdForm.patchValue(this.initialData);

      // Forzar la detección de cambios para el componente de autocompletar
      setTimeout(() => {
        if (this.initialData.line) {
          this.birdForm.get('line')?.setValue(this.initialData.line);
        }
      }, 100);
    }
  }

  onSubmit() {
    if (this.birdForm.valid) {
      this.submitted.emit(this.birdForm.value);
    }
  }

  onCancel() {
    this.cancelled.emit();
    this.router.navigate(['/birds']);
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

}

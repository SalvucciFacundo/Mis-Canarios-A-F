import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, inject, Input, OnChanges, OnInit, Output, signal, SimpleChanges } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Nomenclator } from '../nomenclator/interface/nomenclator.interface';
import { NomenclatorService } from '../nomenclator/services/nomenclator.service';

@Component({
  selector: 'app-linea-autocomplete',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './linea-autocomplete.component.html',
})
export class LineaAutocompleteComponent implements OnInit, OnChanges {
  @Input() initialValue: string | null = null;
  @Output() selected = new EventEmitter<string>();
  showOptions = signal(false);

  private nomenclatorService = inject(NomenclatorService);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    federacion: this.fb.nonNullable.control<'FOCI' | 'FAC' | 'FOA'>('FOCI'),
    search: ''
  });

  // Señales para manejo de estado
  federacionSeleccionada = signal<'FOCI' | 'FAC' | 'FOA'>('FOCI');
  searchTerm = signal('');

  lineas: Nomenclator[] = [];

  lineasFiltradas = computed(() => {
    // Ordenar por código ascendente, partiendo desde el código base de cada federación
    const getSortBase = () => {
      if (this.federacionSeleccionada() === 'FOCI') return 'D001';
      if (this.federacionSeleccionada() === 'FOA') return 'D.001';
      if (this.federacionSeleccionada() === 'FAC') return 'CO001';
      return '';
    };
    const sortBase = getSortBase();
    const sortByCodigo = (a: Nomenclator, b: Nomenclator) => {
      const codeA = (a.code ?? a.codigo ?? '');
      const codeB = (b.code ?? b.codigo ?? '');
      // Si ambos empiezan por el código base, comparar normalmente
      if (codeA.startsWith(sortBase[0]) && codeB.startsWith(sortBase[0])) {
        return codeA.localeCompare(codeB);
      }
      // El que empieza por el código base va primero
      if (codeA.startsWith(sortBase[0])) return -1;
      if (codeB.startsWith(sortBase[0])) return 1;
      return codeA.localeCompare(codeB);
    };
    const term = this.searchTerm()?.trim().toLowerCase() ?? '';
    let lineasFiltradas = this.lineas;
    if (!term) return lineasFiltradas.slice().sort(sortByCodigo);
    return lineasFiltradas.filter(l => {
      const code = (l.code ?? l.codigo ?? '').toLowerCase();
      const name = (l.name ?? l.nombre ?? '').toLowerCase();
      return code.includes(term) || name.includes(term);
    }).sort(sortByCodigo);
  });

  async ngOnInit() {
    await this.loadLineasByFederacion(this.federacionSeleccionada());

    // Suscribirse a cambios en el formulario
    this.form.get('search')!.valueChanges.subscribe(value => {
      this.searchTerm.set(value || '');
      this.showOptions.set(true);
    });

    this.form.get('federacion')!.valueChanges.subscribe(async value => {
      this.federacionSeleccionada.set(value);
      await this.loadLineasByFederacion(value);
      this.form.get('search')?.setValue(''); // Reiniciar input al cambiar federación
    });

    // Cargar valor inicial si existe
    this.loadInitialValue();
  }

  private loadInitialValue() {
    if (this.initialValue) {
      this.form.get('search')?.setValue(this.initialValue);
    }
  }

  async loadLineasByFederacion(federacion: 'FOCI' | 'FAC' | 'FOA') {
    this.lineas = [];
    // Forzar refresco inmediato del autocompletado
    await Promise.resolve();
    this.lineas = await this.nomenclatorService.getLineasByFederacionFromAssets(federacion);
  }

  seleccionarLinea(linea: Nomenclator) {
    // Mostrar solo el nombre en el input
    this.form.get('search')?.setValue(linea.name ?? linea.nombre ?? '');
    this.selected.emit(linea.name ?? linea.nombre ?? '');
    this.showOptions.set(false); // 👈 cerrar el listado
  }

  onFederacionChange(event: Event, fed: string) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.form.get('federacion')?.setValue(fed as 'FOCI' | 'FAC' | 'FOA');
    }
  }

  cerrarConDelay() {
    setTimeout(() => this.showOptions.set(false), 200);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialValue'] && this.lineas.length > 0) {
      this.loadInitialValue();
    }
  }
}

import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, inject, Input, OnChanges, OnInit, Output, signal, SimpleChanges } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Nomenclator } from '../nomenclator/interface/nomenclator.interface';
import { NomenclatorStoreService } from '../nomenclator/services/nomenclator-store.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-linea-autocomplete',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './linea-autocomplete.component.html',
})
export class LineaAutocompleteComponent implements OnInit, OnChanges {
  @Input() initialValue: string | null = null;
  @Output() selected = new EventEmitter<Nomenclator>();
  showOptions = signal(false);

  private store = inject(NomenclatorStoreService);
  private fb = inject(FormBuilder);


  form = this.fb.group({
    federacion: this.fb.nonNullable.control<'FOCI' | 'FAC' | 'FOA'>('FOCI'),
    search: ''
  });



  federacionSeleccionada = toSignal(this.form.get('federacion')!.valueChanges, {
    initialValue: 'FOCI'
  });



  searchTerm = toSignal(this.form.get('search')!.valueChanges, {
    initialValue: ''
  });


  lineasFiltradas = computed(() =>
    this.store.searchByCodigoONombre(
      this.searchTerm()?.trim() ?? '',
      [this.federacionSeleccionada()] // 👈 pasa como array
    )
  );

  async ngOnInit() {
    await this.store.loadAllOnce(); // ⏳ esperá que termine
    this.form.get('search')!.valueChanges.subscribe(() => {
      this.showOptions.set(true);
    });

    // Cargar valor inicial si existe
    this.loadInitialValue();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialValue'] && this.store.lineas().length > 0) {
      this.loadInitialValue();
    }
  }

  private loadInitialValue() {
    if (this.initialValue) {
      this.form.get('search')?.setValue(this.initialValue);
    }
  }

  seleccionarLinea(linea: Nomenclator) {
    this.selected.emit(linea);
    this.form.get('search')?.setValue(linea.name ?? '');
    this.showOptions.set(false); // 👈 cerrar el listado

  }

  onFederacionChange(event: Event, fed: string) {
    const checkbox = event.target as HTMLInputElement;
    // Since federacionSeleccionada is a string, just set the value directly
    if (checkbox.checked) {
      this.form.get('federacion')?.setValue(fed as 'FOCI' | 'FAC' | 'FOA');
    }
  }

  cerrarConDelay() {
    setTimeout(() => this.showOptions.set(false), 200);
  }



}

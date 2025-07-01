import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, Input, Output, signal } from '@angular/core';

@Component({
  selector: 'app-birds-autocomplete',
  imports: [CommonModule],
  templateUrl: './birds-autocomplete.component.html',

})
export class BirdsAutocompleteComponent {
  @Input() items: any[] = [];
  @Input() label = 'Seleccionar';
  @Input() valueKey = 'id';
  @Input() displayFn: (item: any) => string = (item) => item?.[this.valueKey] ?? '';
  @Input() hasError = false; // Nuevos input para manejar el estado de error
  @Output() selectedChange = new EventEmitter<string>();
  @Output() blurChange = new EventEmitter<void>(); // Nuevo evento para manejar blur

  input = signal('');
  showOptions = signal(false);
  selected = signal<string | null>(null);
  lastValidSelection = signal<string>(''); // Guardar la última selección válida

  // filteredItems = computed(() =>
  //   this.items.filter((item) =>
  //     this.displayFn(item).toLowerCase().includes(this.input().toLowerCase())
  //   )
  // );
  filteredItems = computed(() => {
    const search = this.input().toLowerCase().trim();
    return this.items.filter((item) => {
      const ring = item.ringNumber?.toString().toLowerCase() ?? '';
      const line = item.line?.toLowerCase() ?? '';
      return ring.includes(search) || line.includes(search);
    });
  });



  onInput(event: Event) {
    const target = event.target as HTMLInputElement | null;
    const value = target?.value ?? '';
    this.input.set(value);
    this.showOptions.set(true);
  }




  onSelect(item: any) {
    this.selected.set(item[this.valueKey]);
    this.input.set(this.displayFn(item));
    this.lastValidSelection.set(this.displayFn(item));
    this.showOptions.set(false);
    this.selectedChange.emit(item[this.valueKey]);
  }

  hide() {
    setTimeout(() => {
      this.showOptions.set(false);

      // Verificar si el texto actual corresponde a una selección válida
      const currentInput = this.input().trim();
      const isValidSelection = this.items.some(item =>
        this.displayFn(item) === currentInput
      );

      if (!isValidSelection && currentInput !== '') {
        // Si el texto no corresponde a una selección válida, emitir evento de blur
        this.selectedChange.emit('');
      }

      // Emitir evento de blur para que el componente padre pueda manejar validaciones
      this.blurChange.emit();
    }, 150);
  }

}

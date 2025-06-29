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
  @Output() selectedChange = new EventEmitter<string>();

  input = signal('');
  showOptions = signal(false);
  selected = signal<string | null>(null);

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
    this.showOptions.set(false);
    this.selectedChange.emit(item[this.valueKey]);
  }

  hide() {
    setTimeout(() => this.showOptions.set(false), 150);
  }

}

import { CommonModule, NgClass } from '@angular/common';
import { Component, computed, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NomenclatorStoreService } from '../../services/nomenclator-store.service';

@Component({
  selector: 'app-nomenclator-list',
  templateUrl: './nomenclator-list.component.html',
  styleUrl: './nomenclator-list.component.css',
  standalone: true,
  imports: [CommonModule, FormsModule, NgClass]
})
export class NomenclatorListComponent implements OnInit {
  federacionSeleccionada = signal<'FOCI' | 'FAC' | 'FOA'>('FOCI');
  searchTerm = signal('');
  page = signal(1);
  pageSize = 4;

  lineasFiltradas = computed(() =>
    this.store.searchByCodigoONombre(
      this.searchTerm(),
      [this.federacionSeleccionada()]
    )
  );

  paginatedLineas = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.lineasFiltradas().slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.lineasFiltradas().length / this.pageSize));
  pagesArray = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  getPaginatorPages = computed(() => {
    const total = this.totalPages();
    const current = this.page();
    const maxVisible = 5;
    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;
    if (end > total) {
      end = total;
      start = Math.max(1, end - maxVisible + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  constructor(public store: NomenclatorStoreService) { }

  async ngOnInit() {
    await this.store.loadAllOnce();
  }

  clearSearchTerm() {
    this.searchTerm.set('');
    this.page.set(1);
  }

  setFederacionSeleccionada(fed: 'FOCI' | 'FAC' | 'FOA') {
    this.federacionSeleccionada.set(fed);
    this.page.set(1);
  }

  goToPage(page: number) {
    this.page.set(page);
  }
  goToPrevPage() {
    if (this.page() > 1) this.page.set(this.page() - 1);
  }
  goToNextPage() {
    if (this.page() < this.totalPages()) this.page.set(this.page() + 1);
  }
}

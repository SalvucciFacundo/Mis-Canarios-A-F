import { CommonModule, NgClass } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Nomenclator } from '../../../nomenclator/interface/nomenclator.interface';
import { NomenclatorStoreService } from '../../../nomenclator/services/nomenclator-store.service';
import { ToastService } from '../../../shared/services/toast.service';

/**
 * Lista de nomencladores para administración.
 */
@Component({
  selector: 'app-admin-nomenclator-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NgClass],
  templateUrl: './admin-nomenclator-list.component.html',
  styleUrls: ['./admin-nomenclator-list.component.css']
})
export class AdminNomenclatorListComponent implements OnInit {
  federacionSeleccionada = signal<'FOCI' | 'FAC' | 'FOA'>('FOCI');
  searchTerm = signal('');
  page = signal(1);
  pageSize = 4;
  showModal = signal(false);
  modalEditLinea = signal<null | Nomenclator>(null); // null = agregar, objeto = editar
  modalLinea: Nomenclator = { code: '', name: '', federation: 'FOCI' };
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  lineasFiltradas = computed(() =>
    this.nomenclatorStore.searchByCodigoONombre(
      this.searchTerm(),
      [this.federacionSeleccionada()]
    )
  );

  paginatedLineas = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.lineasFiltradas().slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.lineasFiltradas().length / this.pageSize));
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

  constructor(public nomenclatorStore: NomenclatorStoreService, private toast: ToastService) { }

  async ngOnInit() {
    this.loading.set(true);
    try {
      await this.nomenclatorStore.loadAllOnce();
    } catch {
      this.error.set('Error al cargar nomencladores');
    } finally {
      this.loading.set(false);
    }
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

  openAddModal() {
    this.modalEditLinea.set(null);
    this.modalLinea = { code: '', name: '', federation: 'FOCI' };
    this.showModal.set(true);
  }

  onEdit(linea: Nomenclator) {
    this.modalEditLinea.set(linea);
    this.modalLinea = { ...linea };
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  // Métodos públicos en el store para CRUD en Firestore
  async addLineaFirestore(linea: Nomenclator) {
    const { id } = await this.nomenclatorStore['service'].create(linea as any);
    this.nomenclatorStore.add({ ...linea, id });
  }
  async updateLineaFirestore(id: string, changes: Partial<Nomenclator>) {
    await this.nomenclatorStore['service'].update(id, changes);
    this.nomenclatorStore.update(id, changes);
  }
  async deleteLineaFirestore(id: string) {
    await this.nomenclatorStore['service'].delete(id);
    this.nomenclatorStore.remove(id);
  }

  async submitModal() {
    const linea = { ...this.modalLinea };
    if (!linea.code || !linea.name || !linea.federation) {
      this.toast.error('Todos los campos son obligatorios');
      return;
    }
    try {
      if (this.modalEditLinea()) {
        await this.updateLineaFirestore(this.modalEditLinea()!.id!, linea);
        this.toast.success('Línea actualizada correctamente');
      } else {
        await this.addLineaFirestore(linea);
        this.toast.success('Línea agregada correctamente');
      }
      this.closeModal();
    } catch (e: any) {
      this.toast.error(e.message || 'Error al guardar la línea');
    }
  }

  async onDelete(linea: Nomenclator) {
    if (!confirm('¿Seguro que deseas eliminar la línea ' + linea.name + '?')) return;
    try {
      await this.deleteLineaFirestore(linea.id!);
      this.toast.success('Línea eliminada correctamente');
      // Notificación nativa del navegador (opcional, solo si el usuario lo permite)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Línea eliminada', { body: `Se eliminó: ${linea.name}` });
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Línea eliminada', { body: `Se eliminó: ${linea.name}` });
          }
        });
      }
    } catch (e: any) {
      this.toast.error(e.message || 'Error al eliminar la línea');
    }
  }
}

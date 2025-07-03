import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NomenclatorStoreService } from '../../../nomenclator/services/nomenclator-store.service';
import { Nomenclator } from '../../../nomenclator/interface/nomenclator.interface';

/**
 * Lista de nomencladores para administración.
 */
@Component({
  selector: 'app-admin-nomenclator-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-nomenclator-list.component.html',
  styleUrls: ['./admin-nomenclator-list.component.css']
})
export class AdminNomenclatorListComponent implements OnInit {
  nomenclators = signal<Nomenclator[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor(private nomenclatorStore: NomenclatorStoreService) { }

  async ngOnInit() {
    this.loading.set(true);
    try {
      await this.nomenclatorStore.loadAllOnce();
      this.nomenclators.set(this.nomenclatorStore.lineas());
    } catch {
      this.error.set('Error al cargar nomencladores');
    } finally {
      this.loading.set(false);
    }
  }
}

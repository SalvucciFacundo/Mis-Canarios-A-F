import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CouplesStoreService } from '../../../couples/services/couples-store.service';
import { Couples } from '../../../couples/interface/couples.interface';

/**
 * Lista de parejas para administración.
 */
@Component({
  selector: 'app-admin-couples-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-couples-list.component.html',
  styleUrls: ['./admin-couples-list.component.css']
})
export class AdminCouplesListComponent {
  couples = computed(() => this.couplesStore.filteredCouples());
  loading = computed(() => this.couplesStore.isLoading());
  error = computed(() => this.couplesStore.loadError());

  constructor(private couplesStore: CouplesStoreService) { }
}

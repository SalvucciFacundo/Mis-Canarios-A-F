import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BirdsStoreService } from '../../../birds/services/birds-store.service';
import { Birds } from '../../../birds/interface/birds.interface';

/**
 * Lista de canarios para administración.
 */
@Component({
  selector: 'app-admin-birds-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-birds-list.component.html',
  styleUrls: ['./admin-birds-list.component.css']
})
export class AdminBirdsListComponent {
  birds = computed(() => this.birdsStore.birdsList());
  loading = computed(() => this.birdsStore.isLoading());
  error = computed(() => this.birdsStore.loadError());

  constructor(private birdsStore: BirdsStoreService) { }
}

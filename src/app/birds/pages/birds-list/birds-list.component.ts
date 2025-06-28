import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BirdsStoreService } from '../../services/birds-store.service';
@Component({
  selector: 'app-birds-list',
  imports: [CommonModule, RouterLink],
  templateUrl: './birds-list.component.html',
  styleUrl: './birds-list.component.css'
})
export class BirdsListComponent {

  mostrarInactivos = signal(false);

  constructor(public birdsStore: BirdsStoreService) { }

  // filteredBirds = computed(() => {
  //   const term = this.search().toLowerCase().trim();
  //   return this.birds()?.filter(bird =>
  //     bird.line?.toLowerCase().includes(term) ||
  //     bird.origin?.toLowerCase().includes(term) ||
  //     bird.ringNumber?.toString().includes(term)
  //   );
  // });
  filteredBirds = computed(() => {
    const term = this.search().toLowerCase().trim();
    const mostrarTodos = this.mostrarInactivos();

    return this.birds().filter(bird => {
      const visible = mostrarTodos || (bird.state !== 'vendido' && bird.state !== 'muerto');
      const coincideBusqueda =
        bird.line?.toLowerCase().includes(term) ||
        bird.origin?.toLowerCase().includes(term) ||
        bird.ringNumber?.toString().includes(term);

      return visible && coincideBusqueda;
    });
  });

  onToggleMostrarInactivos(event: Event) {
    const checked = (event.target as HTMLInputElement)?.checked ?? false;
    this.mostrarInactivos.set(checked);
  }

  get canariosActivos() {
    return this.birds()?.filter(b => b.state !== 'vendido' && b.state !== 'muerto')?.length ?? 0;
  }

  get canariosInactivos() {
    return this.birds()?.filter(b => b.state === 'vendido' || b.state === 'muerto')?.length ?? 0;
  }



  get search() {
    return this.birdsStore.search;
  }

  get birds() {
    return this.birdsStore.birdsList;
  }

  get loading() {
    return this.birdsStore.isLoading;
  }

  get error() {
    return this.birdsStore.loadError;
  }

  onRefresh() {
    this.birdsStore.refresh();

  }





}

/*async ngOnInit() {
  console.log('Ejecutando ngOnInit en BirdsListComponent');
  try {
    const user = await firstValueFrom(this._authService.authState$);
    if (!user?.email) return;
    this.birds = await this._birdsRegisterService.getBirds(user.email);
    console.log('Birds cargados:', this.birds);
  } catch (error) {
    console.error('Error fetching birds:', error);
  }
}*/




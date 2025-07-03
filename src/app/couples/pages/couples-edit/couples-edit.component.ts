import { Component, inject, OnInit, signal, effect, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CouplesStoreService } from '../../services/couples-store.service';
import { BirdsStoreService } from '../../../birds/services/birds-store.service';
import { LoadingService } from '../../../shared/services/loading.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Couples } from '../../interface/couples.interface';
import { Birds } from '../../../birds/interface/birds.interface';
import { BirdsAutocompleteComponent } from '../../../shared/birds-autocomplete.component';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-couples-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BirdsAutocompleteComponent],
  templateUrl: './couples-edit.component.html',
  styleUrl: './couples-edit.component.css'
})
export class CouplesEditComponent implements OnInit {
  coupleForm!: FormGroup;
  loading = false;
  coupleId: string | null = null;
  couple: Couples | null = null;

  // Signals para autocompletados
  males = signal<Birds[]>([]);
  females = signal<Birds[]>([]);

  // Propiedades para mostrar el macho y la hembra seleccionados
  selectedMale: Birds | null = null;
  selectedFemale: Birds | null = null;

  // Signal computado para el usuario autenticado
  readonly userSignal = computed(() => this.authService.currentUser());
  readonly userEmailSignal = computed(() => this.authService.currentUserEmail());

  // Getter para deshabilitar el formulario si no hay usuario o email
  get formDisabled(): boolean {
    return !this.userSignal() || !this.userEmailSignal();
  }

  // Efecto de depuración para ver el ciclo de vida del usuario
  private debugUserEffect = effect(() => {
    console.log('[CouplesEdit] userSignal:', this.userSignal());
    console.log('[CouplesEdit] userEmailSignal:', this.userEmailSignal());
  });

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private couplesStore = inject(CouplesStoreService);
  private birdsStore = inject(BirdsStoreService);
  private loadingService = inject(LoadingService);
  private toast = inject(ToastService);
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.coupleForm = this.fb.group({
      season: ['', Validators.required],
      nestCode: ['', Validators.required],
      maleId: ['', Validators.required],
      femaleId: ['', Validators.required],
      observations: ['']
    });
    this.coupleId = this.route.snapshot.paramMap.get('id');
    if (this.coupleId) {
      this.loadCouple(this.coupleId);
    }
    this.loadBirds();
  }

  loadCouple(id: string) {
    this.loading = true;
    const couples = this.couplesStore.couplesList();
    const found = couples.find((c: Couples) => c.id === id);
    if (found) {
      this.couple = found;
      this.coupleForm.patchValue({
        season: found.season,
        nestCode: found.nestCode,
        maleId: found.maleId,
        femaleId: found.femaleId,
        observations: found.observations || ''
      });
      // Precargar macho y hembra seleccionados
      const birds = this.birdsStore.filteredBirds();
      this.selectedMale = birds.find((b: Birds) => b.id === found.maleId) || null;
      this.selectedFemale = birds.find((b: Birds) => b.id === found.femaleId) || null;
    }
    this.loading = false;
  }

  loadBirds() {
    const birds = this.birdsStore.filteredBirds();
    // Si estamos editando, excluir el macho y la hembra originales de los autocompletados
    if (this.couple && this.couple.maleId && this.couple.femaleId) {
      this.males.set(birds.filter((b: Birds) => (b.gender === 'M' || b.gender === 'macho') && b.id !== this.couple!.maleId));
      this.females.set(birds.filter((b: Birds) => (b.gender === 'F' || b.gender === 'hembra') && b.id !== this.couple!.femaleId));
    } else {
      this.males.set(birds.filter((b: Birds) => b.gender === 'M' || b.gender === 'macho'));
      this.females.set(birds.filter((b: Birds) => b.gender === 'F' || b.gender === 'hembra'));
    }
  }

  availableSeasons(): string[] {
    const current = new Date().getFullYear();
    return [current.toString(), (current - 1).toString(), (current - 2).toString()];
  }

  availableMales(): Birds[] {
    return this.males();
  }

  availableFemales(): Birds[] {
    return this.females();
  }

  displayBirdFn = (bird: Birds) => bird ? `${bird.ringNumber ?? ''} - ${bird.line ?? ''}` : '';

  onMaleSelected(maleId: string) {
    this.coupleForm.get('maleId')?.setValue(maleId);
    // No actualizar el head visual nunca (head solo muestra el original)
  }
  onMaleBlur() { }
  onFemaleSelected(femaleId: string) {
    this.coupleForm.get('femaleId')?.setValue(femaleId);
    // No actualizar el head visual nunca (head solo muestra el original)
  }
  onFemaleBlur() { }

  async onSubmit() {
    if (this.coupleForm.invalid || !this.coupleId) return;
    this.loading = true;
    const email = this.userEmailSignal();
    console.log('[CouplesEdit] onSubmit email:', email);

    // Solo bloquea si no hay email (patrón birds-edit)
    if (!email) {
      this.toast.error('No se pudo obtener el usuario actual. Intenta recargar la página o volver a iniciar sesión.');
      this.loading = false;
      return;
    }

    // El userId será siempre el email, igual que birds-edit
    const data = {
      ...this.coupleForm.value,
      userId: email,
      maleId: this.coupleForm.value.maleId || this.couple?.maleId,
      femaleId: this.coupleForm.value.femaleId || this.couple?.femaleId
    };
    try {
      await this.loadingService.withLoading(
        async () => { await this.couplesStore.updateCouple(this.coupleId!, data); },
        'Guardando cambios...'
      );
      this.toast.success('Pareja actualizada correctamente');
      this.router.navigate(['/couples/couples-details', this.coupleId]);
    } catch (err) {
      console.error('Error en onSubmit:', err);
      this.toast.error('Error al actualizar la pareja');
    } finally {
      this.loading = false;
    }
  }

  onCancel() {
    // Si hay un id de pareja, volver a detalles, si no, a la lista
    if (this.coupleId) {
      this.router.navigate(['/couples/couples-details', this.coupleId]);
    } else {
      this.router.navigate(['/couples/couples-list']);
    }
  }
}

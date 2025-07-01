import { Component, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BirdsStoreService } from '../../services/birds-store.service';
import { BirdFormComponent } from '../../utils/bird-form.component';
import { Birds } from '../../interface/birds.interface';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../../shared/services/loading.service';
import { UserLimitsService } from '../../../shared/services/user-limits.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-birds-add',
  imports: [ReactiveFormsModule, BirdFormComponent, CommonModule],
  templateUrl: './birds-add.component.html',
  styleUrl: './birds-add.component.css'
})
export class BirdsAddComponent {

  private loadingService = inject(LoadingService);
  private limitsService = inject(UserLimitsService);
  private toastService = inject(ToastService);

  constructor(private birdsStore: BirdsStoreService, private router: Router) { }

  async crearBird(data: any) {
    const email = this.birdsStore.userEmail();
    if (!email) return;

    const success = await this.birdsStore.agregarCanario(email, data);

    if (success) {
      // Navegación interna rápida, sin spinner
      this.router.navigate(['/birds']);
    }
  }

  async returnList() {
    // Navegación interna rápida, sin spinner
    this.router.navigate(['/birds']);
  }

  birdsDraft = signal<Birds[]>([]);

  agregarABorrador(data: Birds) {
    this.birdsDraft.update(list => [...list, data]);
    this.resetForm(); // si querés limpiar el form después
  }

  async guardarTodos() {
    const email = this.birdsStore.userEmail();
    if (!email) return;

    const birds = this.birdsDraft();
    if (birds.length === 0) {
      this.toastService.warning('No hay canarios en la lista para guardar');
      return;
    }

    // Mostrar spinner solo para operaciones de guardado múltiple (más pesadas)
    await this.loadingService.showContentTransition('Guardando canarios...', 800);

    let successCount = 0;
    for (const bird of birds) {
      const success = await this.birdsStore.agregarCanario(email, bird);
      if (success) successCount++;
    }

    this.birdsDraft.set([]);

    if (successCount === birds.length) {
      this.toastService.success(`${successCount} canarios guardados exitosamente`);
    } else if (successCount > 0) {
      this.toastService.warning(`${successCount} de ${birds.length} canarios guardados. Algunos presentaron errores.`);
    }

    this.router.navigate(['/birds']);
    this.loadingService.hidePageTransition();
  }

  eliminarDelBorrador(index: number) {
    this.birdsDraft.update(list => list.filter((_, i) => i !== index));
  }

  limpiarBorrador() {
    this.birdsDraft.set([]);
  }

  resetForm() {
    const formComponent = document.querySelector('app-bird-form') as any;
    formComponent?.birdForm?.reset?.();
  }


  // birdForm: ReturnType<FormBuilder['group']>;

  // constructor(private fb: FormBuilder, private birdsStore: BirdsStoreService, private router: Router) {
  //   this.birdForm = this.fb.group({
  //     origin: [''],
  //     season: ['', Validators.required],
  //     ringColor: ['color', Validators.required],
  //     ringNumber: [''],
  //     gender: ['genero'],
  //     line: [''],
  //     state: ['seleccione', Validators.required],
  //     stateObservation: [''],
  //     father: [''],
  //     mother: [''],
  //     posture: [''],
  //     observations: [''],
  //   });
  // }

  // async onSubmit() {
  //   if (this.birdForm.invalid) return;
  //   //const email = this.birdsStore['authService'].currentUserEmail();
  //   const email = this.birdsStore.userEmail();
  //   if (!email) return;

  //   const newBird = this.birdForm.value;
  //   await this.birdsStore.agregarCanario(email, newBird);
  //   this.birdForm.reset({
  //     ringColor: 'color',
  //     gender: 'genero',
  //     state: 'seleccione',
  //   });
  //   this.router.navigate(['/birds']);
  // }




  // private _formBuilder = inject(FormBuilder);

  // birdForm = this._formBuilder.group({
  //   origin: this._formBuilder.control(''),
  //   season: this._formBuilder.control(''),
  //   ringColor: this._formBuilder.control('color'),
  //   ringNumber: this._formBuilder.control(''),
  //   gender: this._formBuilder.control('genero'),
  //   line: this._formBuilder.control(''),
  //   state: this._formBuilder.control('seleccione'),
  //   stateObservation: this._formBuilder.control(''),
  //   father: this._formBuilder.control(''),
  //   mother: this._formBuilder.control(''),
  //   posture: this._formBuilder.control(''),
  //   observations: this._formBuilder.control(''),
  // });

  // constructor(private _auth: AuthService, private _birdRegister: BirdsRegisterService) { }


  // async create() {
  //   //console.log('intentando crear ave', this.birdForm.value);
  //   if (this.birdForm.invalid) return;
  //   try {
  //     const user = await firstValueFrom(this._auth.authState$);
  //     if (!user?.email) {
  //       console.error('User not authenticated');
  //       return;
  //     }
  //     const formValue = Object.fromEntries(
  //       Object.entries(this.birdForm.value).map(([k, v]) => [k, v === null ? undefined : v])
  //     );
  //     const bird: Birds = {
  //       ...formValue,
  //       creationDate: new Date(),
  //       modificationDate: new Date()
  //     };
  //     await this._birdRegister.addBird(user.email, bird);
  //     this.birdForm.reset();
  //     this.birdForm.patchValue({ ringColor: 'color', gender: 'genero', state: 'seleccione' }); // Restaurar placeholders
  //     console.log('Bird added successfully');
  //   } catch (error) {
  //     console.error('Error adding bird:', error);
  //   }

  // }
}

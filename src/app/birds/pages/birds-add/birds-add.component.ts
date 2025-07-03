import { Component, signal, inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BirdsStoreService } from '../../services/birds-store.service';
import { CouplesStoreService } from '../../../couples/services/couples-store.service';
import { BirdsFormComponent } from '../../utils/birds-form.component';
import { Birds } from '../../interface/birds.interface';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../../shared/services/loading.service';
import { UserLimitsService } from '../../../shared/services/user-limits.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-birds-add',
  imports: [ReactiveFormsModule, BirdsFormComponent, CommonModule],
  templateUrl: './birds-add.component.html',
  styleUrl: './birds-add.component.css'
})
export class BirdsAddComponent implements OnInit {
  private loadingService = inject(LoadingService);
  private limitsService = inject(UserLimitsService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private couplesStore = inject(CouplesStoreService);

  @ViewChild('birdFormRef') birdFormRef!: BirdsFormComponent;

  // Signals para datos pre-cargados
  preloadedData = signal<Partial<Birds> | null>(null);
  isFromCouple = signal<boolean>(false);

  constructor(private birdsStore: BirdsStoreService, private router: Router) { } ngOnInit() {
    // Verificar si hay parámetros de URL para pre-cargar datos
    this.route.queryParams.subscribe(params => {
      if (params['fatherId'] || params['motherId']) {
        const preloaded: Partial<Birds> = {
          father: params['fatherId'] || '',
          mother: params['motherId'] || '',
          season: params['season'] ? parseInt(params['season']) : undefined,
          posture: params['posture'] ? parseInt(params['posture']) : undefined,
          registrationSource: params['registrationSource'] || 'manual'
        };

        this.preloadedData.set(preloaded);

        // Marcar si viene de una pareja
        if (params['returnTo'] === 'couple') {
          this.isFromCouple.set(true);
        }

        // Si viene del registro de cría, mostrar mensaje informativo
        if (params['registrationSource'] === 'breeding') {
          this.toastService.info('Formulario pre-cargado con datos de los padres de la pareja');
        }
      }
    });
  }

  // Manejar envío del formulario
  handleFormSubmit(data: Birds) {
    const params = this.route.snapshot.queryParams;

    // Si es modo batch-add, siempre usar borrador
    if (params['mode'] === 'batch-add') {
      this.agregarABorrador(data);
    } else if (this.isFromCouple()) {
      // Si viene de una pareja pero no es batch-add, crear directamente
      this.crearBird(data);
    } else {
      // Flujo normal: agregar al borrador
      this.agregarABorrador(data);
    }
  }

  async crearBird(data: any) {
    const email = this.birdsStore.userEmail();
    if (!email) return;

    // Agregar coupleId si viene de una pareja
    const params = this.route.snapshot.queryParams;
    if (params['returnTo'] === 'couple' && params['coupleId']) {
      data.coupleId = params['coupleId'];
    }

    const success = await this.birdsStore.agregarCanario(email, data);

    if (success) {
      // Verificar si debe volver a una pareja específica
      if (params['returnTo'] === 'couple' && params['coupleId']) {
        this.toastService.success('Pichón agregado exitosamente');
        this.router.navigate(['/couples/couples-details', params['coupleId']], {
          queryParams: { refreshAccordions: 'true' }
        });
      } else {
        // Navegación normal a lista de pájaros
        this.toastService.success('Pájaro agregado exitosamente');
        this.router.navigate(['/birds/birds-list']);
      }
    }
  }

  async returnList() {
    // Verificar si debe volver a una pareja específica
    const params = this.route.snapshot.queryParams;
    if (params['returnTo'] === 'couple' && params['coupleId']) {
      this.router.navigate(['/couples/couples-details', params['coupleId']], {
        queryParams: { refreshAccordions: 'true' }
      });
    } else {
      // Navegación normal a lista de pájaros
      this.router.navigate(['/birds']);
    }
  }

  birdsDraft = signal<Birds[]>([]);

  agregarABorrador(data: Birds) {
    // Agregar datos adicionales si viene de una pareja
    const params = this.route.snapshot.queryParams;
    if (params['returnTo'] === 'couple' && params['coupleId']) {
      data.coupleId = params['coupleId'];
    }
    if (params['posture']) {
      data.posture = parseInt(params['posture']);
    }

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

    // Verificar si debe volver a una pareja específica
    const params = this.route.snapshot.queryParams;
    if (params['returnTo'] === 'couple' && params['coupleId']) {
      this.router.navigate(['/couples/couples-details', params['coupleId']], {
        queryParams: { refreshAccordions: 'true' }
      });
    } else {
      this.router.navigate(['/birds']);
    }

    this.loadingService.hidePageTransition();
  }

  eliminarDelBorrador(index: number) {
    this.birdsDraft.update(list => list.filter((_, i) => i !== index));
  }

  limpiarBorrador() {
    this.birdsDraft.set([]);
  }

  resetForm() {
    // Usar la referencia del componente para ejecutar el reset
    if (this.birdFormRef) {
      console.log('Ejecutando resetForm usando la referencia del componente');
      this.birdFormRef.resetFormPartial();
    } else {
      console.warn('No se pudo acceder a la referencia del componente birds-form');
    }
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

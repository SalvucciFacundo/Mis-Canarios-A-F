import { Component, computed, inject, OnInit } from '@angular/core';
import { Form, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { BirdsRegisterService } from '../../services/birds-register.service';
import { firstValueFrom, map } from 'rxjs';
import { doc, Firestore, updateDoc } from '@angular/fire/firestore';
import { BirdFormComponent } from '../../utils/bird-form.component';
import { BirdsStoreService } from '../../services/birds-store.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../../shared/services/loading.service';
import { ToastService } from '../../../shared/services/toast.service';
@Component({
  selector: 'app-bird-edit',
  imports: [ReactiveFormsModule, BirdFormComponent, CommonModule],
  templateUrl: './bird-edit.component.html',
  styleUrl: './bird-edit.component.css'
})
export class BirdEditComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private store = inject(BirdsStoreService);
  private loadingService = inject(LoadingService);
  private toastService = inject(ToastService);
  //birdData: any = null;
  //birdId: string | null = null;

  readonly birdId = toSignal(this.route.paramMap.pipe(
    // extraemos el parámetro ":id" al vuelo
    // y lo guardamos como Signal reactivo
    // ejemplo: /birds/edit/ABC123 ➜ 'ABC123'
    map(params => params.get('id'))
  ));

  readonly birdData = computed(() => {
    const id = this.birdId();
    if (!id) return null;
    const birdSignal = this.store.getCanarioSignalById(id);
    return birdSignal(); // Ejecutar el computed para obtener el valor
  });

  async actualizarBird(data: any) {
    const id = this.birdId();
    const email = this.store.userEmail();
    if (!id || !email) {
      console.error('Faltan datos para actualizar: ID o email');
      this.toastService.error('Error: faltan datos para actualizar el canario');
      return;
    }

    try {
      console.log('Actualizando canario:', { id, email, data });
      // Mostrar spinner solo para la operación de guardado
      await this.loadingService.showContentTransition('Guardando cambios...', 700);
      await this.store.actualizarCanario(email, id, data);
      console.log('Canario actualizado exitosamente');
      this.router.navigate(['/birds']);
      this.loadingService.hidePageTransition();
    } catch (error) {
      console.error('Error al actualizar canario:', error);
      this.loadingService.hidePageTransition();
      // El toast de error ya se maneja en el store
    }
  }

  returnList() {
    // Navegación interna rápida, sin spinner
    this.router.navigate(['/birds']);
  }



  // constructor(
  //   private fb: FormBuilder,
  //   private birdsStore: BirdsStoreService,
  //   private router: Router
  // ) { }

  // ngOnInit(): void {
  //   this.birdId = this.route.snapshot.paramMap.get('id');

  //   if (this.birdId) {
  //     this.birdsStore.obtenerCanarioPorId(this.birdId).subscribe((bird) => {
  //       this.birdData = bird;
  //     });
  //   }
  // }

  // editBird(data: any) {
  //   const email = this.birdsStore.userEmail();
  //   if (!email || !this.birdId) return;

  //   this.birdsStore.actualizarCanario(email, this.birdId, data).then(() => {
  //     this.router.navigate(['/birds']);
  //   });
  // }


  // returnList() {
  //   this.router.navigate(['/birds']);
  // }

  // birdId!: string;
  // birdForm!: FormGroup;

  // constructor(private fb: FormBuilder,
  //   private route: ActivatedRoute,
  //   private router: Router,
  //   private auth: AuthService,
  //   private birdService: BirdsRegisterService,
  //   private firestore: Firestore
  // ) {
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



  // async ngOnInit() {
  //   const id = this.route.snapshot.paramMap.get('id');
  //   const user = await firstValueFrom(this.auth.authState$);
  //   if (!id || !user?.email) return;

  //   this.birdId = id;
  //   const bird = await this.birdService.getBirdById(user.email, id);
  //   this.birdForm.patchValue(bird);
  // }

  // async updateBird() {
  //   if (this.birdForm.invalid) return;

  //   try {
  //     const user = await firstValueFrom(this.auth.authState$);
  //     if (!user?.email) return;

  //     const updateRef = doc(
  //       this.firestore,
  //       `registro-canarios/${user.email}/Birds/${this.birdId}`
  //     );

  //     await updateDoc(updateRef, {
  //       ...this.birdForm.value,
  //       modificationDate: new Date(),
  //     });

  //     this.router.navigate(['/birds']);
  //   } catch (error) {
  //     console.error('Error al actualizar el canario:', error);
  //   }
  // }
}



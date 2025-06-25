import { Component, OnInit } from '@angular/core';
import { Form, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { BirdsRegisterService } from '../../services/birds-register.service';
import { firstValueFrom } from 'rxjs';
import { doc, Firestore, updateDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-bird-edit',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './bird-edit.component.html',
  styleUrl: './bird-edit.component.css'
})
export class BirdEditComponent implements OnInit {

  birdId!: string;
  birdForm!: FormGroup;

  constructor(private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private birdService: BirdsRegisterService,
    private firestore: Firestore
  ) {
    this.birdForm = this.fb.group({
      origin: [''],
      season: ['', Validators.required],
      ringColor: ['color', Validators.required],
      ringNumber: [''],
      gender: ['genero'],
      line: [''],
      state: ['seleccione', Validators.required],
      stateObservation: [''],
      father: [''],
      mother: [''],
      posture: [''],
      observations: [''],
    });
  }



  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const user = await firstValueFrom(this.auth.authState$);
    if (!id || !user?.email) return;

    this.birdId = id;
    const bird = await this.birdService.getBirdById(user.email, id);
    this.birdForm.patchValue(bird);
  }

  async updateBird() {
    if (this.birdForm.invalid) return;

    try {
      const user = await firstValueFrom(this.auth.authState$);
      if (!user?.email) return;

      const updateRef = doc(
        this.firestore,
        `registro-canarios/${user.email}/Birds/${this.birdId}`
      );

      await updateDoc(updateRef, {
        ...this.birdForm.value,
        modificationDate: new Date(),
      });

      this.router.navigate(['/birds']);
    } catch (error) {
      console.error('Error al actualizar el canario:', error);
    }
  }
}



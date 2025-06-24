import { firstValueFrom, Observable } from 'rxjs';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../auth/services/auth.service';
import { BirdsRegisterService } from '../../services/birds-register.service';
import { Birds } from '../../interface/birds.interface';

@Component({
  selector: 'app-birds-add',
  imports: [ReactiveFormsModule],
  templateUrl: './birds-add.component.html',
  styleUrl: './birds-add.component.css'
})
export class BirdsAddComponent {

  private _formBuilder = inject(FormBuilder);

  birdForm = this._formBuilder.group({
    origin: this._formBuilder.control(''),
    season: this._formBuilder.control(''),
    ringColor: this._formBuilder.control('color'),
    ringNumber: this._formBuilder.control(''),
    gender: this._formBuilder.control('genero'),
    line: this._formBuilder.control(''),
    state: this._formBuilder.control('seleccione'),
    stateObservation: this._formBuilder.control(''),
    father: this._formBuilder.control(''),
    mother: this._formBuilder.control(''),
    posture: this._formBuilder.control(''),
    observations: this._formBuilder.control(''),
  });

  constructor(private _auth: AuthService, private _birdRegister: BirdsRegisterService) { }


  async create() {
    console.log('intentando crear ave', this.birdForm.value);
    if (this.birdForm.invalid) return;
    try {
      const user = await firstValueFrom(this._auth.authState$);
      if (!user?.email) {
        console.error('User not authenticated');
        console.log('Usuario:', user.email);
        return;
      }
      const formValue = Object.fromEntries(
        Object.entries(this.birdForm.value).map(([k, v]) => [k, v === null ? undefined : v])
      );
      const bird: Birds = {
        ...formValue,
        creationDate: new Date(),
        modificationDate: new Date()
      };
      await this._birdRegister.addBird(user.email, bird);
      //this.birdForm.reset();
      //this.birdForm.patchValue({ ringColor: 'color', gender: 'genero', state: 'seleccione' }); // Restaurar placeholders
      console.log('Bird added successfully');
    } catch (error) {
      console.error('Error adding bird:', error);
    }

  }
}

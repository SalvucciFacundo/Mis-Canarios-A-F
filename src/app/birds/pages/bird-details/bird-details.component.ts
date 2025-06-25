import { Component } from '@angular/core';
import { Birds } from '../../interface/birds.interface';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BirdsRegisterService } from '../../services/birds-register.service';
import { AuthService } from '../../../auth/services/auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-bird-details',
  imports: [RouterLink],
  templateUrl: './bird-details.component.html',
  styleUrl: './bird-details.component.css'
})
export class BirdDetailsComponent {

  bird!: Birds;

  constructor(private route: ActivatedRoute, private _birdsService: BirdsRegisterService, private _auth: AuthService) { }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const user = await firstValueFrom(this._auth.authState$);

    if (!id || !user?.email) return;
    try {
      this.bird = await this._birdsService.getBirdById(user.email, id);
    } catch (error) {
      console.error('Error fetching bird details:', error);
    }
  }
}

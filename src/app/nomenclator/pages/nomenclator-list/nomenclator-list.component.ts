import { Component } from '@angular/core';
import { NomenclatorService } from '../../services/nomenclator.service';

@Component({
  selector: 'app-nomenclator-list',
  imports: [],
  templateUrl: './nomenclator-list.component.html',
  styleUrl: './nomenclator-list.component.css'
})
export class NomenclatorListComponent {
  constructor(private nomenclatorService: NomenclatorService) { }


  // cargarLineasFOCI() {
  //   this.nomenclatorService.cargarDesdeJsonYEnviarAFirebase('assets/nomenclador2025FOCI.json', 'FOCI');
  //   console.log('lineas cargadas');
  // }

}

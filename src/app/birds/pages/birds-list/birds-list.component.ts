import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-birds-list',
  imports: [CommonModule, RouterLink],
  templateUrl: './birds-list.component.html',
  styleUrl: './birds-list.component.css'
})
export class BirdsListComponent {

  mostrarCanario() { }
}

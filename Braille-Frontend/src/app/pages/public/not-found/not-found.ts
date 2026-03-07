import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss'
})
export class NotFound {

  constructor(private location: Location) { }

  voltarPaginaAnterior(): void {
    // Usando o serviço nativo Location do Angular 
    // ele inspeciona o histórico HTML5 empilhado deste mesmo domínio/site.
    this.location.back();
  }
}

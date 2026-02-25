import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-comunicados-lista',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Comunicados</h1>
        <p class="page-subtitle">Mural de avisos e comunicações</p>
      </div>
    </div>
    <div class="empty-state">
      <h3>Em desenvolvimento</h3>
      <p>Esta tela será implementada em breve.</p>
    </div>
  `,
    styles: []
})
export class ComunicadosLista { }

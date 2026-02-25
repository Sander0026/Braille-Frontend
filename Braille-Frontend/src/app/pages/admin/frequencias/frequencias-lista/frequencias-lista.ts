import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-frequencias-lista',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Frequências</h1>
        <p class="page-subtitle">Registro de chamadas por turma e data</p>
      </div>
    </div>
    <div class="empty-state">
      <h3>Em desenvolvimento</h3>
      <p>Esta tela será implementada em breve.</p>
    </div>
  `,
    styles: []
})
export class FrequenciasLista { }

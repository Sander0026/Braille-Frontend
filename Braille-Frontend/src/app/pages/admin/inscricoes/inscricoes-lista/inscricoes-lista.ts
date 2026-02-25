import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-inscricoes-lista',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Inscrições</h1>
        <p class="page-subtitle">Formulários recebidos pelo site</p>
      </div>
    </div>
    <div class="empty-state">
      <h3>Em desenvolvimento</h3>
      <p>Esta tela será implementada em breve.</p>
    </div>
  `,
    styles: []
})
export class InscricoesLista { }

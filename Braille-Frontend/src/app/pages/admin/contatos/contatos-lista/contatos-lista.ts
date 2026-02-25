import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-contatos-lista',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Fale Conosco</h1>
        <p class="page-subtitle">Mensagens recebidas pelo formulário de contato</p>
      </div>
    </div>
    <div class="empty-state">
      <h3>Em desenvolvimento</h3>
      <p>Esta tela será implementada em breve.</p>
    </div>
  `,
    styles: []
})
export class ContatosLista { }

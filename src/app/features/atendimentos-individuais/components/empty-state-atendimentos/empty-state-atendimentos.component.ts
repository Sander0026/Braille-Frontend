import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state-atendimentos',
  standalone: true,
  template: `
    <section class="empty-state">
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
    </section>
  `,
  styles: [`
    .empty-state { border:1px dashed #cbd5e1; border-radius:8px; padding:2rem; text-align:center; background:#fff; }
    h2 { margin:0 0 .35rem; font-size:1.1rem; }
    p { margin:0; color:#64748b; }
  `],
})
export class EmptyStateAtendimentosComponent {
  @Input() title = 'Nenhum atendimento encontrado';
  @Input() description = 'Quando houver registros, eles aparecerao aqui.';
}

import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-resumo-atendimentos',
  standalone: true,
  template: `
    <dl class="summary" aria-label="Resumo dos atendimentos">
      <div><dt>Atendimentos</dt><dd>{{ resumo.atendimentosRealizados }}</dd></div>
      <div><dt>Faltas justificadas</dt><dd>{{ resumo.faltasJustificadas }}</dd></div>
      <div><dt>Faltas nao justificadas</dt><dd>{{ resumo.faltasNaoJustificadas }}</dd></div>
      <div><dt>Cancelados</dt><dd>{{ resumo.cancelados }}</dd></div>
    </dl>
  `,
  styles: [`
    .summary { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:.75rem; margin:0; }
    div { padding:.85rem; border:1px solid #e2e8f0; border-radius:8px; background:#fff; }
    dt { color:#64748b; font-size:.78rem; font-weight:800; text-transform:uppercase; }
    dd { margin:.25rem 0 0; font-size:1.35rem; font-weight:900; }
    @media (max-width:760px) { .summary { grid-template-columns:repeat(2,minmax(0,1fr)); } }
  `],
})
export class ResumoAtendimentosComponent {
  @Input() resumo = {
    atendimentosRealizados: 0,
    faltasJustificadas: 0,
    faltasNaoJustificadas: 0,
    cancelados: 0,
  };
}

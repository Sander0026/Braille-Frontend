import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FiltroAcompanhamentoIndividual } from '../../models/filtros-atendimento.model';

@Component({
  selector: 'app-filtros-atendimentos',
  standalone: true,
  imports: [FormsModule],
  template: `
    <form class="filters" (ngSubmit)="apply.emit(filtros)">
      <label>
        <span>Buscar</span>
        <input type="search" [(ngModel)]="filtros.busca" name="busca" placeholder="Nome, matricula ou assunto" />
      </label>
      <label>
        <span>Status</span>
        <select [(ngModel)]="filtros.status" name="status">
          <option value="">Todos</option>
          <option value="EM_ANDAMENTO">Em andamento</option>
          <option value="FINALIZADO">Finalizado</option>
          <option value="ARQUIVADO">Arquivado</option>
        </select>
      </label>
      <button type="submit">Filtrar</button>
    </form>
  `,
  styles: [`
    .filters { display:grid; grid-template-columns:1fr minmax(12rem,16rem) auto; gap:.75rem; align-items:end; padding:1rem; border:1px solid #dde3ec; border-radius:8px; background:#fff; }
    label { display:grid; gap:.35rem; font-weight:800; color:#4b5563; }
    input, select { min-height:2.75rem; border:1px solid #cbd5e1; border-radius:8px; padding:.65rem .8rem; font:inherit; }
    button { min-height:2.75rem; border:0; border-radius:8px; background:#f2c300; color:#111827; padding:.65rem 1rem; font-weight:900; cursor:pointer; }
    @media (max-width:760px) { .filters { grid-template-columns:1fr; } }
  `],
})
export class FiltrosAtendimentosComponent {
  @Output() apply = new EventEmitter<FiltroAcompanhamentoIndividual>();
  filtros: FiltroAcompanhamentoIndividual = {};
}

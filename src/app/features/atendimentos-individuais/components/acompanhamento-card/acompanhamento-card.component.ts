import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AcompanhamentoIndividual } from '../../models/acompanhamento-individual.model';
import { StatusAcompanhamentoBadgeComponent } from '../status-acompanhamento-badge/status-acompanhamento-badge.component';

@Component({
  selector: 'app-acompanhamento-card',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusAcompanhamentoBadgeComponent],
  template: `
    <article class="card">
      <div class="top">
        <div>
          <h2>{{ acompanhamento.aluno?.nomeCompleto || 'Aluno nao informado' }}</h2>
          <p>{{ acompanhamento.aluno?.matricula || 'Sem matricula' }} · {{ acompanhamento.professor?.nome || 'Professor nao informado' }}</p>
        </div>
        <app-status-acompanhamento-badge [status]="acompanhamento.status" />
      </div>

      <div class="subject">
        <span>Assunto principal</span>
        <strong>{{ acompanhamento.assuntoAtual }}</strong>
      </div>

      @if (acompanhamento.descricao) {
        <p class="description">{{ acompanhamento.descricao }}</p>
      }

      <dl class="metrics">
        <div><dt>Inicio</dt><dd>{{ acompanhamento.dataInicio | date:'dd/MM/yyyy' }}</dd></div>
        <div><dt>Registros</dt><dd>{{ acompanhamento._count?.atendimentos || acompanhamento.atendimentos?.length || 0 }}</dd></div>
      </dl>

      <div class="actions">
        <a class="btn-secondary" [routerLink]="['/admin/atendimentos-individuais', acompanhamento.id]">Ver historico</a>
        @if (acompanhamento.status === 'EM_ANDAMENTO' && canCreateAtendimento) {
          <a class="btn-primary" [routerLink]="['/admin/atendimentos-individuais', acompanhamento.id, 'novo-atendimento']">Novo atendimento</a>
        }
        @if (acompanhamento.status === 'EM_ANDAMENTO' && canFinish) {
          <button type="button" class="btn-ghost" (click)="finish.emit(acompanhamento)">Finalizar</button>
        }
      </div>
    </article>
  `,
  styles: [`
    .card { display:grid; gap:1rem; padding:1rem; border:1px solid #dde3ec; border-radius:8px; background:#fff; box-shadow:0 10px 24px rgb(15 23 42 / .06); }
    .top { display:flex; justify-content:space-between; gap:1rem; }
    h2 { margin:0; font-size:1.05rem; }
    p { margin:.25rem 0 0; color:#64748b; }
    .subject { display:grid; gap:.2rem; }
    .subject span, dt { color:#64748b; font-size:.78rem; font-weight:800; text-transform:uppercase; }
    .metrics { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.75rem; margin:0; }
    .metrics div { padding:.75rem; border-radius:8px; background:#f8fafc; }
    dd { margin:.15rem 0 0; font-weight:800; }
    .actions { display:flex; gap:.5rem; justify-content:flex-end; flex-wrap:wrap; }
    a, button { min-height:2.5rem; border-radius:8px; padding:.55rem .9rem; font-weight:800; text-decoration:none; cursor:pointer; }
    .btn-primary { border:0; background:#f2c300; color:#111827; }
    .btn-secondary { border:1px solid #cbd5e1; background:#fff; color:#111827; }
    .btn-ghost { border:0; background:transparent; color:#334155; }
  `],
})
export class AcompanhamentoCardComponent {
  @Input({ required: true }) acompanhamento!: AcompanhamentoIndividual;
  @Input() canCreateAtendimento = false;
  @Input() canFinish = false;
  @Output() finish = new EventEmitter<AcompanhamentoIndividual>();
}

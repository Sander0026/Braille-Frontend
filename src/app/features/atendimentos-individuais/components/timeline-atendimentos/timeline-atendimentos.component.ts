import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AtendimentoIndividual } from '../../models/atendimento-individual.model';
import { TipoRegistroBadgeComponent } from '../tipo-registro-badge/tipo-registro-badge.component';

@Component({
  selector: 'app-timeline-atendimentos',
  standalone: true,
  imports: [CommonModule, TipoRegistroBadgeComponent],
  template: `
    <ol class="timeline" aria-label="Timeline de atendimentos">
      @for (item of atendimentos; track item.id) {
        <li>
          <time [attr.datetime]="item.dataAtendimento">{{ item.dataAtendimento | date:'dd/MM/yyyy' }}</time>
          <div class="content">
            <app-tipo-registro-badge [tipo]="item.tipoRegistro" />
            @if (item.assuntoDoDia) { <h3>{{ item.assuntoDoDia }}</h3> }
            @if (item.observacao) { <p>{{ item.observacao }}</p> }
            @if (item.evolucao) { <p><strong>Evolucao:</strong> {{ item.evolucao }}</p> }
            @if (item.dificuldades) { <p><strong>Dificuldades:</strong> {{ item.dificuldades }}</p> }
            @if (item.pendencias) { <p><strong>Pendencias:</strong> {{ item.pendencias }}</p> }
            @if (item.recomendacoes) { <p><strong>Recomendacoes:</strong> {{ item.recomendacoes }}</p> }
            @if (item.arquivos?.length) {
              <ul class="files" aria-label="Arquivos anexados">
                @for (arquivo of item.arquivos; track arquivo.id) {
                  <li><a [href]="arquivo.urlArquivo" target="_blank" rel="noopener">{{ arquivo.nomeOriginal }}</a></li>
                }
              </ul>
            }
          </div>
        </li>
      }
    </ol>
  `,
  styles: [`
    .timeline { display:grid; gap:1rem; padding:0; margin:0; list-style:none; }
    li { display:grid; grid-template-columns:8rem 1fr; gap:1rem; }
    time { color:#475569; font-weight:800; padding-top:.25rem; }
    .content { border-left:3px solid #f2c300; padding:0 0 0 1rem; }
    h3 { margin:.55rem 0 .35rem; font-size:1rem; }
    p { margin:.35rem 0; line-height:1.5; }
    .files { margin:.75rem 0 0; padding-left:1rem; }
    a { color:#0f5f95; font-weight:800; }
    @media (max-width:720px) { li { grid-template-columns:1fr; gap:.35rem; } }
  `],
})
export class TimelineAtendimentosComponent {
  @Input() atendimentos: AtendimentoIndividual[] = [];
}

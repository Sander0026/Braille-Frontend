import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AtendimentoIndividual } from '../../models/atendimento-individual.model';
import { TipoRegistroBadgeComponent } from '../tipo-registro-badge/tipo-registro-badge.component';
import { ArquivoAtendimentoIndividual } from '../../models/arquivo-atendimento.model';
import { ArquivosAtendimentoApiService } from '../../services/arquivos-atendimento-api.service';
import { ToastService } from '../../../../core/services/toast.service';

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
                  <li>
                    <button type="button" (click)="abrirArquivo(arquivo)" [disabled]="baixandoId() === arquivo.id">
                      {{ baixandoId() === arquivo.id ? 'Abrindo...' : arquivo.nomeOriginal }}
                    </button>
                  </li>
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
    .files button { border:0; background:transparent; color:#0f5f95; font-weight:800; padding:.25rem 0; cursor:pointer; text-align:left; }
    .files button:focus-visible { outline:2px solid #f2c300; outline-offset:3px; }
    .files button:disabled { color:#64748b; cursor:wait; }
    @media (max-width:720px) { li { grid-template-columns:1fr; gap:.35rem; } }
  `],
})
export class TimelineAtendimentosComponent {
  private readonly arquivosApi = inject(ArquivosAtendimentoApiService);
  private readonly toast = inject(ToastService);
  @Input() atendimentos: AtendimentoIndividual[] = [];
  readonly baixandoId = signal<string | null>(null);

  abrirArquivo(arquivo: ArquivoAtendimentoIndividual): void {
    if (this.baixandoId()) return;

    this.baixandoId.set(arquivo.id);
    this.arquivosApi.download(arquivo.id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = arquivo.nomeOriginal || 'arquivo-atendimento';
        link.click();
        URL.revokeObjectURL(url);
        this.baixandoId.set(null);
      },
      error: () => {
        this.baixandoId.set(null);
        this.toast.erro('Nao foi possivel abrir o arquivo anexado.');
      },
    });
  }
}

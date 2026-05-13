import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
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
            <div class="content__header">
              <app-tipo-registro-badge [tipo]="item.tipoRegistro" />
              @if (acompanhamentoId) {
                <button
                  type="button"
                  class="btn-edit"
                  (click)="editarClicado.emit(item)"
                  [attr.aria-label]="'Editar atendimento de ' + (item.dataAtendimento | date:'dd/MM/yyyy')">
                  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Editar
                </button>
              }
            </div>
            @if (item.assuntoDoDia) { <h3>{{ item.assuntoDoDia }}</h3> }
            @if (detalhesAtendimento(item)) { <p class="details">{{ detalhesAtendimento(item) }}</p> }
            @if (comprovanteLabel(item)) { <p class="proof">{{ comprovanteLabel(item) }}</p> }
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
    .content__header { display:flex; align-items:center; justify-content:space-between; gap:.75rem; flex-wrap:wrap; }
    h3 { margin:.55rem 0 .35rem; font-size:1rem; }
    p { margin:.35rem 0; line-height:1.5; }
    .details { color:#475569; font-weight:700; }
    .proof { color:#7c2d12; font-weight:800; }
    .files { margin:.75rem 0 0; padding-left:1rem; }
    .files button { border:0; background:transparent; color:#0f5f95; font-weight:800; padding:.25rem 0; cursor:pointer; text-align:left; }
    .files button:focus-visible { outline:2px solid #f2c300; outline-offset:3px; }
    .files button:disabled { color:#64748b; cursor:wait; }
    .btn-edit {
      display:inline-flex; align-items:center; gap:.3rem;
      border:1px solid #e2e8f0; background:#fff; color:#475569;
      font-size:.75rem; font-weight:700; padding:.3rem .6rem;
      border-radius:6px; cursor:pointer; transition:all 150ms; text-decoration:none;
    }
    .btn-edit:hover { background:#f8fafc; border-color:#94a3b8; color:#1e293b; }
    .btn-edit:focus-visible { outline:2px solid #f2c300; outline-offset:2px; }
    @media (max-width:720px) { li { grid-template-columns:1fr; gap:.35rem; } .content__header { flex-direction:column; align-items:flex-start; } }
  `],
})
export class TimelineAtendimentosComponent {
  private readonly arquivosApi = inject(ArquivosAtendimentoApiService);
  private readonly toast = inject(ToastService);

  @Input() atendimentos: AtendimentoIndividual[] = [];
  /** UUID do acompanhamento pai – necessário para exibir o botão Editar */
  @Input() acompanhamentoId: string | null = null;

  /** Emite o atendimento clicado para o pai abrir o modal de edição */
  @Output() readonly editarClicado = new EventEmitter<AtendimentoIndividual>();

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
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        this.baixandoId.set(null);
      },
      error: () => {
        this.baixandoId.set(null);
        this.toast.erro('Nao foi possivel abrir o arquivo anexado.');
      },
    });
  }

  detalhesAtendimento(item: AtendimentoIndividual): string {
    const partes = [
      item.horaInicio ? `Inicio ${item.horaInicio}` : null,
      item.horaFim ? `Fim ${item.horaFim}` : null,
      item.duracaoMinutos ? `${item.duracaoMinutos} min` : null,
      item.modalidade ? this.formatarModalidade(item.modalidade) : null,
      item.localAtendimento ? `Local ${item.localAtendimento}` : null,
    ].filter(Boolean);
    return partes.join(' - ');
  }

  comprovanteLabel(item: AtendimentoIndividual): string {
    if (item.tipoRegistro !== 'FALTA_JUSTIFICADA') return '';
    return item.temComprovante ? 'Falta justificada com comprovante anexado.' : 'Falta justificada sem comprovante anexado.';
  }

  private formatarModalidade(modalidade: string): string {
    const labels: Record<string, string> = {
      PRESENCIAL: 'Presencial',
      REMOTO: 'Remoto',
      TELEFONE: 'Telefone',
      OUTRO: 'Outro',
    };
    return labels[modalidade] ?? modalidade;
  }
}

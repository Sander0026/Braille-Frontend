import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CriarAtendimentoIndividualPayload,
  TipoRegistroAtendimentoIndividual,
} from '../../models/atendimento-individual.model';

@Component({
  selector: 'app-atendimento-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <form class="form" (ngSubmit)="submit()">
      <label>
        <span>Tipo de registro *</span>
        <select [(ngModel)]="value.tipoRegistro" name="tipoRegistro" required>
          <option value="ATENDIMENTO_REALIZADO">Atendimento realizado</option>
          <option value="FALTA_JUSTIFICADA">Falta justificada</option>
          <option value="FALTA_NAO_JUSTIFICADA">Falta nao justificada</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
      </label>

      <label>
        <span>Data do atendimento *</span>
        <input type="date" [(ngModel)]="value.dataAtendimento" name="dataAtendimento" required />
      </label>

      @if (value.tipoRegistro === 'ATENDIMENTO_REALIZADO') {
        <label>
          <span>Assunto do dia *</span>
          <input type="text" [(ngModel)]="value.assuntoDoDia" name="assuntoDoDia" maxlength="200" />
        </label>
        <label>
          <span>Observacao / resumo *</span>
          <textarea rows="4" [(ngModel)]="value.observacao" name="observacao" maxlength="2000"></textarea>
        </label>
        <div class="two-cols">
          <label><span>Evolucao</span><textarea rows="3" [(ngModel)]="value.evolucao" name="evolucao"></textarea></label>
          <label><span>Dificuldades</span><textarea rows="3" [(ngModel)]="value.dificuldades" name="dificuldades"></textarea></label>
        </div>
        <div class="two-cols">
          <label><span>Pendencias</span><textarea rows="3" [(ngModel)]="value.pendencias" name="pendencias"></textarea></label>
          <label><span>Recomendacoes</span><textarea rows="3" [(ngModel)]="value.recomendacoes" name="recomendacoes"></textarea></label>
        </div>
      } @else if (value.tipoRegistro === 'FALTA_JUSTIFICADA') {
        <label>
          <span>Motivo da falta *</span>
          <textarea rows="4" [(ngModel)]="value.observacao" name="observacaoFalta" maxlength="2000"></textarea>
        </label>
      } @else {
        <label>
          <span>{{ value.tipoRegistro === 'CANCELADO' ? 'Motivo do cancelamento' : 'Observacao opcional' }}</span>
          <textarea rows="4" [(ngModel)]="value.observacao" name="observacaoOpcional" maxlength="2000"></textarea>
        </label>
      }

      <p class="error" aria-live="assertive">{{ error }}</p>

      <div class="actions">
        <button type="button" class="btn-secondary" (click)="cancel.emit()">Cancelar</button>
        <button type="submit" class="btn-primary" [disabled]="saving">{{ saving ? 'Salvando...' : submitLabel }}</button>
      </div>
    </form>
  `,
  styles: [`
    .form { display:grid; gap:1rem; }
    label { display:grid; gap:.35rem; font-weight:800; color:#4b5563; }
    input, select, textarea { min-height:2.75rem; border:1px solid #cbd5e1; border-radius:8px; padding:.65rem .8rem; font:inherit; background:#fff; }
    textarea { resize:vertical; }
    .two-cols { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1rem; }
    .actions { display:flex; justify-content:flex-end; gap:.75rem; }
    .btn-primary, .btn-secondary { min-height:2.5rem; border-radius:8px; padding:.55rem .9rem; font-weight:800; cursor:pointer; }
    .btn-primary { border:0; background:#f2c300; color:#111827; }
    .btn-secondary { border:1px solid #cbd5e1; background:#fff; color:#111827; }
    .error { min-height:1.25rem; color:#b91c1c; margin:0; font-weight:700; }
    @media (max-width:760px) { .two-cols { grid-template-columns:1fr; } .actions { flex-direction:column; } }
  `],
})
export class AtendimentoFormComponent {
  @Input() saving = false;
  @Input() submitLabel = 'Salvar atendimento';
  @Output() save = new EventEmitter<CriarAtendimentoIndividualPayload>();
  @Output() cancel = new EventEmitter<void>();

  error = '';
  value: CriarAtendimentoIndividualPayload = {
    dataAtendimento: new Date().toISOString().slice(0, 10),
    tipoRegistro: 'ATENDIMENTO_REALIZADO',
  };

  submit(): void {
    this.error = this.validate();
    if (this.error) return;
    this.save.emit({ ...this.value });
  }

  private validate(): string {
    if (!this.value.dataAtendimento) return 'Informe a data do atendimento.';
    if (this.value.tipoRegistro === 'ATENDIMENTO_REALIZADO') {
      if (!this.value.assuntoDoDia?.trim()) return 'Informe o assunto do dia.';
      if (!this.value.observacao?.trim()) return 'Informe a observacao do atendimento.';
    }
    if (this.value.tipoRegistro === 'FALTA_JUSTIFICADA' && !this.value.observacao?.trim()) {
      return 'Informe o motivo da falta justificada.';
    }
    return '';
  }
}

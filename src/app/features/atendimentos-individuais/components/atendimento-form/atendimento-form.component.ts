import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  CriarAtendimentoIndividualPayload,
  ModalidadeAtendimentoIndividual,
  TipoRegistroAtendimentoIndividual,
} from '../../models/atendimento-individual.model';

type AtendimentoFormGroup = FormGroup<{
  dataAtendimento: FormControl<string>;
  tipoRegistro: FormControl<TipoRegistroAtendimentoIndividual>;
  horaInicio: FormControl<string>;
  horaFim: FormControl<string>;
  duracaoMinutos: FormControl<number | null>;
  modalidade: FormControl<ModalidadeAtendimentoIndividual | ''>;
  localAtendimento: FormControl<string>;
  assuntoDoDia: FormControl<string>;
  observacao: FormControl<string>;
  evolucao: FormControl<string>;
  dificuldades: FormControl<string>;
  pendencias: FormControl<string>;
  recomendacoes: FormControl<string>;
}>;

@Component({
  selector: 'app-atendimento-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form class="form" [formGroup]="form" (ngSubmit)="submit()">
      <label>
        <span>Tipo de registro *</span>
        <select formControlName="tipoRegistro">
          <option value="ATENDIMENTO_REALIZADO">Atendimento realizado</option>
          <option value="FALTA_JUSTIFICADA">Falta justificada</option>
          <option value="FALTA_NAO_JUSTIFICADA">Falta nao justificada</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
      </label>

      <label>
        <span>Data do atendimento *</span>
        <input type="date" formControlName="dataAtendimento" />
      </label>

      <div class="three-cols">
        <label>
          <span>Inicio</span>
          <input type="time" formControlName="horaInicio" />
        </label>
        <label>
          <span>Fim</span>
          <input type="time" formControlName="horaFim" />
        </label>
        <label>
          <span>Duracao (min)</span>
          <input type="number" min="1" max="1440" formControlName="duracaoMinutos" />
        </label>
      </div>

      <div class="two-cols">
        <label>
          <span>Modalidade</span>
          <select formControlName="modalidade">
            <option value="">Nao informar</option>
            <option value="PRESENCIAL">Presencial</option>
            <option value="REMOTO">Remoto</option>
            <option value="TELEFONE">Telefone</option>
            <option value="OUTRO">Outro</option>
          </select>
        </label>
        <label>
          <span>Local</span>
          <input type="text" formControlName="localAtendimento" maxlength="120" placeholder="Sala, endereco ou plataforma" />
        </label>
      </div>

      @if (tipoRegistroAtual() === 'ATENDIMENTO_REALIZADO') {
        <label>
          <span>Assunto do dia *</span>
          <input type="text" formControlName="assuntoDoDia" maxlength="200" />
        </label>
        <label>
          <span>Observacao / resumo *</span>
          <textarea rows="4" formControlName="observacao" maxlength="2000"></textarea>
        </label>
        <div class="two-cols">
          <label><span>Evolucao</span><textarea rows="3" formControlName="evolucao"></textarea></label>
          <label><span>Dificuldades</span><textarea rows="3" formControlName="dificuldades"></textarea></label>
        </div>
        <div class="two-cols">
          <label><span>Pendencias</span><textarea rows="3" formControlName="pendencias"></textarea></label>
          <label><span>Recomendacoes</span><textarea rows="3" formControlName="recomendacoes"></textarea></label>
        </div>
      } @else if (tipoRegistroAtual() === 'FALTA_JUSTIFICADA') {
        <label>
          <span>Motivo da falta *</span>
          <textarea rows="4" formControlName="observacao" maxlength="2000"></textarea>
        </label>
      } @else {
        <label>
          <span>{{ tipoRegistroAtual() === 'CANCELADO' ? 'Motivo do cancelamento' : 'Observacao opcional' }}</span>
          <textarea rows="4" formControlName="observacao" maxlength="2000"></textarea>
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
    .three-cols { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:1rem; }
    .actions { display:flex; justify-content:flex-end; gap:.75rem; }
    .btn-primary, .btn-secondary { min-height:2.5rem; border-radius:8px; padding:.55rem .9rem; font-weight:800; cursor:pointer; }
    .btn-primary { border:0; background:#f2c300; color:#111827; }
    .btn-secondary { border:1px solid #cbd5e1; background:#fff; color:#111827; }
    .error { min-height:1.25rem; color:#b91c1c; margin:0; font-weight:700; }
    @media (max-width:760px) { .two-cols, .three-cols { grid-template-columns:1fr; } .actions { flex-direction:column; } }
  `],
})
export class AtendimentoFormComponent implements OnDestroy {
  @Input() saving = false;
  @Input() submitLabel = 'Salvar atendimento';
  @Output() save = new EventEmitter<CriarAtendimentoIndividualPayload>();
  @Output() cancel = new EventEmitter<void>();

  error = '';
  readonly form: AtendimentoFormGroup = new FormGroup({
    dataAtendimento: new FormControl(new Date().toISOString().slice(0, 10), { nonNullable: true, validators: [Validators.required] }),
    tipoRegistro: new FormControl<TipoRegistroAtendimentoIndividual>('ATENDIMENTO_REALIZADO', { nonNullable: true, validators: [Validators.required] }),
    horaInicio: new FormControl('', { nonNullable: true }),
    horaFim: new FormControl('', { nonNullable: true }),
    duracaoMinutos: new FormControl<number | null>(null, [Validators.min(1), Validators.max(1440)]),
    modalidade: new FormControl<ModalidadeAtendimentoIndividual | ''>('', { nonNullable: true }),
    localAtendimento: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(120)] }),
    assuntoDoDia: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(200)] }),
    observacao: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(2000)] }),
    evolucao: new FormControl('', { nonNullable: true }),
    dificuldades: new FormControl('', { nonNullable: true }),
    pendencias: new FormControl('', { nonNullable: true }),
    recomendacoes: new FormControl('', { nonNullable: true }),
  }, { validators: [this.horarioValidator, this.regraTipoValidator] });

  private readonly subscriptions = new Subscription();

  constructor() {
    this.subscriptions.add(
      this.form.controls.tipoRegistro.valueChanges.subscribe(() => {
        this.error = '';
        this.form.patchValue({
          assuntoDoDia: '',
          observacao: '',
          evolucao: '',
          dificuldades: '',
          pendencias: '',
          recomendacoes: '',
        }, { emitEvent: false });
        this.form.updateValueAndValidity({ emitEvent: false });
      }),
    );
  }

  get value(): CriarAtendimentoIndividualPayload {
    return this.normalizarPayload();
  }

  set value(payload: CriarAtendimentoIndividualPayload) {
    this.form.patchValue({
      dataAtendimento: payload.dataAtendimento ?? new Date().toISOString().slice(0, 10),
      tipoRegistro: payload.tipoRegistro ?? 'ATENDIMENTO_REALIZADO',
      horaInicio: payload.horaInicio ?? '',
      horaFim: payload.horaFim ?? '',
      duracaoMinutos: payload.duracaoMinutos ?? null,
      modalidade: payload.modalidade ?? '',
      localAtendimento: payload.localAtendimento ?? '',
      assuntoDoDia: payload.assuntoDoDia ?? '',
      observacao: payload.observacao ?? '',
      evolucao: payload.evolucao ?? '',
      dificuldades: payload.dificuldades ?? '',
      pendencias: payload.pendencias ?? '',
      recomendacoes: payload.recomendacoes ?? '',
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  tipoRegistroAtual(): TipoRegistroAtendimentoIndividual {
    return this.form.controls.tipoRegistro.value;
  }

  submit(): void {
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();
    this.error = this.errorMessage();
    if (this.error) return;
    this.save.emit(this.normalizarPayload());
  }

  private horarioValidator(control: AbstractControl): ValidationErrors | null {
    const horaInicio = control.get('horaInicio')?.value as string | undefined;
    const horaFim = control.get('horaFim')?.value as string | undefined;
    if (horaInicio && horaFim && horaFim <= horaInicio) return { horarioInvalido: true };
    return null;
  }

  private regraTipoValidator(control: AbstractControl): ValidationErrors | null {
    const tipo = control.get('tipoRegistro')?.value as TipoRegistroAtendimentoIndividual;
    const assunto = String(control.get('assuntoDoDia')?.value ?? '').trim();
    const observacao = String(control.get('observacao')?.value ?? '').trim();
    if (tipo === 'ATENDIMENTO_REALIZADO' && !assunto) return { assuntoObrigatorio: true };
    if (tipo === 'ATENDIMENTO_REALIZADO' && !observacao) return { observacaoObrigatoria: true };
    if (tipo === 'FALTA_JUSTIFICADA' && !observacao) return { motivoObrigatorio: true };
    return null;
  }

  private errorMessage(): string {
    if (this.form.controls.dataAtendimento.invalid) return 'Informe a data do atendimento.';
    if (this.form.hasError('horarioInvalido')) return 'O horario de fim deve ser posterior ao horario de inicio.';
    if (this.form.controls.duracaoMinutos.invalid) return 'Informe uma duracao entre 1 e 1440 minutos.';
    if (this.form.hasError('assuntoObrigatorio')) return 'Informe o assunto do dia.';
    if (this.form.hasError('observacaoObrigatoria')) return 'Informe a observacao do atendimento.';
    if (this.form.hasError('motivoObrigatorio')) return 'Informe o motivo da falta justificada.';
    return '';
  }

  private normalizarPayload(): CriarAtendimentoIndividualPayload {
    const raw = this.form.getRawValue();
    const payload: CriarAtendimentoIndividualPayload = {
      dataAtendimento: raw.dataAtendimento,
      tipoRegistro: raw.tipoRegistro,
      horaInicio: raw.horaInicio || undefined,
      horaFim: raw.horaFim || undefined,
      duracaoMinutos: raw.duracaoMinutos || undefined,
      modalidade: raw.modalidade || undefined,
      localAtendimento: raw.localAtendimento?.trim() || undefined,
      assuntoDoDia: raw.assuntoDoDia?.trim() || undefined,
      observacao: raw.observacao?.trim() || undefined,
      evolucao: raw.evolucao?.trim() || undefined,
      dificuldades: raw.dificuldades?.trim() || undefined,
      pendencias: raw.pendencias?.trim() || undefined,
      recomendacoes: raw.recomendacoes?.trim() || undefined,
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key as keyof CriarAtendimentoIndividualPayload] === undefined) {
        delete payload[key as keyof CriarAtendimentoIndividualPayload];
      }
    });
    return payload;
  }
}

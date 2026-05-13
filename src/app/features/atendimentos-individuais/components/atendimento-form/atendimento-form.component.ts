import { Component, EventEmitter, Input, OnDestroy, Output, signal } from '@angular/core';
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
  templateUrl: './atendimento-form.component.html',
  styleUrl: './atendimento-form.component.scss',
})
export class AtendimentoFormComponent implements OnDestroy {
  @Input() saving = false;
  @Input() submitLabel = 'Salvar atendimento';
  @Input() set initialValues(v: CriarAtendimentoIndividualPayload | null | undefined) {
    if (v) {
      this.value = v;
      // Marca o form como pristine após pré-carregar para não disparar dirty prematuramente
      this.form.markAsPristine();
    }
  }
  @Output() save = new EventEmitter<CriarAtendimentoIndividualPayload>();
  @Output() cancel = new EventEmitter<void>();
  @Output() formChanged = new EventEmitter<void>();

  error = '';
  readonly passoAtual = signal(1);
  readonly totalPassos = 3;

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
    this.subscriptions.add(
      this.form.valueChanges.subscribe(() => {
        if (this.form.dirty) this.formChanged.emit();
      }),
    );
  }

  get value(): CriarAtendimentoIndividualPayload {
    return this.normalizarPayload();
  }

  set value(payload: CriarAtendimentoIndividualPayload) {
    const dataIso = typeof payload.dataAtendimento === 'string'
      ? payload.dataAtendimento.slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    this.form.patchValue({
      dataAtendimento: dataIso,
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

  avancarPasso(): void {
    // Validate current step before advancing
    this.error = '';
    const step = this.passoAtual();
    if (step === 1) {
      if (this.form.controls.dataAtendimento.invalid) {
        this.error = 'Informe a data do atendimento.';
        return;
      }
      if (this.form.hasError('horarioInvalido')) {
        this.error = 'O horário de fim deve ser posterior ao horário de início.';
        return;
      }
      if (this.form.controls.duracaoMinutos.invalid) {
        this.error = 'Informe uma duração entre 1 e 1440 minutos.';
        return;
      }
    } else if (step === 2) {
      if (this.form.hasError('assuntoObrigatorio')) {
        this.error = 'Informe o assunto do dia.';
        return;
      }
      if (this.form.hasError('observacaoObrigatoria')) {
        this.error = 'Informe a observação do atendimento.';
        return;
      }
      if (this.form.hasError('motivoObrigatorio')) {
        this.error = 'Informe o motivo da falta justificada.';
        return;
      }
    }

    if (step < this.totalPassos) {
      this.passoAtual.set(step + 1);
    }
  }

  voltarPasso(): void {
    this.error = '';
    if (this.passoAtual() > 1) {
      this.passoAtual.set(this.passoAtual() - 1);
    }
  }

  formatarTipoRegistro(tipo: string): string {
    const tipos: Record<string, string> = {
      'ATENDIMENTO_REALIZADO': 'Atendimento realizado',
      'FALTA_JUSTIFICADA': 'Falta justificada',
      'FALTA_NAO_JUSTIFICADA': 'Falta não justificada',
      'CANCELADO': 'Cancelado'
    };
    return tipos[tipo] || tipo;
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

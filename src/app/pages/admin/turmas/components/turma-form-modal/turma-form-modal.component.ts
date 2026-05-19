import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnInit,
  signal,
  OnChanges,
  SimpleChanges,
  inject,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { A11yModule, LiveAnnouncer } from '@angular/cdk/a11y';
import { Turma, CreateTurmaDto } from '../../../../../core/services/turmas.service';
import { ModelosCertificadosService, ModeloCertificado } from '../../../../../core/services/modelos-certificados.service';

const DIAS: { valor: string; label: string }[] = [
  { valor: 'SEG', label: 'Segunda' },
  { valor: 'TER', label: 'Terça' },
  { valor: 'QUA', label: 'Quarta' },
  { valor: 'QUI', label: 'Quinta' },
  { valor: 'SEX', label: 'Sexta' },
  { valor: 'SAB', label: 'Sábado' },
  { valor: 'DOM', label: 'Domingo' },
];

/** Converte data ISO (ou string de data) para formato YYYY-MM-DD esperado pelo input[type=date] */
function isoParaInputDate(valor?: string | null): string {
  if (!valor) return '';
  try {
    return valor.substring(0, 10); // 'YYYY-MM-DD'
  } catch {
    return '';
  }
}

@Component({
  selector: 'app-turma-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, A11yModule],
  templateUrl: './turma-form-modal.component.html',
  styleUrl: '../../turmas-lista/turmas-lista.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TurmaFormModalComponent implements OnInit, OnChanges {
  @Input() aberto = false;
  @Input() professores: { id: string; nome: string; role?: string }[] = [];
  @Input() turmaEdicao: Turma | null = null;
  @Input() salvando = false;
  @Input() erroAPI = '';

  @Output() fechar = new EventEmitter<void>();
  @Output() salvar = new EventEmitter<CreateTurmaDto>();
  @Output() tentarFecharSujo = new EventEmitter<boolean>();

  @ViewChild('erroApiBanner') private erroApiBanner?: ElementRef<HTMLElement>;

  private readonly fb = inject(FormBuilder);
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly modelosService = inject(ModelosCertificadosService);

  turmaForm!: FormGroup;
  modoEdicao = false;

  // Modelos de Certificado
  readonly modelos = signal<ModeloCertificado[]>([]);
  readonly carregandoModelos = signal(false);

  // Grade Horária
  dias = DIAS;
  gradeHoraria = signal<{ dia: string; horaInicio: string; horaFim: string }[]>([]);
  diaNovoTurno = signal<string>('');
  horaInicioNovoTurno = signal<string>('');
  horaFimNovoTurno = signal<string>('');
  erroTurno = signal<string>('');

  gradeOriginalStr = '';

  /** Elemento que abriu o modal — foco retorna a ele ao fechar (WCAG 2.4.3) */
  private lastFocusBeforeModal: HTMLElement | null = null;

  ngOnInit(): void {
    this.iniciarFormulario();
    this.carregarModelos();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['aberto'] && changes['aberto'].currentValue) {
      // WCAG 2.4.3: salva elemento focado antes de abrir o modal
      this.lastFocusBeforeModal = document.activeElement as HTMLElement;

      this.iniciarFormulario();

      if (this.turmaEdicao) {
        this.modoEdicao = true;
        this.turmaForm.patchValue({
          nome: this.turmaEdicao.nome,
          descricao: this.turmaEdicao.descricao ?? '',
          capacidadeMaxima: this.turmaEdicao.capacidadeMaxima ?? null,
          professorId: this.turmaEdicao.professor?.id ?? '',
          dataInicio: isoParaInputDate(this.turmaEdicao.dataInicio),
          dataFim: isoParaInputDate(this.turmaEdicao.dataFim),
          modeloCertificadoId: (this.turmaEdicao as any).modeloCertificadoId ?? '',
        });

        if (this.turmaEdicao.gradeHoraria && this.turmaEdicao.gradeHoraria.length > 0) {
          this.gradeHoraria.set(this.turmaEdicao.gradeHoraria.map(turno => ({
            dia: turno.dia,
            horaInicio: this.minutosParaHmTemplate(turno.horaInicio),
            horaFim: this.minutosParaHmTemplate(turno.horaFim)
          })));
        } else {
          this.gradeHoraria.set([]);
        }
      } else {
        this.modoEdicao = false;
        this.gradeHoraria.set([]);
      }

      this.gradeOriginalStr = JSON.stringify(this.gradeHoraria());
      setTimeout(() => document.getElementById('modalNomeTurma')?.focus(), 100);
    }

    if (changes['erroAPI']?.currentValue) {
      setTimeout(() => this.erroApiBanner?.nativeElement.focus(), 0);
    }
  }

  iniciarFormulario(): void {
    if (!this.turmaForm) {
      this.turmaForm = this.fb.group({
        nome: ['', [Validators.required, Validators.minLength(3)]],
        descricao: [''],
        capacidadeMaxima: [null],
        professorId: ['', Validators.required],
        // Campos de período — usados no cálculo de carga horária no backend
        dataInicio: [''],
        dataFim: [''],
        // Template de certificado (opcional)
        modeloCertificadoId: [''],
      });
    } else {
      this.turmaForm.reset();
    }
    this.erroTurno.set('');
    this.diaNovoTurno.set('');
    this.horaInicioNovoTurno.set('');
    this.horaFimNovoTurno.set('');
  }

  carregarModelos(): void {
    this.carregandoModelos.set(true);
    this.modelosService.listar().subscribe({
      next: (lista) => {
        // Exibe apenas modelos do tipo ACADEMICO — mesma regra do Wizard original
        this.modelos.set(lista.filter(m => m.tipo === 'ACADEMICO'));
        this.carregandoModelos.set(false);
      },
      error: () => {
        this.carregandoModelos.set(false);
      }
    });
  }

  isCampoInvalido(campo: string): boolean {
    const ctrl = this.turmaForm.get(campo);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  labelDia(valor: string): string {
    return this.dias.find(d => d.valor === valor)?.label || valor;
  }

  adicionarTurno() {
    this.erroTurno.set('');
    const dia = this.diaNovoTurno();
    const hIn = this.horaInicioNovoTurno();
    const hFm = this.horaFimNovoTurno();

    if (!dia || !hIn || !hFm) {
      this.erroTurno.set('Preencha o dia, hora de início e hora de fim.');
      return;
    }

    const inicioMin = this.hmParaMinutos(hIn);
    const fimMin = this.hmParaMinutos(hFm);

    if (fimMin <= inicioMin) {
      this.erroTurno.set('A hora de fim deve ser posterior à hora de início.');
      return;
    }

    const grade = this.gradeHoraria();
    if (grade.some(t => t.dia === dia)) {
      this.erroTurno.set('Já existe um turno neste dia. Remova o existente primeiro.');
      return;
    }

    this.gradeHoraria.set([...grade, { dia, horaInicio: hIn, horaFim: hFm }]);

    // WCAG 4.1.3: anuncia turno adicionado ao screen reader
    this.liveAnnouncer.announce(`Turno de ${this.labelDia(dia)} adicionado: ${hIn} às ${hFm}.`);

    this.diaNovoTurno.set('');
    this.horaInicioNovoTurno.set('');
    this.horaFimNovoTurno.set('');
  }

  removerTurno(index: number): void {
    const arr = [...this.gradeHoraria()];
    const turno = arr[index];
    arr.splice(index, 1);
    this.gradeHoraria.set(arr);
    // WCAG 4.1.3: anuncia remoção ao screen reader
    this.liveAnnouncer.announce(`Turno de ${this.labelDia(turno.dia)} removido.`);
  }

  hmParaMinutos(hm: string): number {
    const [h, m] = hm.split(':').map(Number);
    return (h * 60) + m;
  }

  minutosParaHmTemplate(minutos: number): string {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  isFormDirty(): boolean {
    if (!this.turmaForm) return false;
    const gradeDirty = this.gradeOriginalStr !== JSON.stringify(this.gradeHoraria());
    return (this.turmaForm.dirty || gradeDirty) && !this.salvando;
  }

  aoFechar(): void {
    if (this.isFormDirty()) {
      this.tentarFecharSujo.emit(true);
    } else {
      this.fechar.emit();
      // WCAG 2.4.3: restaura foco ao elemento que abriu o modal
      setTimeout(() => this.lastFocusBeforeModal?.focus(), 0);
    }
  }

  submeter() {
    if (this.turmaForm.invalid || this.salvando) {
      this.turmaForm.markAllAsTouched();

      // WCAG 2.4.3: foca o primeiro campo inválido
      setTimeout(() => {
        const firstInvalid = document.querySelector(
          '.modal .form-input.is-invalid, .modal input[aria-invalid="true"], .modal select[aria-invalid="true"]'
        ) as HTMLElement | null;
        firstInvalid?.focus();
      }, 50);
      return;
    }

    const v = this.turmaForm.value;

    const payload: CreateTurmaDto = {
      nome: v.nome,
      descricao: v.descricao || undefined,
      capacidadeMaxima: v.capacidadeMaxima || undefined,
      professorId: v.professorId,
      // Datas do período — o backend calcula cargaHoraria a partir delas e da grade
      dataInicio: v.dataInicio ? new Date(v.dataInicio).toISOString() : undefined,
      dataFim: v.dataFim ? new Date(v.dataFim).toISOString() : undefined,
      modeloCertificadoId: v.modeloCertificadoId || undefined,
      gradeHoraria: this.gradeHoraria().map(h => ({
        dia: h.dia as any,
        horaInicio: this.hmParaMinutos(h.horaInicio),
        horaFim: this.hmParaMinutos(h.horaFim)
      })),
    };

    this.salvar.emit(payload);
  }
}

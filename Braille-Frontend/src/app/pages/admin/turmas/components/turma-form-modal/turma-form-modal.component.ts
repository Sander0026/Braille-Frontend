import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnInit, signal, effect, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { A11yModule } from '@angular/cdk/a11y';
import { Turma, CreateTurmaDto } from '../../../../../core/services/turmas.service';
import { Usuario } from '../../../../../core/services/usuarios.service';

const DIAS: { valor: string; label: string }[] = [
  { valor: 'SEG', label: 'Segunda' },
  { valor: 'TER', label: 'Terça' },
  { valor: 'QUA', label: 'Quarta' },
  { valor: 'QUI', label: 'Quinta' },
  { valor: 'SEX', label: 'Sexta' },
  { valor: 'SAB', label: 'Sábado' },
  { valor: 'DOM', label: 'Domingo' },
];

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
  @Input() professores: Usuario[] = [];
  @Input() turmaEdicao: Turma | null = null;
  @Input() salvando = false;
  @Input() erroAPI = '';

  @Output() fechar = new EventEmitter<void>();
  @Output() salvar = new EventEmitter<CreateTurmaDto>();
  @Output() tentarFecharSujo = new EventEmitter<boolean>(); // Emite 'true' se estiver sujo

  turmaForm!: FormGroup;
  modoEdicao = false;
  
  // Grade
  dias = DIAS;
  gradeHoraria = signal<{ dia: string; horaInicio: string; horaFim: string }[]>([]);
  diaNovoTurno = signal<string>('');
  horaInicioNovoTurno = signal<string>('');
  horaFimNovoTurno = signal<string>('');
  erroTurno = signal<string>('');

  gradeOriginalStr = '';

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.iniciarFormulario();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['aberto'] && changes['aberto'].currentValue) {
        // Ao abrir, inicializa ou patching
        this.iniciarFormulario();
        
        if (this.turmaEdicao) {
            this.modoEdicao = true;
            this.turmaForm.patchValue({
                nome: this.turmaEdicao.nome,
                descricao: this.turmaEdicao.descricao ?? '',
                capacidadeMaxima: this.turmaEdicao.capacidadeMaxima ?? null,
                professorId: this.turmaEdicao.professor?.id ?? '',
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
  }

  iniciarFormulario(): void {
    if (!this.turmaForm) {
      this.turmaForm = this.fb.group({
        nome: ['', [Validators.required, Validators.minLength(3)]],
        descricao: [''],
        capacidadeMaxima: [null],
        professorId: ['', Validators.required],
      });
    } else {
      this.turmaForm.reset();
    }
    this.erroTurno.set('');
    this.diaNovoTurno.set('');
    this.horaInicioNovoTurno.set('');
    this.horaFimNovoTurno.set('');
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
    
    // Limpar os campos apos insercao
    this.diaNovoTurno.set('');
    this.horaInicioNovoTurno.set('');
    this.horaFimNovoTurno.set('');
  }

  removerTurno(index: number) {
    const arr = [...this.gradeHoraria()];
    arr.splice(index, 1);
    this.gradeHoraria.set(arr);
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

  aoFechar() {
    const gradeDirty = this.gradeOriginalStr !== JSON.stringify(this.gradeHoraria());
    if ((this.turmaForm.dirty || gradeDirty) && !this.salvando) {
      this.tentarFecharSujo.emit(true);
    } else {
      this.fechar.emit();
    }
  }

  submeter() {
    if (this.turmaForm.invalid || this.salvando) {
      this.turmaForm.markAllAsTouched();
      return;
    }

    const payload: CreateTurmaDto = {
      nome: this.turmaForm.value.nome,
      descricao: this.turmaForm.value.descricao,
      capacidadeMaxima: this.turmaForm.value.capacidadeMaxima || undefined,
      professorId: this.turmaForm.value.professorId,
      gradeHoraria: this.gradeHoraria().map(h => ({
        dia: h.dia as any,
        horaInicio: this.hmParaMinutos(h.horaInicio),
        horaFim: this.hmParaMinutos(h.horaFim)
      })),
    };

    this.salvar.emit(payload);
  }
}

import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TurmasService, CreateTurmaDto, GradeHorariaDto } from '../../../../core/services/turmas.service';
import { UsuariosService, Usuario } from '../../../../core/services/usuarios.service';
import { ModelosCertificadosService, ModeloCertificado } from '../../../../core/services/modelos-certificados.service';
import { BaseFormDescarte } from '../../../../shared/classes/base-form-descarte';

/** Dias da semana para o seletor de grade horária */
const DIAS: { valor: string; label: string }[] = [
    { valor: 'SEG', label: 'Segunda' },
    { valor: 'TER', label: 'Terça'   },
    { valor: 'QUA', label: 'Quarta'  },
    { valor: 'QUI', label: 'Quinta'  },
    { valor: 'SEX', label: 'Sexta'   },
    { valor: 'SAB', label: 'Sábado'  },
    { valor: 'DOM', label: 'Domingo' },
];

/** Mapa de rótulos de etapa para anúncios de screen reader */
const ETAPA_LABELS: Record<number, string> = {
    1: 'Dados Básicos',
    2: 'Grade Horária',
};

@Component({
    selector: 'app-cadastro-turma-wizard',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
    templateUrl: './cadastro-turma-wizard.html',
    styleUrls: ['./cadastro-turma-wizard.scss'],
})
export class CadastroTurmaWizard extends BaseFormDescarte implements OnInit, AfterViewInit {

    etapaAtual   = 1;
    totalEtapas  = 2;
    formTurma!: FormGroup;
    isSalvando   = false;
    mensagemFeedback: string | null = null;
    tipoFeedback: 'sucesso' | 'erro' | null = null;

    professores: Usuario[] = [];
    carregandoProfessores = false;

    modelosAcademicos: ModeloCertificado[] = [];
    carregandoModelos = false;

    dias = DIAS;
    gradeHoraria: { dia: string; horaInicio: string; horaFim: string }[] = [];

    diaNovoTurno        = '';
    horaInicioNovoTurno = '';
    horaFimNovoTurno    = '';
    erroTurno           = '';

    /** Referência ao primeiro input da etapa 1 para foco após erro de validação (WCAG 2.4.3) */
    @ViewChild('primeiroInputEtapa1') primeiroInputEtapa1!: ElementRef<HTMLInputElement>;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private turmasService: TurmasService,
        private usuariosService: UsuariosService,
        private modelosService: ModelosCertificadosService,
        private cdr: ChangeDetectorRef,
        /** LiveAnnouncer do Angular CDK — anuncia mudanças de etapa para screen readers (WCAG 4.1.3) */
        private liveAnnouncer: LiveAnnouncer,
    ) { super(); }

    isFormDirty(): boolean {
        return (!!this.formTurma?.dirty || this.gradeHoraria.length > 0) && !this.isSalvando;
    }

    ngOnInit(): void {
        this.formTurma = this.fb.group({
            nome:                 ['', Validators.required],
            professorId:          ['', Validators.required],
            descricao:            [''],
            capacidadeMaxima:     [null],
            cargaHoraria:         [''],
            dataInicio:           [''],
            dataFim:              [''],
            modeloCertificadoId:  [''],
        });

        this.carregarProfessores();
        this.carregarModelosAcademicos();
    }

    ngAfterViewInit(): void {}

    carregarProfessores(): void {
        this.carregandoProfessores = true;
        this.usuariosService.listar(1, 100, undefined, false, 'PROFESSOR').subscribe({
            next: (resp) => {
                this.professores          = resp.data;
                this.carregandoProfessores = false;
            },
            error: () => { this.carregandoProfessores = false; }
        });
    }

    carregarModelosAcademicos(): void {
        this.carregandoModelos = true;
        this.modelosService.listar().subscribe({
            next: (modelos) => {
                this.modelosAcademicos = modelos.filter(m => m.tipo === 'ACADEMICO');
                this.carregandoModelos = false;
                this.cdr.markForCheck();
            },
            error: () => { this.carregandoModelos = false; }
        });
    }

    // ─── Grade Horária ───────────────────────────────────────────────────────

    adicionarTurno(): void {
        this.erroTurno = '';

        if (!this.diaNovoTurno || !this.horaInicioNovoTurno || !this.horaFimNovoTurno) {
            this.erroTurno = 'Preencha o dia, hora de início e hora de fim.';
            return;
        }

        const inicioMin = this.hmParaMinutos(this.horaInicioNovoTurno);
        const fimMin    = this.hmParaMinutos(this.horaFimNovoTurno);

        if (fimMin <= inicioMin) {
            this.erroTurno = 'A hora de fim deve ser posterior à hora de início.';
            return;
        }

        if (this.gradeHoraria.some(t => t.dia === this.diaNovoTurno)) {
            this.erroTurno = 'Já existe um turno cadastrado para este dia.';
            return;
        }

        this.gradeHoraria.push({
            dia:        this.diaNovoTurno,
            horaInicio: this.horaInicioNovoTurno,
            horaFim:    this.horaFimNovoTurno,
        });

        this.diaNovoTurno        = '';
        this.horaInicioNovoTurno = '';
        this.horaFimNovoTurno    = '';

        this.liveAnnouncer.announce(`Turno adicionado. Total de ${this.gradeHoraria.length} turno(s) na grade.`);
    }

    removerTurno(index: number): void {
        const turno = this.gradeHoraria[index];
        this.gradeHoraria.splice(index, 1);
        this.liveAnnouncer.announce(`Turno de ${this.labelDia(turno.dia)} removido.`);
    }

    labelDia(valor: string): string {
        return this.dias.find(d => d.valor === valor)?.label ?? valor;
    }

    hmParaMinutos(hm: string): number {
        const [h, m] = hm.split(':').map(Number);
        return h * 60 + m;
    }

    // ─── Navegação ───────────────────────────────────────────────────────────

    proximaEtapa(): void {
        if (this.etapaAtual !== 1) return;

        const campos1 = ['nome', 'professorId'];
        const primeiroInvalido = campos1.find(c => this.formTurma.get(c)?.invalid);

        if (primeiroInvalido) {
            this.formTurma.markAllAsTouched();
            this.cdr.detectChanges();

            // WCAG 2.4.3: move o foco para o primeiro campo inválido
            setTimeout(() => {
                const el = document.getElementById(
                    primeiroInvalido === 'nome' ? 'input-nome' : 'input-professor'
                ) as HTMLElement | null;
                el?.focus();
            });
            return;
        }

        this.etapaAtual = 2;
        // WCAG 4.1.3: anuncia a nova etapa para screen readers
        this.liveAnnouncer.announce(`Passo 2 de ${this.totalEtapas}: ${ETAPA_LABELS[2]}.`);
    }

    etapaAnterior(): void {
        if (this.etapaAtual > 1) {
            this.etapaAtual--;
            this.liveAnnouncer.announce(`Passo ${this.etapaAtual} de ${this.totalEtapas}: ${ETAPA_LABELS[this.etapaAtual]}.`);
        }
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.formTurma.get(fieldName);
        return !!(field && field.invalid && (field.dirty || field.touched));
    }

    // ─── Submit ──────────────────────────────────────────────────────────────

    finalizarCadastro(): void {
        if (this.isSalvando) return;

        if (this.formTurma.invalid) {
            this.formTurma.markAllAsTouched();
            this.mostrarFeedback('Preencha os campos obrigatórios da etapa 1.', 'erro');
            return;
        }

        this.isSalvando = true;
        const v = this.formTurma.value;

        const gradeConvertida: GradeHorariaDto[] = this.gradeHoraria.map(t => ({
            dia:        t.dia as any,
            horaInicio: this.hmParaMinutos(t.horaInicio),
            horaFim:    this.hmParaMinutos(t.horaFim),
        }));

        const payload: CreateTurmaDto = {
            nome:                v.nome,
            professorId:         v.professorId,
            descricao:           v.descricao || undefined,
            capacidadeMaxima:    v.capacidadeMaxima ? +v.capacidadeMaxima : undefined,
            modeloCertificadoId: v.modeloCertificadoId || undefined,
            gradeHoraria:        gradeConvertida.length ? gradeConvertida : undefined,
            dataInicio:          v.dataInicio ? new Date(v.dataInicio).toISOString() : undefined,
            dataFim:             v.dataFim    ? new Date(v.dataFim).toISOString()    : undefined,
        };

        this.turmasService.criar(payload).subscribe({
            next: () => {
                this.isSalvando = false;
                this.formTurma.reset();
                this.mostrarFeedback('Turma cadastrada com sucesso!', 'sucesso');
                setTimeout(() => this.router.navigate(['/admin/turmas']), 2000);
            },
            error: (err: HttpErrorResponse) => {
                this.isSalvando = false;
                let msg = 'Erro ao salvar. Tente novamente.';
                if (err.status === 400 && err.error?.message) {
                    msg = Array.isArray(err.error.message)
                        ? err.error.message.join(', ')
                        : err.error.message;
                }
                this.mostrarFeedback(msg, 'erro');
            },
        });
    }

    mostrarFeedback(mensagem: string, tipo: 'sucesso' | 'erro'): void {
        this.mensagemFeedback = mensagem;
        this.tipoFeedback     = tipo;

        this.cdr.detectChanges();
        window.scrollTo({ top: 0, behavior: 'smooth' });

        setTimeout(() => {
            this.mensagemFeedback = null;
            this.tipoFeedback     = null;
            this.cdr.detectChanges();
        }, 6000);
    }
}

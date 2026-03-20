import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';

import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { TurmasService, CreateTurmaDto, GradeHorariaDto } from '../../../../core/services/turmas.service';
import { UsuariosService, Usuario } from '../../../../core/services/usuarios.service';
import { BaseFormDescarte } from '../../../../shared/classes/base-form-descarte';

/** Dias da semana para o seletor de grade horária */
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
    selector: 'app-cadastro-turma-wizard',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],

    templateUrl: './cadastro-turma-wizard.html',
    styleUrls: ['./cadastro-turma-wizard.scss']
})
export class CadastroTurmaWizard extends BaseFormDescarte implements OnInit {

    etapaAtual = 1;
    totalEtapas = 2;
    formTurma!: FormGroup;
    isSalvando = false;
    mensagemFeedback: string | null = null;
    tipoFeedback: 'sucesso' | 'erro' | null = null;

    // Lista de professores carregada da API
    professores: Usuario[] = [];
    carregandoProfessores = false;

    // Grade horária — estrutura auxiliar gerenciada na UI
    dias = DIAS;

    /** Turnos adicionados pelo usuário: { dia, horaInicio (HH:mm string), horaFim (HH:mm string) } */
    gradeHoraria: { dia: string; horaInicio: string; horaFim: string }[] = [];

    // Formulário do novo turno (inline — não faz parte do formTurma principal)
    diaNovoTurno = '';
    horaInicioNovoTurno = '';
    horaFimNovoTurno = '';
    erroTurno = '';

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private turmasService: TurmasService,
        private usuariosService: UsuariosService,
        private cdr: ChangeDetectorRef
    ) { 
        super();
    }

    isFormDirty(): boolean {
        // Retorna true se o form principal estiver dirty, ou se houver turnos adicionados mas não salvos
        const isFormDirty = !!this.formTurma?.dirty;
        const hasTurnos = this.gradeHoraria.length > 0;
        return (isFormDirty || hasTurnos) && !this.isSalvando;
    }

    ngOnInit(): void {
        this.formTurma = this.fb.group({
            nome: ['', Validators.required],
            professorId: ['', Validators.required],
            descricao: [''],
            capacidadeMaxima: [null],
        });

        this.carregarProfessores();
    }

    carregarProfessores() {
        this.carregandoProfessores = true;
        // Puxa toda a base (até 100), porém filtrando apenas quem tem o ROLE 'PROFESSOR'
        this.usuariosService.listar(1, 100, undefined, false, 'PROFESSOR').subscribe({
            next: (resp) => {
                this.professores = resp.data;
                this.carregandoProfessores = false;
            },
            error: () => { this.carregandoProfessores = false; }
        });
    }

    // ─── Grade Horária ─────────────────────────────────────────────────
    adicionarTurno() {
        this.erroTurno = '';

        if (!this.diaNovoTurno || !this.horaInicioNovoTurno || !this.horaFimNovoTurno) {
            this.erroTurno = 'Preencha o dia, hora de início e hora de fim.';
            return;
        }

        const inicioMin = this.hmParaMinutos(this.horaInicioNovoTurno);
        const fimMin = this.hmParaMinutos(this.horaFimNovoTurno);

        if (fimMin <= inicioMin) {
            this.erroTurno = 'A hora de fim deve ser posterior à hora de início.';
            return;
        }

        // Impede dois turnos no mesmo dia
        const jaTem = this.gradeHoraria.some(t => t.dia === this.diaNovoTurno);
        if (jaTem) {
            this.erroTurno = 'Já existe um turno cadastrado para este dia.';
            return;
        }

        this.gradeHoraria.push({
            dia: this.diaNovoTurno,
            horaInicio: this.horaInicioNovoTurno,
            horaFim: this.horaFimNovoTurno,
        });

        // Limpar campos do novo turno
        this.diaNovoTurno = '';
        this.horaInicioNovoTurno = '';
        this.horaFimNovoTurno = '';
    }

    removerTurno(index: number) {
        this.gradeHoraria.splice(index, 1);
    }

    labelDia(valor: string): string {
        return this.dias.find(d => d.valor === valor)?.label ?? valor;
    }

    hmParaMinutos(hm: string): number {
        const [h, m] = hm.split(':').map(Number);
        return h * 60 + m;
    }

    // ─── Navegação ─────────────────────────────────────────────────────
    proximaEtapa() {
        if (this.etapaAtual === 1) {
            const campos1 = ['nome', 'professorId'];
            const grupo1Invalido = campos1.some(c => this.formTurma.get(c)?.invalid);
            if (grupo1Invalido) {
                this.formTurma.markAllAsTouched();
                return;
            }
            this.etapaAtual = 2;
        }
    }

    etapaAnterior() {
        if (this.etapaAtual > 1) this.etapaAtual--;
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.formTurma.get(fieldName);
        return !!(field && field.invalid && (field.dirty || field.touched));
    }

    // ─── Submit ────────────────────────────────────────────────────────
    finalizarCadastro() {
        if (this.isSalvando) return;
        if (this.formTurma.invalid) {
            this.formTurma.markAllAsTouched();
            this.mostrarFeedback('Preencha os campos obrigatórios da etapa 1.', 'erro');
            return;
        }

        this.isSalvando = true;
        const v = this.formTurma.value;

        const gradeConvertida: GradeHorariaDto[] = this.gradeHoraria.map(t => ({
            dia: t.dia as any,
            horaInicio: this.hmParaMinutos(t.horaInicio),
            horaFim: this.hmParaMinutos(t.horaFim),
        }));

        const payload: CreateTurmaDto = {
            nome: v.nome,
            professorId: v.professorId,
            descricao: v.descricao || undefined,
            capacidadeMaxima: v.capacidadeMaxima ? +v.capacidadeMaxima : undefined,
            gradeHoraria: gradeConvertida.length ? gradeConvertida : undefined,
        };

        this.turmasService.criar(payload).subscribe({
            next: () => {
                this.isSalvando = false;
                this.mostrarFeedback('Turma cadastrada com sucesso!', 'sucesso');
                setTimeout(() => this.router.navigate(['/admin/turmas']), 2000);
            },
            error: (err: HttpErrorResponse) => {
                this.isSalvando = false;
                
                // O backend pode retornar um array (validação de schema) ou string simples (regra de colisão)
                let msg = 'Erro ao salvar. Tente novamente.';
                if (err.status === 400 && err.error?.message) {
                    msg = Array.isArray(err.error.message) ? err.error.message.join(', ') : err.error.message;
                }
                
                this.mostrarFeedback(msg, 'erro');
            },
        });
    }

    mostrarFeedback(mensagem: string, tipo: 'sucesso' | 'erro') {
        this.mensagemFeedback = mensagem;
        this.tipoFeedback = tipo;
        
        // Força a atualização da tela, vital quando chamadas saem fora da zona do Angular.
        this.cdr.detectChanges();
        
        // Rola a tela para garantir que o usuário veja a faixa de erro/sucesso.
        window.scrollTo({ top: 0, behavior: 'smooth' });

        setTimeout(() => { 
            this.mensagemFeedback = null; 
            this.tipoFeedback = null; 
            this.cdr.detectChanges();
        }, 6000);
    }
}

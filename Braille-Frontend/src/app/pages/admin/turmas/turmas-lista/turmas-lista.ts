import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { TurmasService, Turma, CreateTurmaDto } from '../../../../core/services/turmas.service';
import { UsuariosService, Usuario } from '../../../../core/services/usuarios.service';

@Component({
    selector: 'app-turmas-lista',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './turmas-lista.html',
    styleUrl: './turmas-lista.scss',
})
export class TurmasLista implements OnInit {

    // ── Lista ──────────────────────────────────────────────────
    turmas: Turma[] = [];
    isLoading = true;
    erro = '';
    totalTurmas = 0;
    paginaAtual = 1;

    // ── Professores (para o dropdown) ──────────────────────────
    professores: Usuario[] = [];

    // ── Modal Criar/Editar ─────────────────────────────────────
    modalAberto = false;
    modoEdicao = false;
    turmaEmEdicaoId = '';
    salvandoModal = false;
    erroModal = '';
    turmaForm!: FormGroup;

    // ── Modal Excluir ──────────────────────────────────────────
    modalExcluirAberto = false;
    turmaParaExcluir: Turma | null = null;
    excluindo = false;
    erroExclusao = '';

    // ── Modal Alunos ───────────────────────────────────────────
    modalAlunosAberto = false;
    turmaDetalhes: Turma | null = null;
    carregandoDetalhes = false;

    constructor(
        private turmasService: TurmasService,
        private usuariosService: UsuariosService,
        private fb: FormBuilder,
        private cdr: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        this.iniciarFormulario();
        this.carregarTurmas();
        this.carregarProfessores();
    }

    // ── Formulário ─────────────────────────────────────────────
    iniciarFormulario(): void {
        this.turmaForm = this.fb.group({
            nome: ['', [Validators.required, Validators.minLength(3)]],
            descricao: [''],
            horario: [''],
            professorId: ['', Validators.required],
        });
    }

    get f() { return this.turmaForm.controls; }

    isCampoInvalido(campo: string): boolean {
        const ctrl = this.turmaForm.get(campo);
        return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
    }

    // ── Carregamentos ──────────────────────────────────────────
    carregarTurmas(pagina = 1): void {
        this.isLoading = true;
        this.erro = '';
        this.paginaAtual = pagina;

        this.turmasService.listar(pagina, 12).subscribe({
            next: (res) => {
                this.turmas = res.data;
                this.totalTurmas = res.meta.total;
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.erro = 'Não foi possível carregar as turmas. Verifique se o servidor está online.';
                this.isLoading = false;
                this.cdr.detectChanges();
            },
        });
    }

    carregarProfessores(): void {
        this.usuariosService.listar(1, 100).subscribe({
            next: (res) => {
                // Só professores e admins podem ser responsáveis por turma
                this.professores = res.data.filter(u =>
                    u.role === 'PROFESSOR' || u.role === 'ADMIN'
                );
            },
            error: () => { /* silencioso — dropdown mostrará vazio */ },
        });
    }

    // ── Modal Criar ────────────────────────────────────────────
    abrirModalCriar(): void {
        this.modoEdicao = false;
        this.turmaEmEdicaoId = '';
        this.erroModal = '';
        this.turmaForm.reset();
        this.modalAberto = true;
        setTimeout(() => document.getElementById('modalNomeTurma')?.focus(), 100);
    }

    // ── Modal Editar ───────────────────────────────────────────
    abrirModalEditar(turma: Turma): void {
        this.modoEdicao = true;
        this.turmaEmEdicaoId = turma.id;
        this.erroModal = '';

        this.turmaForm.patchValue({
            nome: turma.nome,
            descricao: turma.descricao ?? '',
            horario: turma.horario ?? '',
            professorId: turma.professor?.id ?? '',
        });

        this.modalAberto = true;
        setTimeout(() => document.getElementById('modalNomeTurma')?.focus(), 100);
    }

    fecharModal(): void {
        this.modalAberto = false;
        this.erroModal = '';
        this.turmaForm.reset();
    }

    salvarModal(): void {
        if (this.turmaForm.invalid || this.salvandoModal) {
            this.turmaForm.markAllAsTouched();
            return;
        }

        this.salvandoModal = true;
        this.erroModal = '';

        const dados: CreateTurmaDto = this.turmaForm.value;

        const operacao$ = this.modoEdicao
            ? this.turmasService.atualizar(this.turmaEmEdicaoId, dados)
            : this.turmasService.criar(dados);

        operacao$.subscribe({
            next: () => {
                this.fecharModal();
                this.salvandoModal = false;
                this.carregarTurmas(this.paginaAtual);
            },
            error: (err: { status: number; error?: { message?: string } }) => {
                this.salvandoModal = false;
                this.erroModal = err.status === 409
                    ? 'Já existe uma turma com este nome.'
                    : (err.error?.message ?? 'Erro ao salvar. Tente novamente.');
                this.cdr.detectChanges();
            },
        });
    }

    // ── Modal Excluir ──────────────────────────────────────────
    abrirModalExcluir(turma: Turma): void {
        this.turmaParaExcluir = turma;
        this.erroExclusao = '';
        this.modalExcluirAberto = true;
    }

    fecharModalExcluir(): void {
        this.modalExcluirAberto = false;
        this.turmaParaExcluir = null;
        this.erroExclusao = '';
    }

    confirmarExclusao(): void {
        if (!this.turmaParaExcluir || this.excluindo) return;

        this.excluindo = true;
        this.erroExclusao = '';

        this.turmasService.excluir(this.turmaParaExcluir.id).subscribe({
            next: () => {
                this.excluindo = false;
                this.fecharModalExcluir();
                this.carregarTurmas(this.paginaAtual);
            },
            error: (err: { error?: { message?: string } }) => {
                this.excluindo = false;
                this.erroExclusao = err.error?.message ?? 'Não foi possível excluir a turma.';
                this.cdr.detectChanges();
            },
        });
    }

    // ── Modal Alunos ───────────────────────────────────────────
    verAlunos(turma: Turma): void {
        this.turmaDetalhes = null;
        this.carregandoDetalhes = true;
        this.modalAlunosAberto = true;

        this.turmasService.buscarPorId(turma.id).subscribe({
            next: (t) => {
                this.turmaDetalhes = t;
                this.carregandoDetalhes = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.carregandoDetalhes = false;
                this.cdr.detectChanges();
            },
        });
    }

    fecharModalAlunos(): void {
        this.modalAlunosAberto = false;
        this.turmaDetalhes = null;
    }

    // ── Paginação ──────────────────────────────────────────────
    readonly Math = Math;

    get totalPaginas(): number {
        return Math.ceil(this.totalTurmas / 12);
    }

    paginaAnterior(): void {
        if (this.paginaAtual > 1) this.carregarTurmas(this.paginaAtual - 1);
    }

    proximaPagina(): void {
        if (this.paginaAtual < this.totalPaginas) this.carregarTurmas(this.paginaAtual + 1);
    }

    // ── Utilitários ────────────────────────────────────────────
    trackById(_: number, item: { id: string }): string {
        return item.id;
    }
}

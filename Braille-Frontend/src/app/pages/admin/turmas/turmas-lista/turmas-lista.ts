import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { TurmasService, Turma, CreateTurmaDto } from '../../../../core/services/turmas.service';
import { UsuariosService, Usuario } from '../../../../core/services/usuarios.service';
import { BeneficiariosService, Beneficiario } from '../../../../core/services/beneficiarios.service';

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
    abaAtual: 'ativas' | 'arquivadas' = 'ativas';

    // ── Professores (para o dropdown) ──────────────────────────
    professores: Usuario[] = [];

    // ── Modal Criar/Editar ─────────────────────────────────────
    modalAberto = false;
    modoEdicao = false;
    turmaEmEdicaoId = '';
    salvandoModal = false;
    erroModal = '';
    turmaForm!: FormGroup;

    // ── Modal Arquivar ──────────────────────────────────────────
    modalArquivarAberto = false;
    turmaParaArquivar: Turma | null = null;
    arquivando = false;
    erroArquivamento = '';

    // ── Modal Alunos ───────────────────────────────────────────
    modalAlunosAberto = false;
    modalAlunosAbaAtual: 'adicionar' | 'remover' = 'adicionar';
    turmaDetalhes: Turma | null = null;
    carregandoDetalhes = false;
    buscaAlunoCtrl = new FormControl('');
    alunosBuscaRestado: Beneficiario[] = [];
    alunosSelecionadosParaMatricula: string[] = [];
    buscandoAlunos = false;
    operacaoEmProgresso = false;

    constructor(
        private turmasService: TurmasService,
        private usuariosService: UsuariosService,
        private beneficiariosService: BeneficiariosService,
        private fb: FormBuilder,
        private cdr: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        this.iniciarFormulario();
        this.iniciarBuscaAlunos();
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

    get turmasFiltradas(): Turma[] {
        return this.turmas.filter(t => this.abaAtual === 'ativas' ? t.statusAtivo : !t.statusAtivo);
    }

    alterarAba(aba: 'ativas' | 'arquivadas'): void {
        this.abaAtual = aba;
        this.paginaAtual = 1;
    }

    // ── Carregamentos ──────────────────────────────────────────
    carregarTurmas(pagina = 1): void {
        this.isLoading = true;
        this.erro = '';
        this.paginaAtual = pagina;

        this.turmasService.listar(pagina, 100).subscribe({
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

    // ── Modal Arquivar ──────────────────────────────────────────
    abrirModalArquivar(turma: Turma): void {
        this.turmaParaArquivar = turma;
        this.erroArquivamento = '';
        this.modalArquivarAberto = true;
    }

    fecharModalArquivar(): void {
        this.modalArquivarAberto = false;
        this.turmaParaArquivar = null;
        this.erroArquivamento = '';
    }

    confirmarArquivamento(): void {
        if (!this.turmaParaArquivar || this.arquivando) return;

        this.arquivando = true;
        this.erroArquivamento = '';

        this.turmasService.atualizar(this.turmaParaArquivar.id, { statusAtivo: false } as any).subscribe({
            next: () => {
                this.arquivando = false;
                this.fecharModalArquivar();
                this.carregarTurmas(this.paginaAtual);
            },
            error: (err: { error?: { message?: string } }) => {
                this.arquivando = false;
                this.erroArquivamento = err.error?.message ?? 'Não foi possível arquivar a turma.';
                this.cdr.detectChanges();
            },
        });
    }

    restaurarTurma(turma: Turma): void {
        if (!confirm(`Deseja restaurar a oficina ${turma.nome}?`)) return;

        this.turmasService.atualizar(turma.id, { statusAtivo: true } as any).subscribe({
            next: () => {
                this.carregarTurmas(this.paginaAtual);
            },
            error: () => {
                alert('Não foi possível restaurar a oficina.');
            }
        });
    }

    // ── Modal Alunos ───────────────────────────────────────────
    alterarAbaModalAlunos(aba: 'adicionar' | 'remover'): void {
        this.modalAlunosAbaAtual = aba;
        if (aba === 'adicionar') {
            this.buscaAlunoCtrl.setValue('', { emitEvent: false });
            this.buscarAlunosParaMatricula('');
        }
    }

    verAlunos(turma: Turma): void {
        this.turmaDetalhes = null;
        this.carregandoDetalhes = true;
        this.modalAlunosAberto = true;
        this.modalAlunosAbaAtual = 'adicionar';
        this.buscaAlunoCtrl.setValue('', { emitEvent: false }); // Limpa a busca anterior
        this.alunosBuscaRestado = [];
        this.alunosSelecionadosParaMatricula = [];

        this.turmasService.buscarPorId(turma.id).subscribe({
            next: (t) => {
                this.turmaDetalhes = t;
                this.carregandoDetalhes = false;
                this.buscarAlunosParaMatricula('');
                this.cdr.detectChanges();
            },
            error: () => {
                this.carregandoDetalhes = false;
                this.cdr.detectChanges();
            },
        });
    }

    iniciarBuscaAlunos(): void {
        this.buscaAlunoCtrl.valueChanges
            .pipe(
                debounceTime(400),
                distinctUntilChanged()
            )
            .subscribe((termo) => {
                this.buscarAlunosParaMatricula(termo || '');
            });
    }

    buscarAlunosParaMatricula(termo: string): void {
        this.buscandoAlunos = true;
        this.cdr.detectChanges();

        this.beneficiariosService.listar(1, 100, termo).subscribe({
            next: (res) => {
                // Filtra os alunos que já estão matriculados
                const IDsMatriculados = this.turmaDetalhes?.alunos?.map(a => a.id) || [];
                this.alunosBuscaRestado = res.data.filter(a => !IDsMatriculados.includes(a.id));
                this.buscandoAlunos = false;

                // Remove seleções de alunos que não estão mais na busca local 
                // (opcional, mas garante que não salve alunos que não vê na busca, se buscar de novo)
                this.alunosSelecionadosParaMatricula = this.alunosSelecionadosParaMatricula.filter(id =>
                    this.alunosBuscaRestado.some(a => a.id === id)
                );

                this.cdr.detectChanges();
            },
            error: () => {
                this.buscandoAlunos = false;
                this.cdr.detectChanges();
            }
        });
    }

    toggleSelecaoAluno(alunoId: string): void {
        const index = this.alunosSelecionadosParaMatricula.indexOf(alunoId);
        if (index > -1) {
            this.alunosSelecionadosParaMatricula.splice(index, 1);
        } else {
            this.alunosSelecionadosParaMatricula.push(alunoId);
        }
    }

    salvarMatriculasEmLote(): void {
        if (!this.turmaDetalhes || this.operacaoEmProgresso || this.alunosSelecionadosParaMatricula.length === 0) return;
        this.operacaoEmProgresso = true;

        const idsParaMatricular = [...this.alunosSelecionadosParaMatricula];
        let concluidos = 0;
        let erros = 0;

        // Requisições sequenciais para matricular os alunos usando a API atual que matricula um por um
        const processarProximo = () => {
            if (concluidos + erros === idsParaMatricular.length) {
                this.operacaoEmProgresso = false;
                this.alunosSelecionadosParaMatricula = [];
                // Recarregar os detalhes da turma para pegar a lista atualizada do backend
                this.turmasService.buscarPorId(this.turmaDetalhes!.id).subscribe((t) => {
                    this.turmaDetalhes = t;
                    // Retira da listagem local de pesquisa os que acabaram de ser adicionados
                    this.alunosBuscaRestado = this.alunosBuscaRestado.filter(a => !idsParaMatricular.includes(a.id));

                    if (erros > 0) {
                        alert(`Processo concluído: ${concluidos} adicionados, ${erros} falharam.`);
                    }
                    this.cdr.detectChanges();
                });
                return;
            }

            const alunoId = idsParaMatricular[concluidos + erros];
            this.turmasService.matricularAluno(this.turmaDetalhes!.id, alunoId).subscribe({
                next: () => {
                    concluidos++;
                    processarProximo();
                },
                error: () => {
                    erros++;
                    processarProximo();
                }
            });
        };

        processarProximo();
    }

    adicionarAluno(aluno: Beneficiario): void {
        if (!this.turmaDetalhes || this.operacaoEmProgresso) return;
        this.operacaoEmProgresso = true;

        this.turmasService.matricularAluno(this.turmaDetalhes.id, aluno.id).subscribe({
            next: (turmaAtualizada) => {
                // Atualiza a visualização local para refletir a nova matrícula
                this.turmaDetalhes!.alunos = turmaAtualizada.alunos;
                // Retira da listagem de resultados de busca
                this.alunosBuscaRestado = this.alunosBuscaRestado.filter(a => a.id !== aluno.id);
                this.operacaoEmProgresso = false;
                this.cdr.detectChanges();
            },
            error: () => {
                alert('Falha ao adicionar aluno. Verifique se ele já não está matriculado na turma.');
                this.operacaoEmProgresso = false;
                this.cdr.detectChanges();
            }
        });
    }

    removerAluno(alunoId: string, nome: string): void {
        if (!this.turmaDetalhes || this.operacaoEmProgresso) return;

        if (!confirm(`Remover permanentemente o aluno ${nome} desta oficina?`)) return;

        this.operacaoEmProgresso = true;

        this.turmasService.desmatricularAluno(this.turmaDetalhes.id, alunoId).subscribe({
            next: (turmaAtualizada) => {
                // Atualiza a visualização local para refletir a remoção
                this.turmaDetalhes!.alunos = turmaAtualizada.alunos;
                this.operacaoEmProgresso = false;
                this.cdr.detectChanges();
            },
            error: () => {
                alert('Falha ao remover o aluno da oficina.');
                this.operacaoEmProgresso = false;
                this.cdr.detectChanges();
            }
        });
    }

    fecharModalAlunos(): void {
        this.modalAlunosAberto = false;
        this.turmaDetalhes = null;
        this.buscaAlunoCtrl.setValue('');
        this.alunosBuscaRestado = [];
        this.alunosSelecionadosParaMatricula = [];
    }

    // ── Paginação ──────────────────────────────────────────────
    readonly Math = Math;

    get totalPaginas(): number {
        return Math.ceil(this.totalTurmas / 100);
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

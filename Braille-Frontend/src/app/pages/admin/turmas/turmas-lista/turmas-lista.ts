import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';


import { TurmasService, Turma, CreateTurmaDto } from '../../../../core/services/turmas.service';
import { UsuariosService, Usuario } from '../../../../core/services/usuarios.service';
import { BeneficiariosService, Beneficiario } from '../../../../core/services/beneficiarios.service';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-turmas-lista',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],

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

    // ── Filtros e Busca ─────────────────────────────────────────
    buscaCtrl = new FormControl('');
    drawerAberto = false;
    filterForm!: FormGroup;
    private destroy$ = new Subject<void>();

    // ── Permissões ─────────────────────────────────────────────
    isProfessor = false;
    userId = '';

    constructor(
        private turmasService: TurmasService,
        private usuariosService: UsuariosService,
        private beneficiariosService: BeneficiariosService,
        private fb: FormBuilder,
        private cdr: ChangeDetectorRef,
        private confirmDialog: ConfirmDialogService,
        private authService: AuthService,
        private toast: ToastService,
        private router: Router,
    ) { }


    ngOnInit(): void {
        this.iniciarFormularios();

        // Inscreve a barra de busca p/ ativar o filtro com debounce
        this.buscaCtrl.valueChanges.pipe(
            debounceTime(400),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.paginaAtual = 1;
            this.carregarTurmas();
        });
        const user = this.authService.getUser();
        this.isProfessor = user?.role === 'PROFESSOR';
        this.userId = user?.sub || '';

        this.iniciarFormularios();
        this.iniciarBuscaAlunos();
        this.carregarDadosIniciais();
    }

    // Dispara turmas e professores em paralelo — tempo = max(A, B) em vez de A + B
    carregarDadosIniciais(): void {
        this.isLoading = true;
        this.erro = '';

        const statusAtivo = this.abaAtual === 'ativas';
        const profId = this.isProfessor ? this.userId : undefined;

        const termoBusca = this.buscaCtrl.value?.trim() || undefined;
        const profIdFiltro = this.filterForm?.value.professorId || undefined;
        const statusFiltro = this.filterForm?.value.status || undefined;

        forkJoin({
            turmas: this.turmasService.listar(this.paginaAtual, 100, termoBusca, statusAtivo, profId || profIdFiltro, statusFiltro),
            professores: this.usuariosService.listar(1, 100),
        }).subscribe({
            next: ({ turmas, professores }) => {
                this.turmas = turmas.data;
                this.totalTurmas = turmas.meta.total;
                this.professores = professores.data.filter(u =>
                    u.role === 'PROFESSOR' || u.role === 'ADMIN'
                );
                this.isLoading = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.erro = 'Não foi possível carregar os dados. Verifique se o servidor está online.';
                this.isLoading = false;
                this.cdr.markForCheck();
            },
        });
    }

    // ── Formulários ────────────────────────────────────────────
    iniciarFormularios(): void {
        this.turmaForm = this.fb.group({
            nome: ['', [Validators.required, Validators.minLength(3)]],
            descricao: [''],
            horario: [''],
            professorId: ['', Validators.required],
        });

        this.filterForm = this.fb.group({
            professorId: [''],
            status: [''],
        });
    }

    get f() { return this.turmaForm.controls; }

    isCampoInvalido(campo: string): boolean {
        const ctrl = this.turmaForm.get(campo);
        return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
    }

    get turmasFiltradas(): Turma[] {
        // O backend já filtra — retorna todos (a aba é controlada pelo carregarTurmas)
        return this.turmas;
    }

    alterarAba(aba: 'ativas' | 'arquivadas'): void {
        this.abaAtual = aba;
        this.paginaAtual = 1;
        this.carregarTurmas(1);
    }

    // ── Logica de Filtros Ativos ───────────────────────────────
    get quantidadeFiltrosAtivos(): number {
        if (!this.filterForm) return 0;
        let count = 0;
        const values = this.filterForm.value;
        if (values.professorId) count++;
        if (values.status) count++;
        return count;
    }

    limparFiltros() {
        this.filterForm.reset();
        this.buscaCtrl.setValue('');
        this.paginaAtual = 1;
        this.carregarTurmas();
    }

    aplicarFiltros() {
        this.drawerAberto = false;
        this.paginaAtual = 1;
        this.carregarTurmas();
    }

    // ── Carregamentos ──────────────────────────────────────────

    carregarTurmas(pagina = 1): void {
        this.isLoading = true;
        this.erro = '';
        this.paginaAtual = pagina;

        // Passa statusAtivo baseado na aba: ativas=true, arquivadas=false
        const statusAtivo = this.abaAtual === 'ativas' ? true : false;

        // Se for professor, passa o próprio ID
        const profIdOverride = this.isProfessor ? this.userId : undefined;

        const termoBusca = this.buscaCtrl.value?.trim() || undefined;
        const profIdFiltro = this.filterForm?.value.professorId || undefined;
        const statusFiltro = this.filterForm?.value.status || undefined;

        const professorFinalId = profIdOverride || profIdFiltro;

        this.turmasService.listar(pagina, 100, termoBusca, statusAtivo, professorFinalId, statusFiltro).subscribe({
            next: (res) => {
                this.turmas = res.data;
                this.totalTurmas = res.meta.total;
                this.isLoading = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.erro = 'Não foi possível carregar as turmas. Verifique se o servidor está online.';
                this.isLoading = false;
                this.cdr.markForCheck();
            },
        });
    }

    // carregarProfessores() foi absorvido pelo forkJoin em carregarDadosIniciais()

    // ── Modal Criar → navega para o Wizard completo ─────────────
    abrirModalCriar(): void {
        this.router.navigate(['/admin/turmas/cadastro']);
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
                setTimeout(() => {
                    this.salvandoModal = false;
                    this.fecharModal();
                    this.toast.sucesso(this.modoEdicao ? 'Oficina atualizada com sucesso!' : 'Oficina criada com sucesso!');
                    this.carregarTurmas(this.paginaAtual);
                }, 0);
            },
            error: (err: { status: number; error?: { message?: string } }) => {
                setTimeout(() => {
                    this.salvandoModal = false;
                    this.erroModal = err.status === 409
                        ? 'Já existe uma turma com este nome.'
                        : (err.error?.message ?? 'Erro ao salvar. Tente novamente.');
                    this.toast.erro('Erro ao salvar os dados da oficina.');
                    this.cdr.markForCheck();
                }, 0);
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

        this.turmasService.arquivar(this.turmaParaArquivar.id).subscribe({
            next: () => {
                setTimeout(() => {
                    this.arquivando = false;
                    this.fecharModalArquivar();
                    this.toast.sucesso('Oficina arquivada com sucesso!');
                    this.carregarTurmas(this.paginaAtual);
                }, 0);
            },
            error: (err: { error?: { message?: string } }) => {
                setTimeout(() => {
                    this.arquivando = false;
                    this.erroArquivamento = err.error?.message ?? 'Não foi possível arquivar a turma.';
                    this.toast.erro('Erro ao arquivar a oficina.');
                    this.cdr.markForCheck();
                }, 0);
            },
        });
    }

    async restaurarTurma(turma: Turma): Promise<void> {
        const ok = await this.confirmDialog.confirmar({
            titulo: 'Restaurar Oficina',
            mensagem: `Deseja restaurar a oficina "${turma.nome}"? Ela voltará a aparecer na aba de oficinas ativas.`,
            textoBotaoConfirmar: 'Sim, restaurar',
            tipo: 'info',
        });
        if (!ok) return;

        this.turmasService.restaurar(turma.id).subscribe({
            next: () => {
                setTimeout(() => {
                    this.toast.sucesso('Oficina restaurada com sucesso!');
                    this.carregarTurmas(this.paginaAtual);
                }, 0);
            },
            error: (err: { error?: { message?: string } }) => {
                setTimeout(() => {
                    this.erroArquivamento = err.error?.message ?? 'Não foi possível restaurar a oficina.';
                    this.toast.erro('Erro ao restaurar a oficina.');
                    this.cdr.markForCheck();
                }, 0);
            }
        });
    }

    async ocultarTurma(turma: Turma): Promise<void> {
        const ok = await this.confirmDialog.confirmar({
            titulo: 'Remover da Lista',
            mensagem: `A oficina "${turma.nome}" será removida da lista de arquivadas. Os dados (frequências, matrículas) são 100% preservados no banco.`,
            textoBotaoConfirmar: 'Sim, remover da lista',
            tipo: 'warning',
        });
        if (!ok) return;

        this.turmasService.ocultarDaAba(turma.id).subscribe({
            next: () => {
                setTimeout(() => {
                    this.toast.sucesso('Oficina ocultada da lista!');
                    this.carregarTurmas(this.paginaAtual);
                }, 0);
            },
            error: (err: { error?: { message?: string } }) => {
                setTimeout(() => {
                    this.erroArquivamento = err.error?.message ?? 'Não foi possível ocultar a oficina.';
                    this.toast.erro('Erro ao ocultar a oficina.');
                    this.cdr.markForCheck();
                }, 0);
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
        this.modalAlunosAbaAtual = this.isProfessor ? 'remover' : 'adicionar';
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
                // Filtra os alunos que já estão matriculados (usa matriculasOficina da nova interface)
                const IDsMatriculados = (this.turmaDetalhes?.matriculasOficina ?? []).map(m => m.aluno.id);

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
                        this.toast.aviso(`Processo concluído: ${concluidos} adicionados, ${erros} falharam.`);
                    } else {
                        this.toast.sucesso(`${concluidos} aluno(s) matriculado(s) com sucesso!`);
                    }
                    this.cdr.markForCheck();
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
            next: () => {
                // Re-carrega detalhes para atualizar lista de matriculasOficina
                this.turmasService.buscarPorId(this.turmaDetalhes!.id).subscribe(t => {
                    this.turmaDetalhes = t;
                    this.alunosBuscaRestado = this.alunosBuscaRestado.filter(a => a.id !== aluno.id);
                    this.operacaoEmProgresso = false;
                    this.cdr.detectChanges();
                });
            },
            error: () => {
                this.operacaoEmProgresso = false;
                this.cdr.detectChanges();
            }
        });
    }

    async removerAluno(alunoId: string, nome: string): Promise<void> {
        if (!this.turmaDetalhes || this.operacaoEmProgresso) return;

        const ok = await this.confirmDialog.confirmar({
            titulo: 'Remover Aluno',
            mensagem: `Tem certeza que deseja remover ${nome} desta oficina?`,
            textoBotaoConfirmar: 'Sim, remover',
            tipo: 'warning',
        });
        if (!ok) return;

        this.operacaoEmProgresso = true;

        this.turmasService.desmatricularAluno(this.turmaDetalhes.id, alunoId).subscribe({
            next: () => {
                // Re-carrega detalhes para atualizar lista de matriculasOficina
                this.turmasService.buscarPorId(this.turmaDetalhes!.id).subscribe(t => {
                    this.turmaDetalhes = t;
                    this.operacaoEmProgresso = false;
                    this.toast.sucesso('Aluno removido da oficina.');
                    this.cdr.detectChanges();
                });
            },
            error: () => {
                this.operacaoEmProgresso = false;
                this.toast.erro('Erro ao remover aluno da oficina.');
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

    // ── Status Acadêmico (Fase 4) ──────────────────────────────

    /** Labels e cores dos status para exibição na UI */
    readonly statusConfig: Record<string, { label: string; cor: string }> = {
        PREVISTA: { label: 'Prevista', cor: 'status-prevista' },
        ANDAMENTO: { label: 'Em Andamento', cor: 'status-andamento' },
        CONCLUIDA: { label: 'Concluída', cor: 'status-concluida' },
        CANCELADA: { label: 'Cancelada', cor: 'status-cancelada' },
    };

    mudarStatusTurma(turma: Turma, event: Event): void {
        const novoStatus = (event.target as HTMLSelectElement).value as any;
        if (!novoStatus || novoStatus === turma.status) return;

        this.turmasService.mudarStatus(turma.id, novoStatus).subscribe({
            next: (res) => {
                setTimeout(() => {
                    this.toast.sucesso(`Status alterado para "${this.statusConfig[res.status]?.label ?? res.status}".`);
                    this.carregarTurmas(this.paginaAtual);
                }, 0);
            },
            error: (err: { error?: { message?: string } }) => {
                setTimeout(() => {
                    this.toast.erro(err.error?.message ?? 'Não foi possível alterar o status.');
                    this.cdr.markForCheck();
                }, 0);
            }
        });
    }
}


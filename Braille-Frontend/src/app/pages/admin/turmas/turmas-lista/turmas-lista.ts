import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ActiveDescendantKeyManager, FocusKeyManager, Highlightable, FocusableOption, A11yModule, LiveAnnouncer } from '@angular/cdk/a11y';
import { Directive, ElementRef, HostBinding, Input, HostListener, QueryList, ViewChildren } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TurmasService, Turma, CreateTurmaDto } from '../../../../core/services/turmas.service';
import { UsuariosService, Usuario } from '../../../../core/services/usuarios.service';
import { BeneficiariosService, Beneficiario } from '../../../../core/services/beneficiarios.service';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';

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

@Directive({
    selector: '[appTabelaTrFocavel]',
    standalone: true
})
export class TabelaTrFocavelDirective implements FocusableOption {
    @Input() disabled = false;

    constructor(public element: ElementRef<HTMLElement>) { }

    focus(): void {
        this.element.nativeElement.focus();
    }
}

@Directive({
    selector: '[appBuscaItem]',
    standalone: true
})
export class BuscaResultadoItemDirective implements Highlightable {
    @Input() disabled = false;
    @Input() itemData: any; // Beneficiário ID data etc
    @HostBinding('class.active-item') isActive = false;

    constructor(private element: ElementRef<HTMLElement>) { }

    setActiveStyles(): void {
        this.isActive = true;
        this.element.nativeElement.scrollIntoView({ block: 'nearest' });
    }

    setInactiveStyles(): void {
        this.isActive = false;
    }

    getLabel?(): string {
        return this.itemData?.nomeCompleto || '';
    }
}

@Component({
    selector: 'app-turmas-lista',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, BuscaResultadoItemDirective, TabelaTrFocavelDirective, A11yModule],

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
    professoresFiltro: { id: string; nome: string }[] = [];

    // ── Modal Criar/Editar ─────────────────────────────────────
    modalAberto = false;
    modoEdicao = false;
    turmaEmEdicaoId = '';
    salvandoModal = false;
    erroModal = '';
    turmaForm!: FormGroup;

    // Acessibilidade: WCAG 2.4.3
    lastFocusBeforeModal: HTMLElement | null = null;

    // ── Grade Horária Auxiliar ─────────────────────────────────
    dias = DIAS;
    gradeHoraria: { dia: string; horaInicio: string; horaFim: string }[] = [];
    diaNovoTurno = '';
    horaInicioNovoTurno = '';
    horaFimNovoTurno = '';
    erroTurno = '';

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

    // ── KeyManager para Autocomplete ───────────────────────────
    @ViewChildren(BuscaResultadoItemDirective) buscaItems!: QueryList<BuscaResultadoItemDirective>;
    private keyManager!: ActiveDescendantKeyManager<BuscaResultadoItemDirective>;

    // ── Filtros e Busca ─────────────────────────────────────────
    buscaCtrl = new FormControl('');
    drawerAberto = false;
    filterForm!: FormGroup;
    private destroy$ = new Subject<void>();

    // ── KeyManager para Grid de Turmas ─────────────────────────
    @ViewChildren(TabelaTrFocavelDirective) gridItems!: QueryList<TabelaTrFocavelDirective>;
    private gridKeyManager!: FocusKeyManager<TabelaTrFocavelDirective>;

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
        private liveAnnouncer: LiveAnnouncer
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

    ngAfterViewInit(): void {
        this.gridKeyManager = new FocusKeyManager(this.gridItems).withWrap();
        this.gridItems.changes.subscribe(() => {
            this.gridKeyManager.withWrap();
        });
    }

    @HostListener('keydown', ['$event'])
    onKeydown(event: KeyboardEvent) {
        if (this.gridKeyManager && !this.modalAberto && !this.modalAlunosAberto && !this.modalArquivarAberto) {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
                this.gridKeyManager.onKeydown(event);
                event.preventDefault();
            }
        }
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
            professores: this.usuariosService.listar(1, 100, undefined, false, 'PROFESSOR'),
            professoresFiltro: this.turmasService.listarProfessoresAtivos(),
        }).subscribe({
            next: ({ turmas, professores, professoresFiltro }) => {
                this.turmas = turmas.data;
                this.totalTurmas = turmas.meta.total;
                this.professores = professores.data;
                this.professoresFiltro = professoresFiltro;
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
            capacidadeMaxima: [null],
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
                this.liveAnnouncer.announce(`Lista de turmas atualizada: ${this.totalTurmas} encontradas.`);
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
        this.lastFocusBeforeModal = document.activeElement as HTMLElement;
        this.modoEdicao = true;
        this.turmaEmEdicaoId = turma.id;
        this.erroModal = '';

        this.turmaForm.patchValue({
            nome: turma.nome,
            descricao: turma.descricao ?? '',
            capacidadeMaxima: turma.capacidadeMaxima ?? null,
            professorId: turma.professor?.id ?? '',
        });

        // Preenche a Grade Horária formatando de minutos para texto
        this.gradeHoraria = [];
        if (turma.gradeHoraria && turma.gradeHoraria.length > 0) {
            this.gradeHoraria = turma.gradeHoraria.map(turno => ({
                dia: turno.dia,
                horaInicio: this.minutosParaHmTemplate(turno.horaInicio),
                horaFim: this.minutosParaHmTemplate(turno.horaFim)
            }));
        }

        this.modalAberto = true;
        setTimeout(() => document.getElementById('modalNomeTurma')?.focus(), 100);
    }

    fecharModal(): void {
        this.modalAberto = false;
        this.erroModal = '';
        this.turmaForm.reset();
        setTimeout(() => this.lastFocusBeforeModal?.focus(), 0);
    }

    salvarModal(): void {
        if (this.turmaForm.invalid || this.salvandoModal) {
            this.turmaForm.markAllAsTouched();
            return;
        }

        this.salvandoModal = true;
        this.erroModal = '';

        const dados: CreateTurmaDto = {
            nome: this.turmaForm.value.nome,
            descricao: this.turmaForm.value.descricao,
            capacidadeMaxima: this.turmaForm.value.capacidadeMaxima || undefined,
            professorId: this.turmaForm.value.professorId,
            gradeHoraria: this.gradeHoraria.map(h => ({
                dia: h.dia as any,
                horaInicio: this.hmParaMinutos(h.horaInicio),
                horaFim: this.hmParaMinutos(h.horaFim)
            })),
        };

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
            error: (err: HttpErrorResponse) => {
                setTimeout(() => {
                    this.salvandoModal = false;
                    
                    let msg = err.status === 409
                        ? 'Já existe uma turma com este nome.'
                        : 'Erro ao salvar. Tente novamente.';

                    if (err.status === 400 && err.error?.message) {
                        msg = Array.isArray(err.error.message) ? err.error.message.join(', ') : err.error.message;
                    }

                    this.erroModal = msg;
                    this.toast.erro('Erro ao salvar os dados da oficina.');
                    this.cdr.markForCheck();
                }, 0);
            },
        });
    }

    // ── Modal Arquivar ──────────────────────────────────────────
    abrirModalArquivar(turma: Turma): void {
        this.lastFocusBeforeModal = document.activeElement as HTMLElement;
        this.turmaParaArquivar = turma;
        this.erroArquivamento = '';
        this.modalArquivarAberto = true;
    }

    fecharModalArquivar(): void {
        this.modalArquivarAberto = false;
        this.turmaParaArquivar = null;
        this.erroArquivamento = '';
        setTimeout(() => this.lastFocusBeforeModal?.focus(), 0);
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

    abrirModalAlunos(turma: Turma): void { this.verAlunos(turma); }

    verAlunos(turma: Turma): void {
        this.lastFocusBeforeModal = document.activeElement as HTMLElement;
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

        this.beneficiariosService.limparCache();
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

                // Reinicia KeyManager quando busca volta os dados
                setTimeout(() => {
                    this.keyManager = new ActiveDescendantKeyManager(this.buscaItems).withWrap().withTypeAhead();
                });
            },
            error: () => {
                this.buscandoAlunos = false;
                this.cdr.detectChanges();
            }
        });
    }

    onBuscaKeydown(event: KeyboardEvent): void {
        if (!this.keyManager) return;

        if (event.key === 'Enter' || event.key === ' ') {
            const activeItem = this.keyManager.activeItem;
            if (activeItem) {
                event.preventDefault(); // Evita scroll do espaço
                this.toggleSelecaoAluno(activeItem.itemData.id);
            }
        } else {
            this.keyManager.onKeydown(event);
        }
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
        
        // Verifica capacidade antes de qualquer matrícula
        const capacidade = this.turmaDetalhes.capacidadeMaxima;
        const matriculadosAtuais = this.turmaDetalhes.matriculasOficina?.length || 0;
        const selecionados = this.alunosSelecionadosParaMatricula.length;

        if (capacidade && (matriculadosAtuais + selecionados) > capacidade) {
            const vagas = capacidade - matriculadosAtuais;
            if (vagas <= 0) {
                this.toast.erro('Não foi possível matricular. A turma já está lotada.');
            } else {
                this.toast.erro(`Não foi possível matricular. Você selecionou ${selecionados} alunos, mas restam apenas ${vagas} vagas na turma.`);
            }
            return; // Impede que qualquer matrícula seja feita (mesmo parcialmente)
        }

        this.operacaoEmProgresso = true;

        const idsParaMatricular = [...this.alunosSelecionadosParaMatricula];
        let concluidos = 0;
        let erros = 0;
        const mensagensErro: string[] = [];

        const processarProximo = () => {
            if (concluidos + erros === idsParaMatricular.length) {
                this.operacaoEmProgresso = false;
                this.alunosSelecionadosParaMatricula = [];
                this.turmasService.buscarPorId(this.turmaDetalhes!.id).subscribe((t) => {
                    this.turmaDetalhes = t;
                    this.alunosBuscaRestado = this.alunosBuscaRestado.filter(a => !idsParaMatricular.includes(a.id));

                    if (erros > 0 && concluidos === 0) {
                        // Todos falharam
                        const ehLotada = mensagensErro.some(m => m.toLowerCase().includes('capacidade') || m.toLowerCase().includes('lotada'));
                        if (ehLotada) {
                            this.toast.erro('Turma lotada! A capacidade máxima foi atingida.');
                        } else {
                            this.toast.erro(`Não foi possível matricular: ${mensagensErro[0] || 'Erro desconhecido'}.`);
                        }
                    } else if (erros > 0) {
                        const ehLotada = mensagensErro.some(m => m.toLowerCase().includes('capacidade') || m.toLowerCase().includes('lotada'));
                        const detalhe = ehLotada
                            ? 'A turma atingiu a capacidade máxima. Edite a turma para aumentar as vagas.'
                            : `${erros} falha(s).`;
                        this.toast.aviso(`${concluidos} adicionado(s), ${erros} falhou — ${detalhe}`);
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
                error: (err: { error?: { message?: string } }) => {
                    erros++;
                    mensagensErro.push(err.error?.message ?? 'Erro desconhecido');
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

    exportarListaCSV(): void {
        if (!this.turmaDetalhes) return;

        const nomeTurma = this.turmaDetalhes.nome.replace(/[^a-zA-Z0-9À-ú ]/g, '').trim().replace(/\s+/g, '_');
        const data = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
        const nomeArquivo = `Turma_${nomeTurma}_${data}.csv`;

        // Cabeçalho das colunas
        const cabecalho = ['Nome do Aluno', 'Matrícula', 'Status', 'Data de Ingresso'];

        // Linhas de dados
        const linhas = (this.turmaDetalhes.matriculasOficina ?? []).map(m => [
            m.aluno.nomeCompleto,
            m.aluno.matricula ?? '',
            m.status ?? 'ATIVA',
            m.dataEntrada ? new Date(m.dataEntrada).toLocaleDateString('pt-BR') : '',
        ]);

        // Monta o conteúdo CSV com separador ponto-e-vírgula (padrão Excel PT-BR)
        const csvConteudo = [cabecalho, ...linhas]
            .map(linha => linha.map(cel => `"${String(cel).replace(/"/g, '""')}"`).join(';'))
            .join('\r\n');

        // BOM UTF-8 garante que o Excel exiba acentos corretamente
        const bom = '\uFEFF';
        const blob = new Blob([bom + csvConteudo], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', nomeArquivo);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.toast.sucesso(`Arquivo "${nomeArquivo}" baixado com sucesso!`);
    }

    fecharModalAlunos(): void {
        this.modalAlunosAberto = false;
        this.turmaDetalhes = null;
        setTimeout(() => this.lastFocusBeforeModal?.focus(), 0);
    }

    // ─── Grade Horária (Métodos Auxiliares) ─────────────────────────
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

        const conflito = this.gradeHoraria.some(t => t.dia === this.diaNovoTurno);
        if (conflito) {
            this.erroTurno = 'Já existe um turno neste dia. Remova o existente primeiro.';
            return;
        }

        this.gradeHoraria.push({
            dia: this.diaNovoTurno,
            horaInicio: this.horaInicioNovoTurno,
            horaFim: this.horaFimNovoTurno
        });

        this.diaNovoTurno = '';
        this.horaInicioNovoTurno = '';
        this.horaFimNovoTurno = '';
    }

    removerTurno(index: number) {
        this.gradeHoraria.splice(index, 1);
    }

    labelDia(valor: string): string {
        return this.dias.find(d => d.valor === valor)?.label || valor;
    }

    private hmParaMinutos(hm: string): number {
        if (!hm) return 0;
        const [h, m] = hm.split(':').map(Number);
        return (h * 60) + (m || 0);
    }

    minutosParaHmTemplate(minutos: number): string {
        const h = Math.floor(minutos / 60);
        const m = minutos % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
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


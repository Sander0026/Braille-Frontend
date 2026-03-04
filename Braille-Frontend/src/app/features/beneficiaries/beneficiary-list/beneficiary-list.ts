import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormControl, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { BeneficiariosService, Beneficiario } from '../../../core/services/beneficiarios.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { FormatDatePipe } from '../../../shared/pipes/data-braille.pipe';
import { ImportModalComponent } from '../import-modal/import-modal';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-beneficiary-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormatDatePipe, ImportModalComponent],
  templateUrl: './beneficiary-list.html',
  styleUrl: './beneficiary-list.scss'
})
export class BeneficiaryList implements OnInit, OnDestroy {
  alunos: Beneficiario[] = [];
  isLoading = true;
  erro = '';

  // Modal Ver Aluno
  modalAberto = false;
  carregandoDetalhes = false;
  uploadingImage = false;
  deletandoImage = false;
  alunoSelecionado: Beneficiario | null = null;

  // Modais de Confirmação (Padronizados)
  alunoParaInativar: Beneficiario | null = null;
  alunoParaRestaurar: Beneficiario | null = null;
  alunoParaExcluirDefinitivo: Beneficiario | null = null;
  salvando = false;

  documentoParaExcluir: { tipo: 'fotoPerfil' | 'laudoUrl'; url: string } | null = null;

  // Abas
  abaAtiva: 'ativos' | 'inativos' = 'ativos';

  // Paginação
  paginaAtual = 1;
  totalPaginas = 1;
  total = 0;
  readonly limite = 10;

  // Busca
  buscaCtrl = new FormControl('');

  private destroy$ = new Subject<void>();

  // Modal de Edição
  modalEdicaoAberto = false;
  alunoEmEdicao: Beneficiario | null = null;
  salvandoEdicao = false;
  editForm!: FormGroup;

  // Modal de Importação
  modalImportAberto = false;
  isAdmin = false;

  // ── Filtros Avançados (Drawer) ──────────────────────────────────
  drawerAberto = false;
  filterForm!: FormGroup;

  constructor(
    private beneficiariosService: BeneficiariosService,
    private cdr: ChangeDetectorRef,
    private confirmDialog: ConfirmDialogService,
    private toast: ToastService,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.editForm = this.fb.group({
      nomeCompleto: [''],
      cpfRg: [''],
      dataNascimento: [''],
      genero: [''],
      email: [''],
      telefoneContato: [''],
      // Endereço
      cep: [''],
      rua: [''],
      numero: [''],
      complemento: [''],
      bairro: [''],
      cidade: [''],
      uf: [''],
      // Deficiência
      tipoDeficiencia: [''],
      causaDeficiencia: [''],
      idadeOcorrencia: [''],
      tecAssistivas: [''],
      prefAcessibilidade: [''],
      outrasComorbidades: [''],
      // Socioeconômico
      escolaridade: [''],
      profissao: [''],
      rendaFamiliar: [''],
      beneficiosGov: [''],
      composicaoFamiliar: [''],
      precisaAcompanhante: [false],
      acompOftalmologico: [false],
      contatoEmergencia: [''],
    });
    this.filterForm = this.fb.group({
      tipoDeficiencia: [''],
      causaDeficiencia: [''],
      prefAcessibilidade: [''],
      precisaAcompanhante: [''],
      genero: [''],
      estadoCivil: [''],
      cidade: [''],
      uf: [''],
      escolaridade: [''],
      rendaFamiliar: [''],
      dataCadastroInicio: [''],
      dataCadastroFim: [''],
    });
  }

  ngOnInit(): void {
    this.buscaCtrl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.paginaAtual = 1;
      this.carregar();
    });

    const user = this.authService.getUser();
    this.isAdmin = user?.role === 'ADMIN' || user?.role === 'SECRETARIA';
    this.carregar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Modal de Importação ─────────────────────────────────────────────
  onImportFechou(devRecarregar: boolean): void {
    this.modalImportAberto = false;
    if (devRecarregar) {
      this.paginaAtual = 1;
      this.carregar();
    }
    this.cdr.markForCheck();
  }

  carregar(): void {
    this.isLoading = true;
    const nome = this.buscaCtrl.value?.trim() || undefined;
    const filtros = this.filtrosAtivos();
    this.beneficiariosService.listar(this.paginaAtual, this.limite, nome, this.abaAtiva === 'inativos', filtros).subscribe({
      next: (res) => {
        this.alunos = res.data;
        this.total = res.meta.total;
        this.totalPaginas = res.meta.lastPage;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.erro = 'Erro ao carregar alunos. Tente novamente.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Filtros Avançados ────────────────────────────────────────────

  /** Extrai do filterForm apenas os valores preenchidos (ignora vazios) */
  filtrosAtivos(): Record<string, any> | undefined {
    const val = this.filterForm.value;
    const filtros: Record<string, any> = {};
    Object.entries(val).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') filtros[k] = v;
    });
    return Object.keys(filtros).length > 0 ? filtros : undefined;
  }

  /** Conta quantos filtros estão ativos (exclui campos vazios) para o badge */
  get quantidadeFiltrosAtivos(): number {
    return Object.values(this.filterForm.value).filter(v => v !== null && v !== undefined && v !== '').length;
  }

  aplicarFiltros(): void {
    this.drawerAberto = false;
    this.paginaAtual = 1;
    this.beneficiariosService.limparCache();
    this.carregar();
    this.cdr.markForCheck();
  }

  limparFiltros(): void {
    this.filterForm.reset();
    this.paginaAtual = 1;
    this.beneficiariosService.limparCache();
    this.carregar();
    this.cdr.markForCheck();
  }

  irParaPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaAtual = pagina;
    this.carregar();
  }

  /** Retorna a janela de páginas visíveis: até 5 ao redor da atual + reticências (-1).
   *  Exemplo com 50 páginas na página 25: [1, -1, 23, 24, 25, 26, 27, -1, 50]
   */
  get paginasVisiveis(): number[] {
    const total = this.totalPaginas;
    const atual = this.paginaAtual;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const janela = 2; // páginas de cada lado da atual
    const inicio = Math.max(2, atual - janela);
    const fim = Math.min(total - 1, atual + janela);

    const paginas: number[] = [1];
    if (inicio > 2) paginas.push(-1); // reticências esquerda
    for (let p = inicio; p <= fim; p++) paginas.push(p);
    if (fim < total - 1) paginas.push(-1); // reticências direita
    paginas.push(total);
    return paginas;
  }

  // ── Modal de Edição ────────────────────────────────────────────
  abrirModalEdicao(aluno: Beneficiario): void {
    this.alunoEmEdicao = aluno;
    this.modalEdicaoAberto = true;
    // Carrega dados completos do aluno para preencher o form
    this.beneficiariosService.buscarPorId(aluno.id).subscribe({
      next: (dadosCompletos) => {
        // Formata a data de nascimento para yyyy-MM-dd (formato do input[type=date])
        const dataNasc = dadosCompletos.dataNascimento
          ? dadosCompletos.dataNascimento.substring(0, 10)
          : '';
        this.editForm.patchValue({ ...dadosCompletos, dataNascimento: dataNasc });
        this.cdr.markForCheck();
      }
    });
  }

  fecharModalEdicao(): void {
    this.modalEdicaoAberto = false;
    this.alunoEmEdicao = null;
    this.editForm.reset();
  }

  salvarEdicao(): void {
    if (!this.alunoEmEdicao || this.salvandoEdicao) return;
    this.salvandoEdicao = true;

    const payload = this.editForm.value;
    this.beneficiariosService.atualizar(this.alunoEmEdicao.id, payload).subscribe({
      next: () => {
        setTimeout(() => {
          this.salvandoEdicao = false;
          this.fecharModalEdicao();
          this.toast.sucesso('Aluno atualizado com sucesso!');
          this.carregar();
        }, 0);
      },
      error: () => {
        setTimeout(() => {
          this.salvandoEdicao = false;
          this.toast.erro('Erro ao atualizar os dados do aluno.');
          this.cdr.markForCheck();
        }, 0);
      }
    });
  }


  inativar(aluno: Beneficiario): void {
    this.alunoParaInativar = aluno;
  }

  cancelarInativacao(): void {
    this.alunoParaInativar = null;
  }

  confirmarInativacao(): void {
    if (!this.alunoParaInativar) return;
    this.salvando = true;

    this.beneficiariosService.inativar(this.alunoParaInativar.id).subscribe({
      next: () => {
        setTimeout(() => {
          this.salvando = false;
          this.alunoParaInativar = null;
          this.toast.sucesso('Aluno inativado com sucesso!');
          this.carregar();
        }, 0);
      },
      error: () => {
        setTimeout(() => {
          this.salvando = false;
          this.toast.erro('Erro ao inativar aluno.');
          this.cdr.markForCheck();
        }, 0);
      }
    });
  }

  setAba(aba: 'ativos' | 'inativos'): void {
    if (this.abaAtiva === aba) return;
    this.abaAtiva = aba;
    this.paginaAtual = 1;
    this.carregar();
  }

  // Lógica de Exclusão Definitiva
  excluirDefinitivamente(aluno: Beneficiario): void {
    this.alunoParaExcluirDefinitivo = aluno;
  }

  cancelarExclusaoDefinitiva(): void {
    this.alunoParaExcluirDefinitivo = null;
  }

  confirmarExclusaoDefinitiva(): void {
    if (!this.alunoParaExcluirDefinitivo) return;
    this.salvando = true;

    this.beneficiariosService.excluirDefinitivo(this.alunoParaExcluirDefinitivo.id).subscribe({
      next: () => {
        setTimeout(() => {
          this.salvando = false;
          this.alunoParaExcluirDefinitivo = null;
          this.toast.sucesso('Aluno excluído definitivamente com sucesso!');
          this.carregar();
        }, 0);
      },
      error: () => {
        setTimeout(() => {
          this.salvando = false;
          this.toast.erro('Erro ao excluir aluno definitivamente.');
          this.cdr.detectChanges();
        }, 0);
      }
    });
  }

  // Lógica de Restauração
  restaurarConta(aluno: Beneficiario): void {
    this.alunoParaRestaurar = aluno;
  }

  cancelarRestauracao(): void {
    this.alunoParaRestaurar = null;
  }

  confirmarRestauracao(): void {
    if (!this.alunoParaRestaurar) return;
    this.salvando = true;

    this.beneficiariosService.restaurar(this.alunoParaRestaurar.id).subscribe({
      next: () => {
        setTimeout(() => {
          this.salvando = false;
          this.alunoParaRestaurar = null;
          this.toast.sucesso('Aluno restaurado com sucesso!');
          this.carregar();
        }, 0);
      },
      error: () => {
        setTimeout(() => {
          this.salvando = false;
          this.toast.erro('Erro ao restaurar aluno.');
          this.cdr.detectChanges();
        }, 0);
      }
    });
  }

  // Visualização de Perfil Inteiro
  abrirModal(aluno: Beneficiario): void {
    this.modalAberto = true;
    this.carregandoDetalhes = true;
    this.alunoSelecionado = null;

    this.beneficiariosService.buscarPorId(aluno.id).subscribe({
      next: (dadosCompletos) => {
        this.alunoSelecionado = dadosCompletos;
        this.carregandoDetalhes = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.carregandoDetalhes = false;
        this.modalAberto = false;
        this.cdr.markForCheck();
      }
    });
  }

  fecharModal(): void {
    this.modalAberto = false;
    this.alunoSelecionado = null;
  }

  getAvatarUrl(aluno: Beneficiario): string {
    if (aluno.fotoPerfil) return aluno.fotoPerfil;
    const genero = aluno.genero ? aluno.genero.toLowerCase() : '';
    if (genero === 'feminino') return 'assets/images/avatar-female.svg';
    if (genero === 'masculino') return 'assets/images/avatar-male.svg';
    return 'assets/images/avatar-neutral.svg';
  }

  // --- Lógica de Upload e Exclusão de Arquivos no Perfil ---
  async processarUploadArquivo(event: any, tipo: 'fotoPerfil' | 'laudoUrl'): Promise<void> {
    const file = event.target.files[0];
    if (!file || !this.alunoSelecionado) return;

    this.uploadingImage = true;
    this.cdr.detectChanges();

    this.beneficiariosService.uploadImagem(file).subscribe({
      next: (res) => {
        const updatePayload: Partial<Beneficiario> = {};
        updatePayload[tipo] = res.url;

        this.beneficiariosService.atualizar(this.alunoSelecionado!.id, updatePayload).subscribe({
          next: (alunoAtualizado) => {
            setTimeout(() => {
              this.alunoSelecionado = alunoAtualizado;
              this.uploadingImage = false;
              this.toast.sucesso('Documento salvo com sucesso!');
              this.carregar();
            }, 0);
          },
          error: () => {
            setTimeout(() => {
              this.uploadingImage = false;
              this.toast.erro('Erro ao vincular documento ao aluno.');
              this.cdr.detectChanges();
            }, 0);
          }
        });
      },
      error: () => {
        this.uploadingImage = false;
        this.toast.erro('Erro ao enviar documento. Tente novamente.');
        this.cdr.detectChanges();
      }
    });
  }

  excluirDocumento(tipo: 'fotoPerfil' | 'laudoUrl'): void {
    if (!this.alunoSelecionado) return;
    const urlAtual = this.alunoSelecionado[tipo];
    if (!urlAtual) return;

    this.documentoParaExcluir = { tipo, url: urlAtual };
  }

  cancelarExclusaoDocumento(): void {
    this.documentoParaExcluir = null;
  }

  confirmarExclusaoDocumento(): void {
    if (!this.alunoSelecionado || !this.documentoParaExcluir) return;

    this.deletandoImage = true;
    this.cdr.detectChanges();

    const { tipo, url } = this.documentoParaExcluir;

    this.beneficiariosService.excluirArquivo(url).subscribe({
      next: () => {
        const updatePayload: Partial<Beneficiario> = {};
        updatePayload[tipo] = '';

        this.beneficiariosService.atualizar(this.alunoSelecionado!.id, updatePayload).subscribe({
          next: () => {
            setTimeout(() => {
              if (this.alunoSelecionado) {
                this.alunoSelecionado[tipo] = '';
              }
              this.deletandoImage = false;
              this.documentoParaExcluir = null;
              this.toast.sucesso('Documento excluído com sucesso!');
              this.carregar();
            }, 0);
          },
          error: () => {
            setTimeout(() => {
              this.deletandoImage = false;
              this.toast.erro('Erro ao desvincular documento do aluno.');
              this.cdr.detectChanges();
            }, 0);
          }
        });
      },
      error: () => {
        this.deletandoImage = false;
        this.toast.erro('Erro ao excluir documento.');
        this.cdr.detectChanges();
      }
    });
  }
}

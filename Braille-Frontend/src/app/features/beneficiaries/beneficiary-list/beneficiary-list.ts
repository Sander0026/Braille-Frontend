import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { BeneficiariosService, Beneficiario } from '../../../core/services/beneficiarios.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';

@Component({
  selector: 'app-beneficiary-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
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
  salvando = false;

  documentoParaExcluir: { tipo: 'fotoPerfil' | 'laudoUrl'; url: string } | null = null;

  // Paginação
  paginaAtual = 1;
  totalPaginas = 1;
  total = 0;
  readonly limite = 10;

  // Busca
  buscaCtrl = new FormControl('');

  private destroy$ = new Subject<void>();

  constructor(
    private beneficiariosService: BeneficiariosService,
    private cdr: ChangeDetectorRef,
    private confirmDialog: ConfirmDialogService,
  ) { }

  ngOnInit(): void {
    this.buscaCtrl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.paginaAtual = 1;
      this.carregar();
    });

    this.carregar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  carregar(): void {
    this.isLoading = true;
    const nome = this.buscaCtrl.value?.trim() || undefined;
    this.beneficiariosService.listar(this.paginaAtual, this.limite, nome).subscribe({
      next: (res) => {
        this.alunos = res.data;
        this.total = res.meta.total;
        this.totalPaginas = res.meta.lastPage;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.erro = 'Erro ao carregar alunos. Tente novamente.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  irParaPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaAtual = pagina;
    this.carregar();
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  formatarData(data: string): string {
    if (!data) return '—';
    return new Date(data).toLocaleDateString('pt-BR');
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
        this.carregar();
        this.salvando = false;
        this.alunoParaInativar = null;
      },
      error: () => {
        this.salvando = false;
        this.cdr.detectChanges();
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
        this.cdr.detectChanges();
      },
      error: () => {
        this.carregandoDetalhes = false;
        this.modalAberto = false;
        this.cdr.detectChanges();
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
            this.alunoSelecionado = alunoAtualizado;
            this.carregar();
            this.uploadingImage = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.uploadingImage = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: () => {
        this.uploadingImage = false;
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
            if (this.alunoSelecionado) {
              this.alunoSelecionado[tipo] = '';
            }
            this.carregar();
            this.deletandoImage = false;
            this.documentoParaExcluir = null;
            this.cdr.detectChanges();
          },
          error: () => {
            this.deletandoImage = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: () => {
        this.deletandoImage = false;
        this.cdr.detectChanges();
      }
    });
  }
}

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

  async inativar(aluno: Beneficiario): Promise<void> {
    const estaAtivo = aluno.statusAtivo !== false; // padrão: ativo
    const ok = await this.confirmDialog.confirmar({
      titulo: estaAtivo ? 'Inativar Aluno' : 'Reativar Aluno',
      mensagem: estaAtivo
        ? `Deseja inativar "${aluno.nomeCompleto}"? O registro será mantido, mas o aluno ficará inativo.`
        : `Deseja reativar "${aluno.nomeCompleto}"?`,
      textoBotaoConfirmar: estaAtivo ? 'Sim, inativar' : 'Sim, reativar',
      tipo: estaAtivo ? 'warning' : 'info',
    });
    if (!ok) return;

    this.beneficiariosService.inativar(aluno.id).subscribe({
      next: () => this.carregar(),
      error: () => this.cdr.detectChanges()
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

  async excluirDocumento(tipo: 'fotoPerfil' | 'laudoUrl'): Promise<void> {
    if (!this.alunoSelecionado) return;
    const urlAtual = this.alunoSelecionado[tipo];
    if (!urlAtual) return;

    const ok = await this.confirmDialog.confirmar({
      titulo: 'Apagar Arquivo',
      mensagem: tipo === 'fotoPerfil'
        ? 'Deseja apagar a foto de perfil deste aluno definitivamente?'
        : 'Deseja apagar o laudo/documento deste aluno definitivamente?',
      textoBotaoConfirmar: 'Sim, apagar',
      tipo: 'danger',
    });
    if (!ok) return;

    this.deletandoImage = true;
    this.cdr.detectChanges();

    this.beneficiariosService.excluirArquivo(urlAtual).subscribe({
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

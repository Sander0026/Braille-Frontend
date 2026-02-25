import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { BeneficiariosService, Beneficiario } from '../../../core/services/beneficiarios.service';

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

  constructor(private beneficiariosService: BeneficiariosService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    // Busca com debounce de 400ms
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
    if (!confirm(`Inativar ${aluno.nomeCompleto}?`)) return;
    this.beneficiariosService.inativar(aluno.id).subscribe({
      next: () => this.carregar(),
      error: () => { alert('Erro ao inativar aluno.'); this.cdr.detectChanges(); }
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
        alert('Erro ao carregar detalhes do aluno.');
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
    if (aluno.fotoPerfil) {
      return aluno.fotoPerfil;
    }
    // Avatar default baseado no gênero
    const genero = aluno.genero ? aluno.genero.toLowerCase() : '';
    if (genero === 'feminino') {
      return 'assets/images/avatar-female.svg';
    }
    if (genero === 'masculino') {
      return 'assets/images/avatar-male.svg';
    }
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
        // Sucesso no Cloudinary, agora salva no Banco (Prisma)
        const updatePayload: Partial<Beneficiario> = {};
        updatePayload[tipo] = res.url;

        this.beneficiariosService.atualizar(this.alunoSelecionado!.id, updatePayload).subscribe({
          next: (alunoAtualizado) => {
            this.alunoSelecionado = alunoAtualizado; // Atualiza a tela com o novo dado
            this.carregar(); // Recarrega a tabela no fundo
            this.uploadingImage = false;
            this.cdr.detectChanges();
          },
          error: () => {
            alert('Documento salvo na nuvem, mas falhou ao vincular no cadastro.');
            this.uploadingImage = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: () => {
        alert('Falha ao enviar o arquivo (verifique o tamanho ou formato).');
        this.uploadingImage = false;
        this.cdr.detectChanges();
      }
    });
  }

  excluirDocumento(tipo: 'fotoPerfil' | 'laudoUrl'): void {
    if (!this.alunoSelecionado) return;
    const urlAtual = this.alunoSelecionado[tipo];

    if (!urlAtual) return;
    if (!confirm('Tem certeza que deseja apagar este arquivo definitivamente?')) return;

    this.deletandoImage = true;
    this.cdr.detectChanges();

    this.beneficiariosService.excluirArquivo(urlAtual).subscribe({
      next: () => {
        // Sucesso na exclusão do Cloudinary, limpa o Banco
        const updatePayload: Partial<Beneficiario> = {};
        updatePayload[tipo] = ''; // Prisma pode gravar string vazia ou anular via Backend

        this.beneficiariosService.atualizar(this.alunoSelecionado!.id, updatePayload).subscribe({
          next: () => {
            // Força a UI a remover o arquivo localmente
            if (this.alunoSelecionado) {
              this.alunoSelecionado[tipo] = '';
            }
            this.carregar(); // Recarrega a tabela
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
        alert('Falha ao excluir o documento da nuvem.');
        this.deletandoImage = false;
        this.cdr.detectChanges();
      }
    });
  }
}

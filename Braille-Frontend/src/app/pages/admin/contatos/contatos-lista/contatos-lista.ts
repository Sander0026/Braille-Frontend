import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { ContatosService, Contato } from '../../../../core/services/contatos.service';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { A11yModule } from '@angular/cdk/a11y';

type FiltroLida = 'todas' | 'nao-lidas' | 'lidas';

@Component({
  selector: 'app-contatos-lista',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, A11yModule],
  templateUrl: './contatos-lista.html',
  styleUrl: './contatos-lista.scss'
})
export class ContatosLista implements OnInit {
  contatos: Contato[] = [];
  isLoading = true;
  erro = '';
  total = 0;
  paginaAtual = 1;
  totalPaginas = 1;
  filtroAtivo: FiltroLida = 'todas';

  contatoSelecionado: Contato | null = null;
  processando = false;

  readonly filtros: { valor: FiltroLida; label: string }[] = [
    { valor: 'todas', label: 'Todas' },
    { valor: 'nao-lidas', label: 'Não lidas' },
    { valor: 'lidas', label: 'Lidas' }
  ];

  constructor(
    private contatosService: ContatosService,
    private cdr: ChangeDetectorRef,
    private confirmDialog: ConfirmDialogService,
  ) { }

  ngOnInit(): void { this.carregar(); }

  mudarFiltro(filtro: FiltroLida): void {
    this.filtroAtivo = filtro;
    this.paginaAtual = 1;
    this.carregar();
  }

  carregar(): void {
    this.isLoading = true;
    const lida = this.filtroAtivo === 'todas' ? undefined :
      this.filtroAtivo === 'lidas' ? true : false;
    this.contatosService.listar(this.paginaAtual, 15, lida).subscribe({
      next: (res) => {
        this.contatos = res.data;
        this.total = res.meta.total;
        this.totalPaginas = res.meta.lastPage;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.erro = 'Erro ao carregar mensagens.'; this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  abrirMensagem(contato: Contato): void {
    this.contatoSelecionado = contato;
    if (!contato.lida) { this.marcarLida(contato); }
  }

  fecharMensagem(): void { this.contatoSelecionado = null; }

  marcarLida(contato: Contato): void {
    this.contatosService.marcarComoLida(contato.id).subscribe({
      next: () => { contato.lida = true; this.cdr.detectChanges(); },
      error: () => { }
    });
  }

  async excluir(contato: Contato): Promise<void> {
    const ok = await this.confirmDialog.confirmar({
      titulo: 'Excluir Mensagem',
      mensagem: `Tem certeza que deseja excluir a mensagem de "${contato.nome}"? Esta ação não pode ser desfeita.`,
      textoBotaoConfirmar: 'Sim, excluir',
      tipo: 'danger',
    });
    if (!ok) return;
    this.contatosService.excluir(contato.id).subscribe({
      next: () => { this.fecharMensagem(); this.carregar(); },
      error: () => { this.cdr.detectChanges(); }
    });
  }

  formatarData(data: string): string {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  irParaPagina(p: number): void {
    if (p < 1 || p > this.totalPaginas) return;
    this.paginaAtual = p;
    this.carregar();
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }
}

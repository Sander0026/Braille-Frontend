import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { InscricoesService, Inscricao } from '../../../../core/services/inscricoes.service';

type StatusTab = 'PENDENTE' | 'APROVADA' | 'RECUSADA';

@Component({
  selector: 'app-inscricoes-lista',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './inscricoes-lista.html',
  styleUrl: './inscricoes-lista.scss'
})
export class InscricoesLista implements OnInit {
  inscricoes: Inscricao[] = [];
  isLoading = true;
  erro = '';
  total = 0;
  paginaAtual = 1;
  totalPaginas = 1;

  statusAtivo: StatusTab = 'PENDENTE';
  readonly tabs: { valor: StatusTab; label: string }[] = [
    { valor: 'PENDENTE', label: 'Pendentes' },
    { valor: 'APROVADA', label: 'Aprovadas' },
    { valor: 'RECUSADA', label: 'Recusadas' }
  ];

  // Modal detalhe / decisão
  inscricaoSelecionada: Inscricao | null = null;
  obsCtrl = new FormControl('');
  processando = false;

  constructor(private inscricoesService: InscricoesService) { }

  ngOnInit(): void { this.carregar(); }

  mudarAba(status: StatusTab): void {
    this.statusAtivo = status;
    this.paginaAtual = 1;
    this.carregar();
  }

  carregar(): void {
    this.isLoading = true;
    this.inscricoesService.listar(this.paginaAtual, 15, this.statusAtivo).subscribe({
      next: (res) => {
        this.inscricoes = res.data;
        this.total = res.meta.total;
        this.totalPaginas = res.meta.lastPage;
        this.isLoading = false;
      },
      error: () => { this.erro = 'Erro ao carregar inscrições.'; this.isLoading = false; }
    });
  }

  abrirDetalhe(inscricao: Inscricao): void {
    this.inscricaoSelecionada = inscricao;
    this.obsCtrl.setValue('');
  }

  fecharDetalhe(): void {
    this.inscricaoSelecionada = null;
    this.obsCtrl.setValue('');
  }

  decidir(status: 'APROVADA' | 'RECUSADA'): void {
    if (!this.inscricaoSelecionada) return;
    this.processando = true;
    this.inscricoesService.atualizarStatus(
      this.inscricaoSelecionada.id, status, this.obsCtrl.value ?? ''
    ).subscribe({
      next: () => { this.processando = false; this.fecharDetalhe(); this.carregar(); },
      error: () => { this.processando = false; alert('Erro ao processar inscrição.'); }
    });
  }

  formatarData(data: string): string {
    return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  calcularIdade(dataNasc: string): number {
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    if (hoje.getMonth() < nasc.getMonth() || (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate())) {
      idade--;
    }
    return idade;
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

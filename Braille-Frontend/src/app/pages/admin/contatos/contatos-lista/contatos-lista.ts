import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ContatosService, Contato } from '../../../../core/services/contatos.service';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { A11yModule, LiveAnnouncer } from '@angular/cdk/a11y';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

type FiltroLida = 'todas' | 'nao-lidas' | 'lidas';

@Component({
  selector: 'app-contatos-lista',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, A11yModule],
  providers: [DatePipe],
  templateUrl: './contatos-lista.html',
  styleUrl: './contatos-lista.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContatosLista implements OnInit {
  // Injeções Modernas
  private readonly contatosService = inject(ContatosService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = inject(DatePipe);

  // Estados Baseados em Signals
  contatos = signal<Contato[]>([]);
  isLoading = signal<boolean>(true);
  erro = signal<string>('');
  
  total = signal<number>(0);
  paginaAtual = signal<number>(1);
  totalPaginas = signal<number>(1);
  filtroAtivo = signal<FiltroLida>('todas');
  
  contatoSelecionado = signal<Contato | null>(null);
  private lastFocusBeforeModal: HTMLElement | null = null;

  // Filtros UI
  readonly filtros: { valor: FiltroLida; label: string }[] = [
    { valor: 'todas', label: 'Todas' },
    { valor: 'nao-lidas', label: 'Não lidas' },
    { valor: 'lidas', label: 'Lidas' }
  ];

  // Computeds (Calculados Otimizados de forma reativa, sem recalcular na main thread continuamente)
  paginas = computed(() => {
    return Array.from({ length: this.totalPaginas() }, (_, i) => i + 1);
  });

  ngOnInit(): void {
    this.carregar();
  }

  mudarFiltro(filtro: FiltroLida): void {
    this.filtroAtivo.set(filtro);
    this.paginaAtual.set(1);
    this.carregar();
  }

  carregar(): void {
    this.isLoading.set(true);
    this.erro.set('');
    
    const fl = this.filtroAtivo();
    const lida = fl === 'todas' ? undefined : fl === 'lidas' ? true : false;
    
    this.contatosService.listar(this.paginaAtual(), 15, lida)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.contatos.set(res.data);
          this.total.set(res.meta.total);
          this.totalPaginas.set(res.meta.lastPage);
          this.isLoading.set(false);
          this.liveAnnouncer.announce(`Lista de mensagens de contato atualizada: ${this.total()} encontradas.`);
        },
        error: () => {
          this.erro.set('Erro ao carregar mensagens.');
          this.isLoading.set(false);
        }
      });
  }

  abrirMensagem(contato: Contato): void {
    this.lastFocusBeforeModal = document.activeElement as HTMLElement;
    this.contatoSelecionado.set(contato);
    if (!contato.lida) {
      this.marcarLida(contato);
    }
  }

  fecharMensagem(): void {
    this.contatoSelecionado.set(null);
    setTimeout(() => this.lastFocusBeforeModal?.focus(), 0);
  }

  marcarLida(contato: Contato): void {
    const contatoId = contato.id; // Clonagem imutável simplificada
    this.contatosService.marcarComoLida(contatoId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          // Atualiza o objeto no signal local via sub-propriedade mantendo a ref mutável ou mapeando
          this.contatos.update(lista => 
            lista.map(c => c.id === contatoId ? { ...c, lida: true } : c)
          );
          
          // Se for o selecionado atual, dá o merge reativo nele também
          const selecionado = this.contatoSelecionado();
          if (selecionado && selecionado.id === contatoId) {
            this.contatoSelecionado.set({ ...selecionado, lida: true });
          }
        },
        error: () => {
          console.error(`Falha ao marcar como lida (ID: ${contatoId})`);
        }
      });
  }

  async excluir(contato: Contato): Promise<void> {
    const nomeLimpo = contato.nome || 'Usuário Indefinido';
    const ok = await this.confirmDialog.confirmar({
      titulo: 'Excluir Mensagem',
      mensagem: `Tem certeza que deseja excluir a mensagem de "${nomeLimpo}"? Esta ação não pode ser desfeita.`,
      textoBotaoConfirmar: 'Sim, excluir',
      tipo: 'danger',
    });
    
    if (!ok) return;

    try {
      await firstValueFrom(
        this.contatosService.excluir(contato.id)
      );
      this.fecharMensagem();
      this.carregar();
    } catch (e: any) {
      this.erro.set('Houve um erro indesejado ao tentar excluir a mensagem.');
    }
  }

  irParaPagina(p: number): void {
    if (p < 1 || p > this.totalPaginas()) return;
    this.paginaAtual.set(p);
    this.carregar();
  }

  // Delegando formatação para o Core Pipe do Angular via Class
  formatarData(data: string): string {
    return this.datePipe.transform(data, 'dd/MM/yyyy HH:mm') || '--';
  }
}

import { Component, ChangeDetectionStrategy, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { A11yModule, LiveAnnouncer } from '@angular/cdk/a11y';

import {
  ARQUIVOS_MANUAIS_AJUDA,
  ManualArquivo,
  ManualCard,
  ManualRole,
  MANUAIS_AJUDA,
  TECNOLOGIAS_SISTEMA,
  EQUIPE_SISTEMA
} from './ajuda.constants';
import { PdfViewerComponent } from '../../../shared/components/pdf-viewer/pdf-viewer.component';
import { ManualCardComponent } from './components/manual-card/manual-card.component';
import { ManualViewerComponent } from './components/manual-viewer/manual-viewer.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-ajuda',
  standalone: true,
  imports: [CommonModule, RouterModule, A11yModule, PdfViewerComponent, ManualCardComponent, ManualViewerComponent],
  templateUrl: './ajuda.html',
  styleUrl: './ajuda.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Ajuda {
  readonly manuais = MANUAIS_AJUDA;
  readonly tecnologias = TECNOLOGIAS_SISTEMA;
  readonly equipe = EQUIPE_SISTEMA;

  arquivoAtivo = signal<ManualArquivo | null>(null);
  manualAtivo = signal<ManualArquivo | null>(null);
  cardAtivo = signal<ManualCard | null>(null);
  modalManuaisAberto = signal(false);
  statusLeitorTela = signal('');

  private ultimoElementoFocado: HTMLElement | null = null;
  private gatilhoModalManuais: HTMLElement | null = null;
  private arquivoAbertoDaLista: ManualArquivo | null = null;
  private readonly roleAtual: ManualRole | null;

  constructor(
    private readonly liveAnnouncer: LiveAnnouncer,
    private readonly authService: AuthService
  ) {
    this.roleAtual = this.normalizarRole(this.authService.getUser()?.role);
  }

  arquivosPermitidos(manual: ManualCard): ManualArquivo[] {
    const arquivos = ARQUIVOS_MANUAIS_AJUDA.filter((arquivo) => arquivo.cardIds.includes(manual.id));
    if (!this.roleAtual) return [];
    if (this.roleAtual === 'ADMIN') return arquivos;
    return arquivos.filter((arquivo) => arquivo.roles.includes(this.roleAtual!));
  }

  arquivosDoCardAtivo(): ManualArquivo[] {
    const card = this.cardAtivo();
    return card ? this.arquivosPermitidos(card) : [];
  }

  temArquivosNoCardAtivo(): boolean {
    return this.arquivosDoCardAtivo().length > 0;
  }

  idManualLista(arquivo: ManualArquivo): string {
    return `manual-ajuda-${arquivo.nomeArquivo.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  }

  abrirModalManuais(manual: ManualCard): void {
    const arquivos = this.arquivosPermitidos(manual);

    this.gatilhoModalManuais = document.activeElement as HTMLElement;
    this.cardAtivo.set(manual);
    this.modalManuaisAberto.set(true);
    if (arquivos.length > 0) {
      this.statusLeitorTela.set(`${arquivos.length} manual(is) disponivel(is) em ${manual.titulo}.`);
      this.liveAnnouncer.announce(`Lista de manuais de ${manual.titulo} aberta. Use Tab para navegar pelos arquivos.`, 'polite');
      return;
    }

    this.statusLeitorTela.set(`Nenhum manual disponivel em ${manual.titulo} para este perfil.`);
    this.liveAnnouncer.announce(`Lista de manuais de ${manual.titulo} aberta, sem arquivos disponiveis para este perfil.`, 'polite');
  }

  fecharModalManuais(): void {
    this.modalManuaisAberto.set(false);
    this.cardAtivo.set(null);
    this.arquivoAbertoDaLista = null;
    this.statusLeitorTela.set('');
    setTimeout(() => {
      this.gatilhoModalManuais?.focus();
      this.gatilhoModalManuais = null;
    }, 0);
  }

  abrirManual(arquivo: ManualArquivo): void {
    this.ultimoElementoFocado = document.activeElement as HTMLElement;
    this.arquivoAbertoDaLista = arquivo;

    this.modalManuaisAberto.set(false);
    this.manualAtivo.set(arquivo);
    this.statusLeitorTela.set(`Manual ${arquivo.titulo} aberto em formato de texto acessivel.`);
    this.liveAnnouncer.announce(`Manual ${arquivo.titulo} aberto em formato de texto acessivel.`, 'polite');
  }

  abrirPdfDoManual(arquivo: ManualArquivo): void {
    this.ultimoElementoFocado = document.activeElement as HTMLElement;

    if (this.deveAbrirPdfEmNovaAba()) {
      this.abrirPdfEmNovaAba(arquivo);
      return;
    }

    this.arquivoAtivo.set(arquivo);
    this.statusLeitorTela.set(`Abrindo versao em PDF do manual ${arquivo.titulo}.`);
    this.liveAnnouncer.announce(`Versao em PDF do manual ${arquivo.titulo} aberta.`, 'polite');
  }

  fecharManual(): void {
    const arquivoParaRestaurar = this.arquivoAbertoDaLista;
    this.manualAtivo.set(null);

    if (this.cardAtivo()) {
      this.reabrirListaDeManuais(arquivoParaRestaurar, 'Manual fechado. Voce voltou para a lista de manuais.');
      return;
    }

    if (this.ultimoElementoFocado) {
      setTimeout(() => {
        this.ultimoElementoFocado?.focus();
        this.ultimoElementoFocado = null;
      }, 0);
    }
  }

  fecharPdf(): void {
    this.arquivoAtivo.set(null);

    if (this.manualAtivo()) {
      this.statusLeitorTela.set('PDF fechado. Voce voltou para o manual em texto acessivel.');
      this.liveAnnouncer.announce('PDF fechado. Voce voltou para o manual em texto acessivel.', 'polite');
      setTimeout(() => this.ultimoElementoFocado?.focus(), 0);
      return;
    }

    const arquivoParaRestaurar = this.arquivoAbertoDaLista;
    if (this.cardAtivo()) {
      this.reabrirListaDeManuais(arquivoParaRestaurar, 'Visualizador fechado. Voce voltou para a lista de manuais.');
      return;
    }

    if (this.ultimoElementoFocado) {
      setTimeout(() => {
        this.ultimoElementoFocado?.focus();
        this.ultimoElementoFocado = null;
      }, 0);
    }
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;

    if (this.arquivoAtivo()) {
      this.fecharPdf();
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (this.manualAtivo()) {
      this.fecharManual();
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (this.modalManuaisAberto()) {
      this.fecharModalManuais();
      event.preventDefault();
      event.stopPropagation();
    }
  }

  private reabrirListaDeManuais(arquivo: ManualArquivo | null, mensagem: string): void {
    this.modalManuaisAberto.set(true);
    this.statusLeitorTela.set(mensagem);
    this.liveAnnouncer.announce(mensagem, 'polite');
    setTimeout(() => this.restaurarFocoNaListaDeManuais(arquivo), 0);
  }

  private normalizarRole(role?: string): ManualRole | null {
    const normalizada = role
      ?.trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const aliases: Record<string, ManualRole> = {
      ADM: 'ADMIN',
      ADMIN: 'ADMIN',
      ADMINISTRADOR: 'ADMIN',
      SECRETARIA: 'SECRETARIA',
      PROFESSOR: 'PROFESSOR',
      COMUNICACAO: 'COMUNICACAO',
      COMUNICACAO_SOCIAL: 'COMUNICACAO'
    };

    return normalizada ? aliases[normalizada] ?? null : null;
  }

  private restaurarFocoNaListaDeManuais(arquivo: ManualArquivo | null): void {
    if (arquivo) {
      const itemManual = document.getElementById(this.idManualLista(arquivo));
      if (itemManual) {
        itemManual.focus();
        return;
      }
    }

    document.querySelector<HTMLElement>('#modal-lista-manuais button')?.focus();
  }

  private deveAbrirPdfEmNovaAba(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
  }

  private abrirPdfEmNovaAba(arquivo: ManualArquivo): void {
    const url = arquivo.arquivo.startsWith('assets/') ? `/${arquivo.arquivo}` : arquivo.arquivo;
    const janela = window.open(url, '_blank', 'noopener,noreferrer');

    if (janela) {
      this.statusLeitorTela.set(`Manual ${arquivo.titulo} aberto em uma nova aba.`);
      this.liveAnnouncer.announce(`Manual ${arquivo.titulo} aberto em uma nova aba.`, 'polite');
      return;
    }

    this.modalManuaisAberto.set(false);
    this.arquivoAtivo.set(arquivo);
    this.statusLeitorTela.set(`Abrindo manual ${arquivo.titulo} no visualizador.`);
    this.liveAnnouncer.announce(`Nao foi possivel abrir nova aba. Manual ${arquivo.titulo} aberto no visualizador.`, 'polite');
  }
}

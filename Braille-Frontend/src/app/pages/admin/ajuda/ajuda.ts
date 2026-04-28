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
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-ajuda',
  standalone: true,
  imports: [CommonModule, RouterModule, A11yModule, PdfViewerComponent, ManualCardComponent],
  templateUrl: './ajuda.html',
  styleUrl: './ajuda.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Ajuda {
  readonly manuais = MANUAIS_AJUDA;
  readonly tecnologias = TECNOLOGIAS_SISTEMA;
  readonly equipe = EQUIPE_SISTEMA;

  arquivoAtivo = signal<ManualArquivo | null>(null);
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
    this.arquivoAtivo.set(arquivo);
    this.statusLeitorTela.set(`Abrindo manual ${arquivo.titulo}.`);
    this.liveAnnouncer.announce(`Manual ${arquivo.titulo} aberto no visualizador.`, 'polite');
  }

  fecharPdf(): void {
    const arquivoParaRestaurar = this.arquivoAbertoDaLista;
    this.arquivoAtivo.set(null);

    if (this.cardAtivo()) {
      this.modalManuaisAberto.set(true);
      this.statusLeitorTela.set('Visualizador fechado. Retornando para a lista de manuais.');
      this.liveAnnouncer.announce('Visualizador fechado. Voce voltou para a lista de manuais.', 'polite');
      setTimeout(() => this.restaurarFocoNaListaDeManuais(arquivoParaRestaurar), 0);
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

    if (this.modalManuaisAberto()) {
      this.fecharModalManuais();
      event.preventDefault();
      event.stopPropagation();
    }
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
}

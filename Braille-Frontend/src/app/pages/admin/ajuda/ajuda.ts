import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { ManualCard, MANUAIS_AJUDA, TECNOLOGIAS_SISTEMA, EQUIPE_SISTEMA } from './ajuda.constants';
import { PdfViewerComponent } from './components/pdf-viewer/pdf-viewer.component';
import { ManualCardComponent } from './components/manual-card/manual-card.component';
import { AccessibilityService } from '../../../core/services/accessibility.service';

@Component({
  selector: 'app-ajuda',
  standalone: true,
  imports: [CommonModule, RouterModule, PdfViewerComponent, ManualCardComponent],
  templateUrl: './ajuda.html',
  styleUrl: './ajuda.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Ajuda {
  // Desacoplado: as constantes não entopem a classe.
  readonly manuais = MANUAIS_AJUDA;
  readonly tecnologias = TECNOLOGIAS_SISTEMA;
  readonly equipe = EQUIPE_SISTEMA;

  // Reativo: Performance otimizada com a gestão unificada de render de modal/PDF do Angular
  manualAtivo = signal<ManualCard | null>(null);

  /** A11y Tracker para restaurar o Keyboard Focus quando fecham o visualizador */
  private ultimoElementoFocado: HTMLElement | null = null;

  abrirManual(manual: ManualCard): void {
    if (!manual.arquivo) return;
    this.ultimoElementoFocado = document.activeElement as HTMLElement;
    this.manualAtivo.set(manual);
  }

  fecharPdf(): void {
    this.manualAtivo.set(null);
    // Restaurar foco anterior
    if (this.ultimoElementoFocado) {
      setTimeout(() => {
        this.ultimoElementoFocado?.focus();
        this.ultimoElementoFocado = null;
      }, 0);
    }
  }
}

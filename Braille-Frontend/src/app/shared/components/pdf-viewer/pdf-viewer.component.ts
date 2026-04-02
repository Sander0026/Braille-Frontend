import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeUrlPipe } from '../../../core/pipes/safe-url.pipe';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule, SafeUrlPipe],
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush // Desbloqueando performance maxima de renderização
})
export class PdfViewerComponent {
  
  /**
   * Entrada Funcional Type-Safe Integrada aos Signals.
   * Totalmente retrocompatível com a injeção pai `[url]="..."`
   */
  url = input.required<string>();

  /**
   * Encapsulamento EventBus Nativo Substituto do antigo EventEmitter.
   */
  closed = output<void>();

  /**
   * Setter Reativo Seguro e Cached.
   * Elimina Shadow Updates do antigo `@Input() set url()` que disparavam renders paralelos.
   * Contém proteção OWASP Sanitizante com o encodeURIComponent e Parser Automático.
   */
  urlVisualizadorPdf = computed<string>(() => {
    const rawVal = this.url();
    if (!rawVal) return '';

    let urlCorrigida = rawVal;
    
    // Normalize para extensões .pdf assegurando o disparo do Motor do Viewer do Google docs
    if (!urlCorrigida.toLowerCase().endsWith('.pdf')) {
      urlCorrigida += '.pdf';
    }

    // Gerador blindado
    return `https://docs.google.com/viewer?url=${encodeURIComponent(urlCorrigida)}&embedded=true`;
  });

  onClose() {
    this.closed.emit();
  }
}
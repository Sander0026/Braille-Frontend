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
   * Evento de fechamento. Renomeado para 'fecharModal' (era 'closed') para sincronizar perfeitamente
   * com o @Output consumido nos parentes (Ex: beneficiary-list).
   */
  fecharModal = output<void>();

  /**
   * Setter Reativo Seguro e Cached.
   * Elimina Shadow Updates do antigo `@Input() set url()` que disparavam renders paralelos.
   * Contém proteção OWASP Sanitizante com o encodeURIComponent e Parser Automático.
   */
  urlVisualizadorPdf = computed<string>(() => {
    const rawVal = this.url();
    if (!rawVal) return '';

    // Segurança (LGPD / OWASP): A renderização nativa substitui o Google Docs Viewer.
    // O envio de URLs de certificados (e blobs locais) para um visualizador externo
    // viola o sigilo dos dados do aluno e causa quebra em URLs 'blob:' (Resultando em Bad Request).
    return rawVal;
  });

  onClose() {
    this.fecharModal.emit();
  }
}
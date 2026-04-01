import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeUrlPipe } from '../../../core/pipes/safe-url.pipe';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule, SafeUrlPipe],
  templateUrl: './pdf-viewer.component.html'
})
export class PdfViewerComponent {
  
  private _rawUrl: string = '';
  public urlVisualizadorPdf: string = '';

  /**
   * Setter reativo: Sempre que a URL de input mudar fora deste componente,
   * ele cuidará de formatar, escapar (anti XSS/Injection) e re-engatilhar o parser do Google Viewer.
   */
  @Input({ required: true }) set url(val: string) {
    if (!val) {
      this.urlVisualizadorPdf = '';
      return;
    }
    
    this._rawUrl = val;
    let urlCorrigida = val;
    
    // Normalize para PDF extensions para forçar leitura pelo Chrome/Google Viewer
    if (!urlCorrigida.toLowerCase().endsWith('.pdf')) {
      urlCorrigida += '.pdf';
    }

    // Builder Restrito contra Prototype Pollution ou Bypass
    this.urlVisualizadorPdf = `https://docs.google.com/viewer?url=${encodeURIComponent(urlCorrigida)}&embedded=true`;
  }

  // Permite comunicação com o Parent para encerrar o Modal via Acessibilidade ou Mouse
  @Output() closed = new EventEmitter<void>();

  onClose() {
    this.closed.emit();
  }
}
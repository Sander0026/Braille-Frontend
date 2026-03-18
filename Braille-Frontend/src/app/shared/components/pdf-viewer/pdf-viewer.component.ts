import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as pdfjsLib from 'pdfjs-dist';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pdf-viewer-container">
      <!-- Cabeçalho -->
      <div class="pdf-viewer-header">
        <h3>Visualizador de Documento</h3>
        <button (click)="fechar()" class="btn-close" title="Fechar (ESC)">✕</button>
      </div>

      <!-- Carregando -->
      @if (carregando) {
        <div class="pdf-loading">
          <span class="spinner"></span>
          <p>Carregando documento...</p>
        </div>
      }

      <!-- Erro -->
      @if (erro) {
        <div class="pdf-error">
          <span class="error-icon">⚠️</span>
          <p>{{ erro }}</p>
          <button (click)="tentar()" class="btn-retry">Tentar Novamente</button>
        </div>
      }

      <!-- Canvas do PDF -->
      @if (!carregando && !erro) {
        <div class="pdf-content">
          <canvas #pdfCanvas></canvas>
          
          <!-- Controles -->
          <div class="pdf-controls">
            <button (click)="paginaAnterior()" [disabled]="paginaAtual === 1">← Anterior</button>
            <span>Página {{ paginaAtual }} de {{ totalPaginas }}</span>
            <button (click)="proximaPagina()" [disabled]="paginaAtual === totalPaginas">Próxima →</button>
            <a [href]="urlPdf" target="_blank" download class="btn-download" title="Baixar PDF">
              ⬇️ Baixar
            </a>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .pdf-viewer-container {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }

    .pdf-viewer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
      background: #f9fafb;
    }

    .pdf-viewer-header h3 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
    }

    .btn-close {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.5rem;
      color: #6b7280;
      padding: 0;
      width: 2rem;
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .btn-close:hover {
      background: #e5e7eb;
      color: #1f2937;
    }

    .pdf-loading, .pdf-error {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 2rem;
      color: #6b7280;
    }

    .spinner {
      display: inline-block;
      width: 32px;
      height: 32px;
      border: 4px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .pdf-error {
      background: #fef2f2;
      color: #dc2626;
    }

    .error-icon {
      font-size: 2rem;
    }

    .btn-retry {
      padding: 0.5rem 1rem;
      background: #dc2626;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.2s;
    }

    .btn-retry:hover {
      background: #b91c1c;
    }

    .pdf-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #f3f4f6;
    }

    canvas {
      display: block;
      margin: auto;
      max-width: 100%;
      max-height: 100%;
      flex: 1;
      object-fit: contain;
    }

    .pdf-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: white;
      border-top: 1px solid #e5e7eb;
      flex-wrap: wrap;
    }

    .pdf-controls button, .btn-download {
      padding: 0.5rem 1rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.2s;
      text-decoration: none;
      display: inline-block;
    }

    .pdf-controls button:hover, .btn-download:hover {
      background: #2563eb;
    }

    .pdf-controls button:disabled {
      background: #d1d5db;
      cursor: not-allowed;
    }

    .pdf-controls span {
      color: #6b7280;
      font-weight: 500;
      min-width: 150px;
      text-align: center;
    }
  `]
})
export class PdfViewerComponent implements OnInit {
  @Input() urlPdf!: string;
  @Output() fecharModal = new EventEmitter<void>();

  paginaAtual = 1;
  totalPaginas = 0;
  carregando = true;
  erro: string | null = null;
  
  private pdf: any = null;

  constructor(private cdr: ChangeDetectorRef) {
    // Configurar worker do PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js';
  }

  ngOnInit() {
    this.carregarPdf();
  }

  async carregarPdf() {
    try {
      this.carregando = true;
      this.erro = null;
      this.cdr.detectChanges();

      // Garantir que a URL é acessível
      if (!this.urlPdf) {
        throw new Error('URL do PDF não fornecida');
      }

      // Adicionar parâmetro para forçar CORS se necessário
      let urlCorrigida = this.urlPdf;
      if (!urlCorrigida.toLowerCase().endsWith('.pdf')) {
        urlCorrigida += '.pdf';
      }

      this.pdf = await pdfjsLib.getDocument({
        url: urlCorrigida,
        withCredentials: false,
      }).promise;

      this.totalPaginas = this.pdf.numPages;
      this.paginaAtual = 1;
      await this.renderizarPagina();
      this.carregando = false;
      this.cdr.detectChanges();
    } catch (err: any) {
      console.error('Erro ao carregar PDF:', err);
      this.erro = err.message || 'Erro ao carregar o documento PDF. Verifique se o arquivo é válido.';
      this.carregando = false;
      this.cdr.detectChanges();
    }
  }

  async renderizarPagina() {
    try {
      if (!this.pdf) return;

      const pagina = await this.pdf.getPage(this.paginaAtual);
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      const contexto = canvas.getContext('2d') as CanvasRenderingContext2D;

      // Renderizar em qualidade alta
      const escala = window.devicePixelRatio || 1;
      const viewport = pagina.getViewport({ scale: 2 * escala });

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await pagina.render({
        canvasContext: contexto,
        viewport: viewport,
      }).promise;

      this.cdr.detectChanges();
    } catch (err: any) {
      console.error('Erro ao renderizar página:', err);
      this.erro = 'Erro ao renderizar página. Tente novamente.';
      this.cdr.detectChanges();
    }
  }

  async proximaPagina() {
    if (this.paginaAtual < this.totalPaginas) {
      this.paginaAtual++;
      await this.renderizarPagina();
    }
  }

  async paginaAnterior() {
    if (this.paginaAtual > 1) {
      this.paginaAtual--;
      await this.renderizarPagina();
    }
  }

  tentar() {
    this.carregarPdf();
  }

  fechar() {
    this.fecharModal.emit();
  }
}

import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
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
        <div class="pdf-scroll-area">
          <canvas #pdfCanvas></canvas>
        </div>
        
        <div class="pdf-controls">
          <div class="zoom-controls">
            <button (click)="diminuirZoom()" [disabled]="escalaAtual <= escalaMinima" title="Reduzir Zoom">🔍 -</button>
            <span class="zoom-level">{{ porcentagemZoom }}%</span>
            <button (click)="aumentarZoom()" [disabled]="escalaAtual >= escalaMaxima" title="Aumentar Zoom">🔍 +</button>
          </div>

          <div class="separator"></div>

          <button (click)="paginaAnterior()" [disabled]="paginaAtual === 1">← Anterior</button>
          <span>Página {{ paginaAtual }} de {{ totalPaginas }}</span>
          <button (click)="proximaPagina()" [disabled]="paginaAtual === totalPaginas">Próxima →</button>
          
          <a [href]="urlPdf" target="_blank" download class="btn-download" title="Baixar PDF">
            ⬇️ Baixar
          </a>
        </div>
      }
    </div>
  `,
  styles: [`
   :host {
      display: block;
      /* Ocupa exatamente o espaço que o pai (ui-modal) der para ele */
      width: 100%;
      height: 100%;
    }

    :host * {
      box-sizing: border-box !important;
    }

    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .pdf-viewer-container {
      display: flex;
      flex-direction: column;
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 500px;
      
      background: white;
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

    .pdf-scroll-area {
      flex: 1;
      overflow: auto; 
      background: #9ca3af; 
      padding: 1.5rem;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      margin-left: -1.5rem;
      margin-right: -1.5rem;
    }
   
    canvas {
      background: white;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); 
      flex-shrink: 0;
      max-width: none; /* Ignora o tamanho da tela para o zoom funcionar */
    }
    .pdf-controls {
      display: flex;
      flex-wrap: wrap; /* Permite a quebra de linha dos botões */
      justify-content: center;
      align-items: center;
      gap: 8px; /* Era 10px */
      padding: 10px; /* Era 15px */
      background: white;
      border-top: 1px solid #e5e7eb;
      width: 100%;
      max-width: 100%; 
      box-sizing: border-box; /* O padding de 10px está incluso na largura */
      flex-shrink: 0; 
      min-height: 60px; /* Era 70px */
    }
    .pdf-controls > * {
      flex-shrink: 1; 
      max-width: 100%;
    }

    .pdf-controls button, .btn-download {
      padding: 0.5rem 0.75rem; 
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      font-size: 0.875rem;
      transition: background 0.2s;
      text-decoration: none;
      display: inline-block;
      white-space: nowrap; /* Tenta manter o texto numa linha só */
      
      /* Se a tela do celular/modal for ridiculamente pequena, permite ao texto esmagar */
      overflow: hidden; 
      text-overflow: ellipsis;
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
      font-size: 0.875rem;
      text-align: center;
      white-space: nowrap;
    }

    .zoom-controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #f3f4f6;
      padding: 0.25rem;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
      /* Impede que o bloco do zoom quebre antes do necessário */
      flex-shrink: 0; 
    }

    .zoom-controls button {
      background: white;
      color: #374151;
      padding: 0.25rem 0.5rem;
      border: 1px solid #d1d5db;
    }

    .zoom-controls button:hover:not(:disabled) {
      background: #e5e7eb;
      color: #111827;
    }

    .zoom-level {
      min-width: 3rem;
      text-align: center;
      font-size: 0.875rem;
      font-weight: 700;
      color: #4b5563;
    }

    .separator {
      width: 1px;
      height: 24px;
      background: #d1d5db;
      margin: 0 0.5rem;
    }

    .pdf-controls button, 
    .pdf-controls .btn-download, 
    .zoom-controls {
      max-width: 100%; /* Se a tela for minúscula, os botões não vazam */
    }
  `]
})
export class PdfViewerComponent implements AfterViewInit {
  @Input() urlPdf!: string;
  @Output() fecharModal = new EventEmitter<void>();

  paginaAtual = 1;
  totalPaginas = 0;
  carregando = true;
  erro: string | null = null;
  private pdf: any = null;

  // VARIÁVEIS DE ZOOM
  escalaAtual = 1.5; // Começa com o zoom agradável
  escalaMinima = 0.5; // Limite mínimo (50%)
  escalaMaxima = 3.0; // Limite máximo (300%)
  
  // Atalho para mostrar a porcentagem bonitinha no HTML
  get porcentagemZoom() {
    return Math.round(this.escalaAtual * 100);
  }

  // FUNÇÕES DE ZOOM
  async aumentarZoom() {
    if (this.escalaAtual < this.escalaMaxima) {
      this.escalaAtual += 0.25; // Aumenta de 25 em 25%
      await this.renderizarPagina();
    }
  }

  async diminuirZoom() {
    if (this.escalaAtual > this.escalaMinima) {
      this.escalaAtual -= 0.25; // Diminui de 25 em 25%
      await this.renderizarPagina();
    }
  }

  @ViewChild('pdfCanvas', { static: false }) pdfCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(private cdr: ChangeDetectorRef) {
    // Configurar worker do PDF.js para usar a versão local (arquivo copiado para /public)
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  }

  ngAfterViewInit() {
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

      this.carregando = false;
      this.cdr.detectChanges();

      await this.renderizarPagina();
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
      
      // Use o ViewChild em vez do document.querySelector (muito mais seguro)
      const canvas = this.pdfCanvas.nativeElement;
      const contexto = canvas.getContext('2d') as CanvasRenderingContext2D;

      // Renderizar em qualidade alta
      const viewport = pagina.getViewport({ scale: this.escalaAtual});

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

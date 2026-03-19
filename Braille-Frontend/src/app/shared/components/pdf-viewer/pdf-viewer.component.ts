import { Component, Input, Output, EventEmitter, ChangeDetectorRef, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as pdfjsLib from 'pdfjs-dist';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss']
})
export class PdfViewerComponent implements AfterViewInit {
  @Input() urlPdf!: string;
  @Output() fecharModal = new EventEmitter<void>();

  paginaAtual = 1;
  totalPaginas = 0;
  carregando = true;
  erro: string | null = null;
  private pdf: any = null;

  escalaAtual = 1.5; 
  escalaMinima = 0.5; 
  escalaMaxima = 3.0; 
  
  get porcentagemZoom() {
    return Math.round(this.escalaAtual * 100);
  }

  async aumentarZoom() {
    if (this.escalaAtual < this.escalaMaxima) {
      this.escalaAtual += 0.25; 
      await this.renderizarPagina();
    }
  }

  async diminuirZoom() {
    if (this.escalaAtual > this.escalaMinima) {
      this.escalaAtual -= 0.25; 
      await this.renderizarPagina();
    }
  }

  @ViewChild('pdfCanvas', { static: false }) pdfCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(private cdr: ChangeDetectorRef) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

    if (window.innerWidth <= 480) {
      this.escalaAtual = 0.6; // Celular em pé
    } else if (window.innerWidth <= 768) {
      this.escalaAtual = 0.8; // Celular deitado ou tablet
    } else {
      this.escalaAtual = 1.5; // Monitores
    }
  }

  ngAfterViewInit() {
    this.carregarPdf();
  }

  async carregarPdf() {
    try {
      this.carregando = true;
      this.erro = null;
      this.cdr.detectChanges();

      if (!this.urlPdf) {
        throw new Error('URL do PDF não fornecida');
      }

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
      
      const canvas = this.pdfCanvas.nativeElement;
      const contexto = canvas.getContext('2d') as CanvasRenderingContext2D;

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
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  output,
  signal,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PdfViewerComponent implements AfterViewInit {
  @ViewChild('pdfCanvas') private readonly canvasRef?: ElementRef<HTMLCanvasElement>;

  url = input.required<string>();
  fecharModal = output<void>();

  urlDocumento = signal('');
  carregando = signal(false);
  mensagemErro = signal('');
  paginaAtual = signal(1);
  totalPaginas = signal(0);
  zoom = signal(1);

  private readonly destroyRef = inject(DestroyRef);
  private documento: PDFDocumentProxy | null = null;
  private renderTask: RenderTask | null = null;
  private viewInicializada = false;

  constructor() {
    effect((onCleanup) => {
      const controller = new AbortController();
      void this.carregarDocumento(this.url(), controller.signal);
      onCleanup(() => controller.abort());
    });

    this.destroyRef.onDestroy(() => {
      this.cancelarRenderizacao();
      void this.documento?.destroy();
    });
  }

  ngAfterViewInit(): void {
    this.viewInicializada = true;
    void this.renderizarPaginaAtual();
  }

  onClose(): void {
    this.fecharModal.emit();
  }

  paginaAnterior(): void {
    if (this.paginaAtual() <= 1) return;
    this.paginaAtual.update((pagina) => pagina - 1);
    void this.renderizarPaginaAtual();
  }

  proximaPagina(): void {
    if (this.paginaAtual() >= this.totalPaginas()) return;
    this.paginaAtual.update((pagina) => pagina + 1);
    void this.renderizarPaginaAtual();
  }

  diminuirZoom(): void {
    this.zoom.update((valor) => Math.max(0.6, Number((valor - 0.2).toFixed(1))));
    void this.renderizarPaginaAtual();
  }

  aumentarZoom(): void {
    this.zoom.update((valor) => Math.min(2.2, Number((valor + 0.2).toFixed(1))));
    void this.renderizarPaginaAtual();
  }

  private async carregarDocumento(url: string, signal: AbortSignal): Promise<void> {
    const urlLimpa = this.normalizarUrl(url);

    this.cancelarRenderizacao();
    await this.documento?.destroy();
    this.documento = null;
    this.urlDocumento.set(urlLimpa);
    this.mensagemErro.set('');
    this.totalPaginas.set(0);
    this.paginaAtual.set(1);

    if (!urlLimpa) return;

    this.carregando.set(true);

    try {
      const response = await fetch(urlLimpa, {
        signal,
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`Falha ao carregar PDF: ${response.status}`);
      }

      const data = await response.arrayBuffer();
      if (signal.aborted) return;

      this.documento = await pdfjsLib.getDocument({ data }).promise;
      if (signal.aborted) return;

      this.totalPaginas.set(this.documento.numPages);
      this.paginaAtual.set(1);
      await this.renderizarPaginaAtual();
    } catch (error) {
      if (signal.aborted) return;
      console.error('[PdfViewerComponent] Erro ao carregar PDF:', error);
      this.mensagemErro.set('Nao foi possivel carregar o documento no visualizador.');
    } finally {
      if (!signal.aborted) {
        this.carregando.set(false);
      }
    }
  }

  private async renderizarPaginaAtual(): Promise<void> {
    if (!this.viewInicializada || !this.documento || !this.canvasRef) return;

    this.cancelarRenderizacao();

    const pagina = await this.documento.getPage(this.paginaAtual());
    const viewport = pagina.getViewport({ scale: this.zoom() });
    const canvas = this.canvasRef.nativeElement;
    const contexto = canvas.getContext('2d');

    if (!contexto) {
      this.mensagemErro.set('Nao foi possivel preparar a area de visualizacao do documento.');
      return;
    }

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    this.renderTask = pagina.render({
      canvas,
      canvasContext: contexto,
      viewport
    });

    try {
      await this.renderTask.promise;
    } catch (error) {
      if ((error as { name?: string }).name !== 'RenderingCancelledException') {
        throw error;
      }
    } finally {
      this.renderTask = null;
    }
  }

  private normalizarUrl(url: string): string {
    const urlLimpa = url?.trim() ?? '';
    return urlLimpa.startsWith('assets/') ? `/${urlLimpa}` : urlLimpa;
  }

  private cancelarRenderizacao(): void {
    this.renderTask?.cancel();
    this.renderTask = null;
  }
}

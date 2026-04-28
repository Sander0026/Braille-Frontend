import { Component, ChangeDetectionStrategy, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeUrlPipe } from '../../../core/pipes/safe-url.pipe';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule, SafeUrlPipe],
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PdfViewerComponent {
  url = input.required<string>();
  fecharModal = output<void>();

  urlDocumento = signal('');
  urlVisualizadorPdf = signal('');
  carregando = signal(false);
  mensagemErro = signal('');

  private readonly destroyRef = inject(DestroyRef);
  private objectUrl: string | null = null;

  constructor() {
    effect((onCleanup) => {
      const controller = new AbortController();
      void this.prepararPdf(this.url(), controller.signal);
      onCleanup(() => controller.abort());
    });

    this.destroyRef.onDestroy(() => this.revogarObjectUrl());
  }

  onClose(): void {
    this.fecharModal.emit();
  }

  private async prepararPdf(url: string, signal: AbortSignal): Promise<void> {
    const urlLimpa = this.normalizarUrl(url);

    this.revogarObjectUrl();
    this.urlDocumento.set(urlLimpa);
    this.urlVisualizadorPdf.set('');
    this.mensagemErro.set('');

    if (!urlLimpa) return;

    if (!this.deveRenderizarComoBlob(urlLimpa)) {
      this.urlVisualizadorPdf.set(urlLimpa);
      return;
    }

    this.carregando.set(true);

    try {
      const response = await fetch(urlLimpa, {
        signal,
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`Falha ao carregar PDF: ${response.status}`);
      }

      const blob = await response.blob();
      if (signal.aborted) return;

      const pdfBlob = blob.type === 'application/pdf'
        ? blob
        : new Blob([blob], { type: 'application/pdf' });

      this.objectUrl = URL.createObjectURL(pdfBlob);
      this.urlVisualizadorPdf.set(this.objectUrl);
    } catch (error) {
      if (signal.aborted) return;
      console.error('[PdfViewerComponent] Erro ao preparar PDF para visualizacao:', error);
      this.mensagemErro.set('Nao foi possivel carregar o documento no visualizador.');
    } finally {
      if (!signal.aborted) {
        this.carregando.set(false);
      }
    }
  }

  private normalizarUrl(url: string): string {
    const urlLimpa = url?.trim() ?? '';
    return urlLimpa.startsWith('assets/') ? `/${urlLimpa}` : urlLimpa;
  }

  private deveRenderizarComoBlob(url: string): boolean {
    return url.startsWith('/assets/');
  }

  private revogarObjectUrl(): void {
    if (!this.objectUrl) return;
    URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = null;
  }
}

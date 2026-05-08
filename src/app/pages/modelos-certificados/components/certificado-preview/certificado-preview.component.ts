import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragEnd, DragDropModule } from '@angular/cdk/drag-drop';
import {
  CertificadoLayoutElement,
  CertificadoLayoutConfig,
  normalizarCertificadoLayoutConfig
} from '../../../../core/interfaces/certificados.interface';

/** Dimensões fixas do canvas de preview A4 landscape @ 96 dpi */
export const CERT_CANVAS_W = 1122;
export const CERT_CANVAS_H = 794;

export interface DragEndEvent {
  elementId: string;
  x: number;
  y: number;
}

@Component({
  selector: 'app-certificado-preview',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './certificado-preview.component.html',
  styleUrl: './certificado-preview.component.scss'
})
export class CertificadoPreviewComponent implements AfterViewInit, OnDestroy {
  // Configurações e Mídias
  @Input({ required: true }) arteBaseUrl!: string | ArrayBuffer | null;
  @Input() assinaturaUrl: string | ArrayBuffer | null = null;
  @Input() assinaturaUrl2: string | ArrayBuffer | null = null;
  
  @Input() nomeAssinante = '';
  @Input() cargoAssinante = '';
  @Input() nomeAssinante2 = '';
  @Input() cargoAssinante2 = '';
  @Input() textoTemplate = '';
  private layoutConfigNormalizado = normalizarCertificadoLayoutConfig();

  @Input() set layoutConfig(value: Partial<CertificadoLayoutConfig> | null | undefined) {
    this.layoutConfigNormalizado = normalizarCertificadoLayoutConfig(value);
  }

  get layoutConfig(): CertificadoLayoutConfig {
    return this.layoutConfigNormalizado;
  }

  get layoutElements(): CertificadoLayoutElement[] {
    return [...(this.layoutConfig.elements || [])]
      .filter(element => element.visible !== false)
      .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  }

  /** Se true, os elementos podem ser arrastados. */
  @Input() isDraggable = false;
  /** Se true, substitui {{tags}} por dados fictícios para visualização. */
  @Input() applyMocks = false;

  @Output() dragEnded = new EventEmitter<DragEndEvent>();

  @ViewChild('previewWrapper') previewWrapper?: ElementRef<HTMLElement>;
  @ViewChild('previewContainer') previewContainer?: ElementRef<HTMLElement>;

  readonly CANVAS_W = CERT_CANVAS_W;
  readonly CANVAS_H = CERT_CANVAS_H;

  // Estado via Signals
  canvasHeight = signal<number>(CERT_CANVAS_H);
  scaleFactor = signal<number>(1);
  wrapperHeightPx = computed(() => `${Math.round(this.canvasHeight() * this.scaleFactor())}px`);

  private _resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    if (this.previewWrapper) {
      this._resizeObserver = new ResizeObserver(() => this._recalcularScale());
      this._resizeObserver.observe(this.previewWrapper.nativeElement);
      // Timeout garante que o ciclo de renderização atualizou o tamanho
      setTimeout(() => this._recalcularScale(), 0);
    }
  }

  ngOnDestroy(): void {
    this._resizeObserver?.disconnect();
  }

  private _recalcularScale(): void {
    const el = this.previewWrapper?.nativeElement;
    if (!el) return;
    const w = el.clientWidth || this.CANVAS_W;
    this.scaleFactor.set(Math.min(1, w / this.CANVAS_W));
  }

  get displayTextoTemplate(): string {
    return this.renderMockText(this.textoTemplate || '') || (this.isDraggable ? '(texto do certificado aparecerá aqui)' : '');
  }

  renderElementContent(element: CertificadoLayoutElement): string {
    if (element.type === 'DYNAMIC_TEXT' && element.content === '{{TEXTO_CERTIFICADO}}') {
      return this.displayTextoTemplate;
    }

    return this.renderMockText(element.content || '');
  }

  private renderMockText(value: string): string {
    let t = value || '';
    if (this.applyMocks && t) {
      t = t.replace(/\{\{ALUNO\}\}/gi, 'Maria da Silva Santos')
           .replace(/\{\{NOME_ALUNO\}\}/gi, 'Maria da Silva Santos')
           .replace(/\{\{TURMA\}\}/gi, 'Braille Nível I')
           .replace(/\{\{CURSO\}\}/gi, 'Braille Nível I')
           .replace(/\{\{NOME_CURSO\}\}/gi, 'Braille Nivel I')
           .replace(/\{\{CARGA_HORARIA\}\}/gi, '40')
           .replace(/\{\{CH\}\}/gi, '40')
           .replace(/\{\{DATA_INICIO\}\}/gi, '03/01/2025')
           .replace(/\{\{DATA_FIM\}\}/gi, '28/03/2025')
           .replace(/\{\{DATA_EMISSAO\}\}/gi, new Date().toLocaleDateString('pt-BR'))
           .replace(/\{\{PARCEIRO\}\}/gi, 'Empresa Solidária LTDA')
           .replace(/\{\{MOTIVO\}\}/gi, 'Apoio contínuo à inclusão')
           .replace(/\{\{DATA\}\}/gi, new Date().toLocaleDateString('pt-BR'))
           .replace(/\{\{CODIGO_CERTIFICADO\}\}/gi, 'A1B2C3D4')
           .replace(/\{\{CODIGO_VALIDACAO\}\}/gi, 'A1B2C3D4')
           .replace(/\{\{NOME_INSTITUICAO\}\}/gi, 'Instituto Luiz Braille')
           .replace(/\{\{NOME_RESPONSAVEL\}\}/gi, this.nomeAssinante || 'Signatario 1')
           .replace(/\{\{CARGO_RESPONSAVEL\}\}/gi, this.cargoAssinante || 'Cargo')
           .replace(/\{\{NOME_RESPONSAVEL_2\}\}/gi, this.nomeAssinante2 || 'Signatario 2')
           .replace(/\{\{CARGO_RESPONSAVEL_2\}\}/gi, this.cargoAssinante2 || 'Cargo')
           .replace(/\{\{TEXTO_CERTIFICADO\}\}/gi, this.textoTemplate || '')
           .replace(/\{\{[^}]+\}\}/g, '[...]');
    }
    return t;
  }

  signatureImageFor(element: CertificadoLayoutElement): string | ArrayBuffer | null {
    if (this.isSecondSignatureElement(element) && this.assinaturaUrl2) {
      return this.assinaturaUrl2;
    }

    return this.assinaturaUrl || this.assinaturaUrl2 || null;
  }

  signatureTextFor(element: CertificadoLayoutElement): string {
    const renderedContent = this.renderElementContent(element).trim();
    if (renderedContent) return renderedContent;

    if (this.isSecondSignatureElement(element)) {
      return [this.nomeAssinante2, this.cargoAssinante2].filter(Boolean).join('\n');
    }

    return [this.nomeAssinante, this.cargoAssinante].filter(Boolean).join('\n');
  }

  private isSecondSignatureElement(element: CertificadoLayoutElement): boolean {
    const marker = `${element.id} ${element.label} ${element.content || ''}`.toLowerCase();
    return marker.includes('assinatura-2') || marker.includes('assinatura 2') || marker.includes('segunda');
  }

  onArteBaseLoad(event: Event): void {
    const image = event.target as HTMLImageElement | null;
    if (!image?.naturalWidth || !image?.naturalHeight) return;

    const aspectHeight = Math.round((this.CANVAS_W * image.naturalHeight) / image.naturalWidth);
    if (aspectHeight > 0 && Number.isFinite(aspectHeight)) {
      this.canvasHeight.set(aspectHeight);
      this._recalcularScale();
    }
  }

  onDynamicDragEnded(event: CdkDragEnd, element: CertificadoLayoutElement) {
    this.emitDragPosition(event, { elementId: element.id });
  }

  private emitDragPosition(event: CdkDragEnd, target: Pick<DragEndEvent, 'elementId'>) {
    if (!this.isDraggable) return;

    const element = event.source.element.nativeElement;
    const container = this.previewContainer?.nativeElement || element.closest('.preview-drag-container');
    if (!container) return;

    const scale = this.scaleFactor() || 1;
    const contRect = container.getBoundingClientRect();
    const elRect   = element.getBoundingClientRect();

    const rawXPx = (elRect.left - contRect.left) / scale;
    const rawYPx = (elRect.top  - contRect.top)  / scale;

    const xPct = Math.max(0, Math.min((rawXPx / this.CANVAS_W) * 100, 90));
    const yPct = Math.max(0, Math.min((rawYPx / this.canvasHeight()) * 100, 90));

    this.dragEnded.emit({
      ...target,
      x: Math.round(xPct * 10) / 10,
      y: Math.round(yPct * 10) / 10
    });

    setTimeout(() => event.source.reset(), 0);
  }
}

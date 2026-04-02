import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragEnd, DragDropModule } from '@angular/cdk/drag-drop';

/** Dimensões fixas do canvas de preview A4 landscape @ 96 dpi */
export const CERT_CANVAS_W = 1122;
export const CERT_CANVAS_H = 794;

export interface DragEndEvent {
  field: string;
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
  @Input() layoutConfig: any = {};
  
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
  scaleFactor = signal<number>(1);
  wrapperHeightPx = computed(() => `${Math.round(this.CANVAS_H * this.scaleFactor())}px`);

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
    let t = this.textoTemplate || '';
    if (this.applyMocks && t) {
      t = t.replace(/\{\{ALUNO\}\}/gi, 'Maria da Silva Santos')
           .replace(/\{\{NOME_ALUNO\}\}/gi, 'Maria da Silva Santos')
           .replace(/\{\{TURMA\}\}/gi, 'Braille Nível I')
           .replace(/\{\{CURSO\}\}/gi, 'Braille Nível I')
           .replace(/\{\{CARGA_HORARIA\}\}/gi, '40')
           .replace(/\{\{DATA_INICIO\}\}/gi, '03/01/2025')
           .replace(/\{\{DATA_FIM\}\}/gi, '28/03/2025')
           .replace(/\{\{DATA_EMISSAO\}\}/gi, new Date().toLocaleDateString('pt-BR'))
           .replace(/\{\{PARCEIRO\}\}/gi, 'Empresa Solidária LTDA')
           .replace(/\{\{MOTIVO\}\}/gi, 'Apoio contínuo à inclusão')
           .replace(/\{\{DATA\}\}/gi, new Date().toLocaleDateString('pt-BR'))
           .replace(/\{\{[^}]+\}\}/g, '[...]');
    }
    return t || (this.isDraggable ? '(texto do certificado aparecerá aqui)' : '');
  }

  onDragEnded(event: CdkDragEnd, field: string) {
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
    const yPct = Math.max(0, Math.min((rawYPx / this.CANVAS_H) * 100, 90));

    this.dragEnded.emit({
      field,
      x: Math.round(xPct * 10) / 10,
      y: Math.round(yPct * 10) / 10
    });

    setTimeout(() => event.source.reset(), 0);
  }
}

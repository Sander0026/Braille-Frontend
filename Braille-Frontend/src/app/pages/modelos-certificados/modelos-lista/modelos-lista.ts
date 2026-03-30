import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, NgStyle } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ModelosCertificadosService, ModeloCertificado } from '../../../core/services/modelos-certificados.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { ToastService } from '../../../core/services/toast.service';

/** Dimensões do canvas de preview — mesmas constantes do editor (modelos-form.ts) */
const CANVAS_W = 1122;
const CANVAS_H = 794;

@Component({
  selector: 'app-modelos-lista',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NgStyle, RouterModule],
  templateUrl: './modelos-lista.html',
  styleUrl: './modelos-lista.scss',
})
export class ModelosLista implements OnInit, OnDestroy {
  modelos: ModeloCertificado[] = [];
  isLoading = true;
  erro = '';

  readonly CANVAS_W = CANVAS_W;
  readonly CANVAS_H = CANVAS_H;

  // ── Preview ────────────────────────────────────────────────
  modeloPreview: ModeloCertificado | null = null;
  scaleFactor = 1;

  @ViewChild('previewModalWrapper') previewModalWrapper?: ElementRef<HTMLElement>;

  private _resizeObs?: ResizeObserver;

  constructor(
    private modelosService: ModelosCertificadosService,
    private confirmDialog: ConfirmDialogService,
    private toast: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarModelos();
  }

  ngOnDestroy(): void {
    this._resizeObs?.disconnect();
  }

  private _recalcScale(): void {
    const el = this.previewModalWrapper?.nativeElement;
    if (!el) return;
    const w = el.clientWidth || CANVAS_W;
    this.scaleFactor = Math.min(1, w / CANVAS_W);
    el.style.height = Math.round(CANVAS_H * this.scaleFactor) + 'px';
    this.cdr.markForCheck();
  }

  carregarModelos(): void {
    this.isLoading = true;
    this.erro = '';
    
    this.modelosService.listar().subscribe({
      next: (res: any) => {
        this.modelos = res;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.erro = 'Não foi possível carregar os modelos de certificado.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  novoModelo(): void {
    this.router.navigate(['/admin/modelos-certificados/novo']);
  }

  editarModelo(id: string): void {
    this.router.navigate(['/admin/modelos-certificados/editar', id]);
  }

  abrirPreview(modelo: ModeloCertificado): void {
    this.modeloPreview = modelo;
    this.cdr.markForCheck();
    // Aguarda o DOM renderizar o modal para registrar o ResizeObserver
    setTimeout(() => {
      const el = this.previewModalWrapper?.nativeElement;
      if (!el) return;
      this._resizeObs?.disconnect();
      this._resizeObs = new ResizeObserver(() => this._recalcScale());
      this._resizeObs.observe(el);
      this._recalcScale();
    }, 50);
  }

  fecharPreview(): void {
    this._resizeObs?.disconnect();
    this.modeloPreview = null;
    this.cdr.markForCheck();
  }

  /** Substitui as tags dinâmicas por valores de exemplo para o preview visual */
  textoComPlaceholders(template: string): string {
    return template
      .replace(/\{\{NOME_ALUNO\}\}/gi,  'Maria da Silva Santos')
      .replace(/\{\{TURMA\}\}/gi,       'Braille Nível I')
      .replace(/\{\{CURSO\}\}/gi,       'Braille Nível I')
      .replace(/\{\{CARGA_HORARIA\}\}/gi, '40')
      .replace(/\{\{DATA_INICIO\}\}/gi,  '03/01/2025')
      .replace(/\{\{DATA_FIM\}\}/gi,     '28/03/2025')
      .replace(/\{\{DATA_EMISSAO\}\}/gi, new Date().toLocaleDateString('pt-BR'))
      .replace(/\{\{[^}]+\}\}/g,         '[...]'); // fallback para outras tags
  }

  @HostListener('keydown.escape')
  onEsc(): void {
    if (this.modeloPreview) this.fecharPreview();
  }

  async excluirModelo(modelo: ModeloCertificado): Promise<void> {
    const ok = await this.confirmDialog.confirmar({
      titulo: 'Excluir Modelo',
      mensagem: `Tem certeza que deseja excluir o modelo "${modelo.nome}"? Esta ação não pode ser desfeita.`,
      textoBotaoConfirmar: 'Sim, excluir',
      tipo: 'warning',
    });
    
    if (!ok) return;

    this.modelosService.excluir(modelo.id).subscribe({
      next: () => {
        this.toast.sucesso('Modelo excluído com sucesso!');
        this.carregarModelos();
      },
      error: (err: any) => {
        const msg = err.error?.message || 'Erro ao excluir o modelo. Talvez ele já esteja em uso por alguma turma.';
        this.toast.erro(typeof msg === 'string' ? msg : msg[0]);
      }
    });
  }
}

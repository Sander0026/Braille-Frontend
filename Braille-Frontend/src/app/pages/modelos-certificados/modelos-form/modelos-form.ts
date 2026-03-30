import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ModelosCertificadosService, ModeloCertificado } from '../../../core/services/modelos-certificados.service';
import { ToastService } from '../../../core/services/toast.service';
import { BaseFormDescarte } from '../../../shared/classes/base-form-descarte';
import { CdkDragEnd, DragDropModule } from '@angular/cdk/drag-drop';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';

/** Dimensões fixas do canvas de preview (proporcional A4 landscape @ 96 dpi) */
const CANVAS_W = 1122;
const CANVAS_H = 794;

@Component({
  selector: 'app-modelos-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, DragDropModule, FormsModule],
  templateUrl: './modelos-form.html',
  styleUrl: './modelos-form.scss' // Vamos usar o CSS direto no HTML/SCSS genérico se precisar
})
export class ModelosForm extends BaseFormDescarte implements OnInit, AfterViewInit, OnDestroy {
  formModelo!: FormGroup;
  modoEdicao = false;
  modeloId = '';
  isSalvando = false;
  modeloEditado: ModeloCertificado | null = null;
  passoAtual = 1;

  arteBaseFile: File | null = null;
  assinaturaFile: File | null = null;
  assinatura2File: File | null = null;

  previewBaseUrl: string | ArrayBuffer | null = null;
  assinaturaPreviewUrl: string | ArrayBuffer | null = null;
  assinatura2PreviewUrl: string | ArrayBuffer | null = null;

  layoutConfig: any = {
    textoPronto: { x: 10, y: 20, fontSize: 32, color: '#1a1a00', maxWidth: 80, fontFamily: 'Helvetica' },
    nomeAluno:   { x: 10, y: 45, fontSize: 60, color: '#000000', maxWidth: 80, fontFamily: 'Great Vibes' },
    assinatura1: { x: 20, y: 70, width: 20 },
    assinatura2: { x: 60, y: 70, width: 20 },
    qrCode:      { x: 80, y: 80, size: 10 },
  };

  /** Fator de escala atual do canvas de preview */
  scaleFactor = 1;

  /** Dimensões do canvas exportadas para o template */
  readonly CANVAS_W = CANVAS_W;
  readonly CANVAS_H = CANVAS_H;

  @ViewChild('textoTemplateInput') textoTemplateInput!: ElementRef<HTMLTextAreaElement>;
  /** O canvas interno com tamanho fixo A4 */
  @ViewChild('previewContainer')   previewContainer!: ElementRef<HTMLElement>;
  /** O wrapper externo que determina a largura disponível */
  @ViewChild('previewWrapper')     previewWrapper!: ElementRef<HTMLElement>;

  private _resizeObserver?: ResizeObserver;

  constructor(
    private fb: FormBuilder,
    private modelosService: ModelosCertificadosService,
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {
    super();
  }

  ngAfterViewInit(): void {
    if (this.previewWrapper) {
      this._resizeObserver = new ResizeObserver(() => this._recalcularScale());
      this._resizeObserver.observe(this.previewWrapper.nativeElement);
      this._recalcularScale();
    }
  }

  ngOnDestroy(): void {
    this._resizeObserver?.disconnect();
  }

  private _recalcularScale(): void {
    if (!this.previewWrapper) return;
    const wrapperW = this.previewWrapper.nativeElement.clientWidth || CANVAS_W;
    this.scaleFactor = Math.min(1, wrapperW / CANVAS_W);
    // Atualiza a altura do wrapper para reservar o espaço correto
    const wrapper = this.previewWrapper.nativeElement;
    wrapper.style.height = Math.round(CANVAS_H * this.scaleFactor) + 'px';
    this.cdr.detectChanges();
  }

  isFormDirty(): boolean {
    return this.formModelo?.dirty && !this.isSalvando;
  }

  ngOnInit(): void {
    this.formModelo = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      tipo: ['ACADEMICO', Validators.required],
      nomeAssinante: ['', Validators.required],
      cargoAssinante: ['', Validators.required],
      nomeAssinante2: [''],
      cargoAssinante2: [''],
      textoTemplate: ['', [Validators.required, Validators.minLength(20)]]
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.modoEdicao = true;
        this.modeloId = id;
        this.carregarModelo(id);
      }
    });
  }

  carregarModelo(id: string): void {
    this.modelosService.buscarPorId(id).subscribe({
      next: (modelo: ModeloCertificado) => {
        this.modeloEditado = modelo;
        this.formModelo.patchValue({
          nome: modelo.nome,
          tipo: modelo.tipo,
          nomeAssinante: modelo.nomeAssinante,
          cargoAssinante: modelo.cargoAssinante,
          nomeAssinante2: modelo.nomeAssinante2 || '',
          cargoAssinante2: modelo.cargoAssinante2 || '',
          textoTemplate: modelo.textoTemplate
        });
        
        this.previewBaseUrl = modelo.arteBaseUrl;
        this.assinaturaPreviewUrl = modelo.assinaturaUrl;
        this.assinatura2PreviewUrl = modelo.assinaturaUrl2 || null;

        if (modelo.layoutConfig) {
          // Merge pra não perder propriedades que talvez não existissem no BD antigo
          this.layoutConfig = { ...this.layoutConfig, ...modelo.layoutConfig };
        }
      },
      error: () => this.toast.erro('Não foi possível encontrar o modelo solicitado.')
    });
  }

  onFileChange(event: any, field: 'arteBase' | 'assinatura' | 'assinatura2'): void {
    const file = event.target.files[0];
    if (file) {
      if (field === 'arteBase') {
        this.arteBaseFile = file;
        const reader = new FileReader();
        reader.onload = e => this.previewBaseUrl = reader.result;
        reader.readAsDataURL(file);
      }
      if (field === 'assinatura') {
        this.assinaturaFile = file;
        const reader = new FileReader();
        reader.onload = e => this.assinaturaPreviewUrl = reader.result;
        reader.readAsDataURL(file);
      }
      if (field === 'assinatura2') {
        this.assinatura2File = file;
        const reader = new FileReader();
        reader.onload = e => this.assinatura2PreviewUrl = reader.result;
        reader.readAsDataURL(file);
      }
      this.formModelo.markAsDirty();
    }
  }

  injetarTag(tag: string): void {
    const el = this.textoTemplateInput.nativeElement;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = this.formModelo.get('textoTemplate')?.value || '';

    const newText = text.substring(0, start) + tag + text.substring(end);
    
    this.formModelo.patchValue({ textoTemplate: newText });
    this.formModelo.markAsDirty();

    // Restaura foco e cursor proximo à tag inserida
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.formModelo.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  salvar(): void {
    if (this.formModelo.invalid || this.isSalvando) {
      this.formModelo.markAllAsTouched();
      return;
    }

    if (!this.modoEdicao && (!this.arteBaseFile || !this.assinaturaFile)) {
      this.toast.erro('Para o primeiro cadastro, as imagens de Fundo e Assinatura são obrigatórias.');
      return;
    }

    this.isSalvando = true;
    const formData = new FormData();
    const v = this.formModelo.value;

    formData.append('nome', v.nome);
    formData.append('tipo', v.tipo);
    formData.append('nomeAssinante', v.nomeAssinante);
    formData.append('cargoAssinante', v.cargoAssinante);
    
    if (v.nomeAssinante2) formData.append('nomeAssinante2', v.nomeAssinante2);
    if (v.cargoAssinante2) formData.append('cargoAssinante2', v.cargoAssinante2);
    
    formData.append('textoTemplate', v.textoTemplate);

    if (this.arteBaseFile) formData.append('arteBase', this.arteBaseFile);
    if (this.assinaturaFile) formData.append('assinatura', this.assinaturaFile);
    if (this.assinatura2File) formData.append('assinatura2', this.assinatura2File);

    formData.append('layoutConfig', JSON.stringify(this.layoutConfig));

    const requisicao$ = this.modoEdicao 
      ? this.modelosService.atualizar(this.modeloId, formData)
      : this.modelosService.criar(formData);

    requisicao$.subscribe({
      next: () => {
        this.isSalvando = false;
        this.formModelo.markAsPristine(); // Bypass form guard
        this.toast.sucesso(`Modelo de certificado ${this.modoEdicao ? 'atualizado' : 'criado'} com sucesso!`);
        this.router.navigate(['/admin/modelos-certificados']);
      },
      error: (err: any) => {
        this.isSalvando = false;
        const msg = err.error?.message || 'Erro ao comunicar com o servidor.';
        this.toast.erro(typeof msg === 'string' ? msg : msg[0]);
        this.cdr.markForCheck();
      }
    });
  }

  onDragEnded(event: CdkDragEnd, field: string) {
    const element = event.source.element.nativeElement;
    const container: HTMLElement | null =
      this.previewContainer?.nativeElement ?? element.closest('.preview-drag-container');

    if (!container) return;

    // getBoundingClientRect devolve coordenadas visuais (já escaladas pelo browser).
    // Dividir pelo scaleFactor converte de volta para o espaço do canvas fixo.
    const scale = this.scaleFactor || 1;
    const contRect = container.getBoundingClientRect();
    const elRect   = element.getBoundingClientRect();

    const rawXPx = (elRect.left - contRect.left) / scale;
    const rawYPx = (elRect.top  - contRect.top)  / scale;

    const xPct = Math.max(0, Math.min((rawXPx / CANVAS_W) * 100, 90));
    const yPct = Math.max(0, Math.min((rawYPx / CANVAS_H) * 100, 90));

    if (this.layoutConfig[field]) {
      this.layoutConfig[field].x = Math.round(xPct * 10) / 10;
      this.layoutConfig[field].y = Math.round(yPct * 10) / 10;
      this.formModelo.markAsDirty();
      setTimeout(() => event.source.reset(), 0);
    }
  }

  setTextAlign(align: 'left' | 'center' | 'right' | 'justify') {
    this.layoutConfig.textoPronto.textAlign = align;
    this.formModelo.markAsDirty();
  }

  setFontSize(event: Event) {
    const val = Number((event.target as HTMLInputElement).value);
    if (val >= 8 && val <= 120) {
      this.layoutConfig.textoPronto.fontSize = val;
      this.formModelo.markAsDirty();
    }
  }
  setNomeAlunoFontSize(event: Event) {
    const val = Number((event.target as HTMLInputElement).value);
    if (val >= 8 && val <= 200) {
      this.layoutConfig.nomeAluno.fontSize = val;
      this.formModelo.markAsDirty();
    }
  }

  setNomeAlunoColor(event: Event) {
    this.layoutConfig.nomeAluno.color = (event.target as HTMLInputElement).value;
    this.formModelo.markAsDirty();
  }

  setTextoColor(event: Event) {
    this.layoutConfig.textoPronto.color = (event.target as HTMLInputElement).value;
    this.formModelo.markAsDirty();
  }

  proximoPasso() {
    if (this.passoAtual === 1) {
      if (this.formModelo.get('nome')?.invalid || this.formModelo.get('tipo')?.invalid) {
        this.formModelo.get('nome')?.markAsTouched();
        this.formModelo.get('tipo')?.markAsTouched();
        this.toast.aviso('Por favor, preencha o nome e a categoria antes de prosseguir.');
        return;
      }
    }
    if (this.passoAtual < 4) {
      this.passoAtual++;
      window.scrollTo(0, 0);
    }
  }

  passoAnterior() {
    if (this.passoAtual > 1) {
      this.passoAtual--;
      window.scrollTo(0, 0);
    }
  }
}

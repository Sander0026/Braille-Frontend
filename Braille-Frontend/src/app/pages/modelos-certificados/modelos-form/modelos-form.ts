import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild, inject, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';

import { ModelosCertificadosService, ModeloCertificado } from '../../../core/services/modelos-certificados.service';
import { ToastService } from '../../../core/services/toast.service';
import { BaseFormDescarte } from '../../../shared/classes/base-form-descarte';
import { CertificadoPreviewComponent, DragEndEvent } from '../components/certificado-preview/certificado-preview.component';

@Component({
  selector: 'app-modelos-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule, CertificadoPreviewComponent],
  templateUrl: './modelos-form.html',
  styleUrl: './modelos-form.scss' 
})
export class ModelosForm extends BaseFormDescarte implements OnInit {
  formModelo!: FormGroup;
  modoEdicao = signal(false);
  modeloId = signal('');
  isSalvando = signal(false);
  passoAtual = signal(1);

  arteBaseFile: File | null = null;
  assinaturaFile: File | null = null;
  assinatura2File: File | null = null;

  previewBaseUrl = signal<string | ArrayBuffer | null>(null);
  assinaturaPreviewUrl = signal<string | ArrayBuffer | null>(null);
  assinatura2PreviewUrl = signal<string | ArrayBuffer | null>(null);

  layoutConfig: any = {
    textoPronto: { x: 10, y: 20, fontSize: 32, color: '#1a1a00', maxWidth: 80, fontFamily: 'Helvetica' },
    nomeAluno:   { x: 10, y: 45, fontSize: 60, color: '#000000', maxWidth: 80, fontFamily: 'Great Vibes' },
    assinatura1: { x: 20, y: 70, width: 20 },
    assinatura2: { x: 60, y: 70, width: 20 },
    qrCode:      { x: 80, y: 80, size: 10 },
  };

  @ViewChild('textoTemplateInput') textoTemplateInput!: ElementRef<HTMLTextAreaElement>;

  // Injecao de dependências
  private readonly fb = inject(FormBuilder);
  private readonly modelosService = inject(ModelosCertificadosService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    super();
  }

  isFormDirty(): boolean {
    return this.formModelo?.dirty && !this.isSalvando();
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

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.modoEdicao.set(true);
        this.modeloId.set(id);
        this.carregarModelo(id);
      }
    });
  }

  carregarModelo(id: string): void {
    this.modelosService.buscarPorId(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (modelo: ModeloCertificado) => {
          this.formModelo.patchValue({
            nome: modelo.nome,
            tipo: modelo.tipo,
            nomeAssinante: modelo.nomeAssinante,
            cargoAssinante: modelo.cargoAssinante,
            nomeAssinante2: modelo.nomeAssinante2 || '',
            cargoAssinante2: modelo.cargoAssinante2 || '',
            textoTemplate: modelo.textoTemplate
          });
          
          this.previewBaseUrl.set(modelo.arteBaseUrl);
          this.assinaturaPreviewUrl.set(modelo.assinaturaUrl);
          if (modelo.assinaturaUrl2) {
            this.assinatura2PreviewUrl.set(modelo.assinaturaUrl2);
          }

          if (modelo.layoutConfig) {
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
        reader.onload = e => this.previewBaseUrl.set(reader.result);
        reader.readAsDataURL(file);
      }
      if (field === 'assinatura') {
        this.assinaturaFile = file;
        const reader = new FileReader();
        reader.onload = e => this.assinaturaPreviewUrl.set(reader.result);
        reader.readAsDataURL(file);
      }
      if (field === 'assinatura2') {
        this.assinatura2File = file;
        const reader = new FileReader();
        reader.onload = e => this.assinatura2PreviewUrl.set(reader.result);
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
    if (this.formModelo.invalid || this.isSalvando()) {
      this.formModelo.markAllAsTouched();
      return;
    }

    if (!this.modoEdicao() && (!this.arteBaseFile || !this.assinaturaFile)) {
      this.toast.erro('Para o primeiro cadastro, as imagens de Fundo e Assinatura são obrigatórias.');
      return;
    }

    this.isSalvando.set(true);
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

    const requisicao$ = this.modoEdicao() 
      ? this.modelosService.atualizar(this.modeloId(), formData)
      : this.modelosService.criar(formData);

    requisicao$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSalvando.set(false);
          this.formModelo.markAsPristine();
          this.toast.sucesso(`Modelo de certificado ${this.modoEdicao() ? 'atualizado' : 'criado'} com sucesso!`);
          this.router.navigate(['/admin/modelos-certificados']);
        },
        error: (err: any) => {
          this.isSalvando.set(false);
          const msg = err.error?.message || 'Erro ao comunicar com o servidor.';
          this.toast.erro(typeof msg === 'string' ? msg : msg[0]);
        }
      });
  }

  onDragEndedOutput(event: DragEndEvent): void {
    if (this.layoutConfig[event.field]) {
      this.layoutConfig[event.field].x = event.x;
      this.layoutConfig[event.field].y = event.y;
      this.formModelo.markAsDirty();
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
    if (this.passoAtual() === 1) {
      if (this.formModelo.get('nome')?.invalid || this.formModelo.get('tipo')?.invalid) {
        this.formModelo.get('nome')?.markAsTouched();
        this.formModelo.get('tipo')?.markAsTouched();
        this.toast.aviso('Por favor, preencha o nome e a categoria antes de prosseguir.');
        return;
      }
    }
    if (this.passoAtual() < 4) {
      this.passoAtual.update(p => p + 1);
      window.scrollTo(0, 0);
    }
  }

  passoAnterior() {
    if (this.passoAtual() > 1) {
      this.passoAtual.update(p => p - 1);
      window.scrollTo(0, 0);
    }
  }
}

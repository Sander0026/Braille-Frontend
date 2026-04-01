import { Component, OnInit, signal, inject, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ComunicadosService, Comunicado } from '../../../../../core/services/comunicados.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { QuillModule } from 'ngx-quill';
import { BaseFormDescarte } from '../../../../../shared/classes/base-form-descarte';
import { HtmlSanitizerUtil } from '../../../../../shared/utils/html-sanitizer.util';
import { A11yModule } from '@angular/cdk/a11y';

@Component({
  selector: 'app-comunicados-lista',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuillModule, A11yModule],
  templateUrl: './comunicados-lista.html',
  styleUrl: './comunicados-lista.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComunicadosLista extends BaseFormDescarte implements OnInit {
  // Signals Reativos (Sem necessidade de ChangeDetectorRef)
  comunicados = signal<Comunicado[]>([]);
  isLoading = signal<boolean>(true);
  erro = signal<string>('');
  mostrarModal = signal<boolean>(false);
  editando = signal<Comunicado | null>(null);
  salvando = signal<boolean>(false);
  fotoPreview = signal<string | null>(null);
  comunicadoParaExcluir = signal<Comunicado | null>(null);

  // Acessibilidade: WCAG 2.4.3
  lastFocusBeforeModal: HTMLElement | null = null;
  fotoSelecionada: File | null = null;

  form: FormGroup;
  
  // Injeção de dependências moderna e limpa
  private readonly destroyRef = inject(DestroyRef);
  private readonly comunicadosService = inject(ComunicadosService);
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly CATEGORIAS = [
    { valor: 'NOTICIA', label: 'Notícia' },
    { valor: 'VAGA_EMPREGO', label: 'Vaga PCD' },
    { valor: 'SERVICO', label: 'Serviço' },
    { valor: 'EVENTO_CULTURAL', label: 'Evento Cultural' },
    { valor: 'LEGISLACAO', label: 'Legislação' },
    { valor: 'GERAL', label: 'Aviso Geral' },
  ];

  constructor() {
    super();
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(5)]],
      conteudo: ['', [Validators.required, Validators.minLength(10)]],
      categoria: ['GERAL', [Validators.required]],
      fixado: [false]
    });
  }

  isFormDirty(): boolean {
    return this.mostrarModal() && this.form.dirty && !this.salvando();
  }

  ngOnInit(): void {
    this.carregar();
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if (params['novo'] === 'true') {
        setTimeout(() => this.novo(params['categoria']), 100);
      }
    });
  }

  carregar(): void {
    this.isLoading.set(true);
    this.erro.set('');
    
    this.comunicadosService.listar(1, 100).pipe(
      takeUntilDestroyed(this.destroyRef) // Prevenindo vazamentos de memória (Memory Leaks)
    ).subscribe({
      next: (res: any) => {
        this.comunicados.set(res.data || res);
        this.isLoading.set(false);
      },
      error: () => { 
        this.erro.set('Erro ao carregar comunicados.'); 
        this.isLoading.set(false); 
      }
    });
  }

  novo(categoriaDefault: string = 'GERAL'): void {
    this.lastFocusBeforeModal = document.activeElement as HTMLElement;
    this.editando.set(null);
    this.form.reset({ categoria: categoriaDefault, fixado: false });
    this.fotoSelecionada = null;
    this.fotoPreview.set(null);
    this.mostrarModal.set(true);
  }

  editar(c: Comunicado): void {
    this.lastFocusBeforeModal = document.activeElement as HTMLElement;
    this.editando.set(c);
    this.form.patchValue({
      titulo: c.titulo,
      conteudo: c.conteudo,
      categoria: c.categoria || 'GERAL',
      fixado: c.fixado || false
    });
    this.fotoSelecionada = null;
    this.fotoPreview.set(c.imagemCapa || null);
    this.mostrarModal.set(true);
  }

  onFotoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { 
        this.toast.erro('A imagem deve ter no máximo 2MB'); 
        return; 
      }
      this.fotoSelecionada = file;
      const reader = new FileReader();
      reader.onload = () => this.fotoPreview.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  removerFotoDaPrevia(): void {
    this.fotoPreview.set(null);
    this.fotoSelecionada = null;
  }

  async fecharModal(forcar = false): Promise<void> {
    if (forcar || await this.podeDescartar()) {
      this.mostrarModal.set(false);
      this.editando.set(null);
      this.form.reset();
      setTimeout(() => this.lastFocusBeforeModal?.focus(), 0);
    }
  }

  async salvar(): Promise<void> {
    if (this.form.invalid) return;
    this.salvando.set(true);

    try {
      let imagemCapaUrl: string | null | undefined = undefined;
      const ed = this.editando();

      if (this.fotoSelecionada) {
        const token = localStorage.getItem('token') || '';
        const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
        const fd = new FormData();
        fd.append('file', this.fotoSelecionada);
        // FIXME: Poderia virar um FileUploadService abstraído
        const uploadRes = await firstValueFrom(
          this.http.post<{ url: string }>(`/api/upload`, fd, { headers })
        );
        imagemCapaUrl = uploadRes.url;
      } else if (this.fotoPreview() === null && ed?.imagemCapa) {
        imagemCapaUrl = null;
      } else if (ed?.imagemCapa) {
        imagemCapaUrl = ed.imagemCapa;
      }

      const payload: Record<string, any> = {
        titulo: this.form.value.titulo,
        conteudo: this.form.value.conteudo,
        categoria: this.form.value.categoria,
        fixado: Boolean(this.form.value.fixado),
      };
      
      if (imagemCapaUrl !== undefined) {
        payload['imagemCapa'] = imagemCapaUrl;
      }

      if (ed) {
        await firstValueFrom(this.comunicadosService.atualizar(ed.id, payload));
        this.toast.sucesso('Comunicado atualizado com sucesso!');
      } else {
        await firstValueFrom(this.comunicadosService.criar(payload));
        this.toast.sucesso('Comunicado publicado com sucesso!');
      }

      this.salvando.set(false);
      this.fecharModal(true);
      this.carregar();
    } catch (err: any) {
      this.salvando.set(false);
      const msg = err?.error?.message || 'Verifique os campos e tente novamente.';
      console.error('Erro ao salvar comunicado:', err?.error || err);
      this.toast.erro(`Erro ao salvar: ${msg}`);
    }
  }

  excluir(c: Comunicado): void {
    this.lastFocusBeforeModal = document.activeElement as HTMLElement;
    this.comunicadoParaExcluir.set(c);
  }

  cancelarExclusao(): void {
    this.comunicadoParaExcluir.set(null);
    setTimeout(() => this.lastFocusBeforeModal?.focus(), 0);
  }

  confirmarExclusao(): void {
    const comEx = this.comunicadoParaExcluir();
    if (!comEx) return;
    
    this.comunicadosService.excluir(comEx.id)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: () => {
        this.toast.sucesso('Comunicado excluído com sucesso!');
        this.comunicadoParaExcluir.set(null);
        this.carregar();
      },
      error: () => {
        this.toast.erro('Erro ao excluir comunicado.');
        this.comunicadoParaExcluir.set(null);
      }
    });
  }

  formatarData(data: string): string {
    return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  // Utiliza serviço isolado limpo SRP
  preview(texto: string): string {
    return HtmlSanitizerUtil.generatePreview(texto, 120);
  }
}

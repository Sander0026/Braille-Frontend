import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ComunicadosService, Comunicado } from '../../../../core/services/comunicados.service';
import { ToastService } from '../../../../core/services/toast.service';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-comunicados-lista',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuillModule],
  templateUrl: './comunicados-lista.html',
  styleUrl: './comunicados-lista.scss'
})
export class ComunicadosLista implements OnInit {
  comunicados: Comunicado[] = [];
  isLoading = true;
  erro = '';
  mostrarModal = false;
  editando: Comunicado | null = null;
  salvando = false;

  form!: FormGroup;
  fotoSelecionada: File | null = null;
  fotoPreview: string | null = null;

  comunicadoParaExcluir: Comunicado | null = null;

  readonly CATEGORIAS = [
    { valor: 'NOTICIA', label: 'Notícia' },
    { valor: 'VAGA_EMPREGO', label: 'Vaga PCD' },
    { valor: 'SERVICO', label: 'Serviço' },
    { valor: 'EVENTO_CULTURAL', label: 'Evento Cultural' },
    { valor: 'LEGISLACAO', label: 'Legislação' },
    { valor: 'GERAL', label: 'Aviso Geral' },
  ];

  constructor(
    private comunicadosService: ComunicadosService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private route: ActivatedRoute,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(5)]],
      conteudo: ['', [Validators.required, Validators.minLength(10)]],
      categoria: ['GERAL', [Validators.required]],
      fixado: [false]
    });
  }

  ngOnInit(): void {
    this.carregar();
    this.route.queryParams.subscribe(params => {
      if (params['novo'] === 'true') {
        // Usa setTimeout para garantir que o componente terminou de inicializar
        setTimeout(() => this.novo(params['categoria']), 100);
      }
    });
  }

  carregar(): void {
    this.isLoading = true;
    this.comunicadosService.listar(1, 100).subscribe({
      next: (res: any) => {
        this.comunicados = res.data || res;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.erro = 'Erro ao carregar comunicados.'; this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  novo(categoriaDefault: string = 'GERAL'): void {
    this.editando = null;
    this.form.reset({ categoria: categoriaDefault, fixado: false });
    this.fotoSelecionada = null;
    this.fotoPreview = null;
    this.mostrarModal = true;
  }

  editar(c: Comunicado): void {
    this.editando = c;
    this.form.patchValue({
      titulo: c.titulo,
      conteudo: c.conteudo,
      categoria: c.categoria || 'GERAL',
      fixado: c.fixado || false
    });
    this.fotoSelecionada = null;
    this.fotoPreview = c.imagemCapa || null;
    this.mostrarModal = true;
  }

  onFotoChange(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { alert('A imagem deve ter no máximo 2MB'); return; }
      this.fotoSelecionada = file;
      const reader = new FileReader();
      reader.onload = () => this.fotoPreview = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  removerFotoDaPrevia(): void {
    this.fotoPreview = null;
    this.fotoSelecionada = null;
  }

  fecharModal(): void {
    this.mostrarModal = false;
    this.editando = null;
    this.form.reset();
  }

  /**
   * Salva o comunicado em dois passos:
   * 1. Se houver nova foto, faz upload via /api/upload e obtém a URL
   * 2. Envia payload JSON limpo para o backend (corrige o 400 que ocorria com FormData)
   */
  async salvar(): Promise<void> {
    if (this.form.invalid) return;
    this.salvando = true;

    try {
      // Passo 1: Upload da imagem (se nova foto selecionada)
      let imagemCapaUrl: string | null | undefined = undefined;

      if (this.fotoSelecionada) {
        const token = localStorage.getItem('token') || '';
        const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
        const fd = new FormData();
        fd.append('file', this.fotoSelecionada);
        const uploadRes = await firstValueFrom(
          this.http.post<{ url: string }>('/api/upload', fd, { headers })
        );
        imagemCapaUrl = uploadRes.url;
      } else if (this.fotoPreview === null && this.editando?.imagemCapa) {
        // Usuário clicou em X para remover
        imagemCapaUrl = null;
      } else if (this.editando?.imagemCapa) {
        // Mantém a imagem existente
        imagemCapaUrl = this.editando.imagemCapa;
      }

      // Passo 2: Monta payload JSON e envia
      const payload: Record<string, any> = {
        titulo: this.form.value.titulo,
        conteudo: this.form.value.conteudo,
        categoria: this.form.value.categoria,
        fixado: Boolean(this.form.value.fixado),
      };
      if (imagemCapaUrl !== undefined) {
        payload['imagemCapa'] = imagemCapaUrl;
      }

      if (this.editando) {
        await firstValueFrom(this.comunicadosService.atualizar(this.editando.id, payload));
        this.toast.sucesso('Comunicado atualizado com sucesso!');
      } else {
        await firstValueFrom(this.comunicadosService.criar(payload));
        this.toast.sucesso('Comunicado publicado com sucesso!');
      }

      this.salvando = false;
      this.fecharModal();
      this.carregar();
      this.cdr.detectChanges();

    } catch (err: any) {
      this.salvando = false;
      const msg = err?.error?.message || 'Verifique os campos e tente novamente.';
      console.error('Erro ao salvar comunicado:', err?.error || err);
      this.toast.erro(`Erro ao salvar: ${msg}`);
      this.cdr.detectChanges();
    }
  }

  excluir(c: Comunicado): void {
    this.comunicadoParaExcluir = c;
  }

  cancelarExclusao(): void {
    this.comunicadoParaExcluir = null;
  }

  confirmarExclusao(): void {
    if (!this.comunicadoParaExcluir) return;
    this.comunicadosService.excluir(this.comunicadoParaExcluir.id).subscribe({
      next: () => {
        this.toast.sucesso('Comunicado excluído com sucesso!');
        this.comunicadoParaExcluir = null;
        this.carregar();
      },
      error: () => {
        this.toast.erro('Erro ao excluir comunicado.');
        this.comunicadoParaExcluir = null;
        this.cdr.detectChanges();
      }
    });
  }

  formatarData(data: string): string {
    return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  preview(texto: string, max = 120): string {
    return texto.length > max ? texto.slice(0, max) + '…' : texto;
  }
}

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ComunicadosService, Comunicado } from '../../../../core/services/comunicados.service';

@Component({
  selector: 'app-comunicados-lista',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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

  readonly CATEGORIAS = [
    { valor: 'NOTICIA', label: 'Notícia' },
    { valor: 'VAGA_EMPREGO', label: 'Vaga PCD' },
    { valor: 'SERVICO', label: 'Serviço' },
    { valor: 'EVENTO_CULTURAL', label: 'Evento Cultural' },
    { valor: 'LEGISLACAO', label: 'Legislação' },
    { valor: 'TRABALHO_PCD', label: 'Trabalho para PCD' },
    { valor: 'GERAL', label: 'Aviso Geral' },
  ];

  constructor(private comunicadosService: ComunicadosService, private fb: FormBuilder, private cdr: ChangeDetectorRef) {
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(5)]],
      conteudo: ['', [Validators.required, Validators.minLength(10)]],
      categoria: ['GERAL', [Validators.required]],
      fixado: [false]
    });
  }

  ngOnInit(): void { this.carregar(); }

  carregar(): void {
    this.isLoading = true;
    this.comunicadosService.listar(1, 100).subscribe({
      next: (res: any) => {
        // O Http retorna { data, meta }
        this.comunicados = res.data || res;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.erro = 'Erro ao carregar comunicados.'; this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  novo(): void {
    this.editando = null;
    this.form.reset({ categoria: 'GERAL', fixado: false });
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

  salvar(): void {
    if (this.form.invalid) return;
    this.salvando = true;

    // Tratamos multipart/form-data
    const fd = new FormData();
    fd.append('titulo', this.form.value.titulo);
    fd.append('conteudo', this.form.value.conteudo);
    fd.append('categoria', this.form.value.categoria);
    // Campos boolean não podem ser convertidos puros no form-data -> usar strings ou 1/0
    fd.append('fixado', this.form.value.fixado ? 'true' : 'false');

    if (this.fotoSelecionada) {
      fd.append('imagemCapa', this.fotoSelecionada);
    } else if (this.fotoPreview === null && this.editando?.imagemCapa) {
      // Remover imagem se usuário clicou em X
      fd.append('removerImagemCapa', 'true');
    }

    const op = this.editando
      ? this.comunicadosService.atualizar(this.editando.id, fd)
      : this.comunicadosService.criar(fd);

    op.subscribe({
      next: () => { this.salvando = false; this.fecharModal(); this.carregar(); },
      error: () => { this.salvando = false; alert('Erro ao salvar comunicado.'); this.cdr.detectChanges(); }
    });
  }

  excluir(c: Comunicado): void {
    if (!confirm(`Excluir o comunicado "${c.titulo}"?`)) return;
    this.comunicadosService.excluir(c.id).subscribe({
      next: () => this.carregar(),
      error: () => { alert('Erro ao excluir comunicado.'); this.cdr.detectChanges(); }
    });
  }

  formatarData(data: string): string {
    return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  preview(texto: string, max = 120): string {
    return texto.length > max ? texto.slice(0, max) + '…' : texto;
  }
}

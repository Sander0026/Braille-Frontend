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

  constructor(private comunicadosService: ComunicadosService, private fb: FormBuilder, private cdr: ChangeDetectorRef) {
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(5)]],
      conteudo: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void { this.carregar(); }

  carregar(): void {
    this.isLoading = true;
    this.comunicadosService.listar().subscribe({
      next: (data) => { this.comunicados = data; this.isLoading = false; this.cdr.detectChanges(); },
      error: () => { this.erro = 'Erro ao carregar comunicados.'; this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  novo(): void {
    this.editando = null;
    this.form.reset();
    this.mostrarModal = true;
  }

  editar(c: Comunicado): void {
    this.editando = c;
    this.form.patchValue({ titulo: c.titulo, conteudo: c.conteudo });
    this.mostrarModal = true;
  }

  fecharModal(): void {
    this.mostrarModal = false;
    this.editando = null;
    this.form.reset();
  }

  salvar(): void {
    if (this.form.invalid) return;
    this.salvando = true;
    const dados = this.form.value;

    const op = this.editando
      ? this.comunicadosService.atualizar(this.editando.id, dados)
      : this.comunicadosService.criar(dados);

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

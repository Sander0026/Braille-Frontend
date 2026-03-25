import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { CommonModule, NgStyle } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ModelosCertificadosService, ModeloCertificado } from '../../../core/services/modelos-certificados.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-modelos-lista',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NgStyle, RouterModule],
  templateUrl: './modelos-lista.html',
  styleUrl: './modelos-lista.scss',
})
export class ModelosLista implements OnInit {
  modelos: ModeloCertificado[] = [];
  isLoading = true;
  erro = '';

  // ── Preview ────────────────────────────────────────────────
  modeloPreview: ModeloCertificado | null = null;

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
  }

  fecharPreview(): void {
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

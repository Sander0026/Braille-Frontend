import { Component, OnInit, ChangeDetectionStrategy, ViewChild, ElementRef, inject, DestroyRef, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ModelosCertificadosService, ModeloCertificado } from '../../../core/services/modelos-certificados.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { CertificadoPreviewComponent } from '../components/certificado-preview/certificado-preview.component';

@Component({
  selector: 'app-modelos-lista',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, CertificadoPreviewComponent, DatePipe],
  templateUrl: './modelos-lista.html',
  styleUrl: './modelos-lista.scss',
})
export class ModelosLista implements OnInit {
  // Estado Reativo local via Signals
  modelos = signal<ModeloCertificado[]>([]);
  isLoading = signal<boolean>(true);
  erro = signal<string>('');
  
  modeloPreview = signal<ModeloCertificado | null>(null);

  @ViewChild('previewDialog') previewDialog?: ElementRef<HTMLDialogElement>;

  // Dependências
  private readonly modelosService = inject(ModelosCertificadosService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef); // Gerencia a memória das streams (RxJS)

  ngOnInit(): void {
    this.carregarModelos();
  }

  carregarModelos(): void {
    this.isLoading.set(true);
    this.erro.set('');
    
    this.modelosService.listar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.modelos.set(res || []);
          this.isLoading.set(false);
        },
        error: () => {
          this.erro.set('Não foi possível carregar os modelos de certificado.');
          this.isLoading.set(false);
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
    this.modeloPreview.set(modelo);
    setTimeout(() => {
      if (this.previewDialog?.nativeElement) {
        this.previewDialog.nativeElement.showModal();
      }
    }, 0);
  }

  fecharPreview(): void {
    const dialog = this.previewDialog?.nativeElement;
    if (dialog && dialog.open) {
      dialog.close();
    }
  }

  onDialogClosed(): void {
    this.modeloPreview.set(null);
  }

  async excluirModelo(modelo: ModeloCertificado): Promise<void> {
    const ok = await this.confirmDialog.confirmar({
      titulo: 'Excluir Modelo',
      mensagem: `Tem certeza que deseja excluir o modelo "${modelo.nome}"? Esta ação não pode ser desfeita.`,
      textoBotaoConfirmar: 'Sim, excluir',
      tipo: 'warning',
    });
    
    if (!ok) return;

    this.modelosService.excluir(modelo.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.sucesso('Modelo excluído com sucesso!');
          this.carregarModelos();
        },
        error: (err: any) => {
          const msg = err.error?.message || 'Erro ao excluir. O modelo pode estar em uso.';
          this.toast.erro(typeof msg === 'string' ? msg : msg[0]);
        }
      });
  }
}

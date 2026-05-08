import { Component, OnInit, ChangeDetectionStrategy, ViewChild, ElementRef, inject, DestroyRef, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

import { ModelosCertificadosService, ModeloCertificado } from '../../../core/services/modelos-certificados.service';
import { BeneficiariosService, Beneficiario } from '../../../core/services/beneficiarios.service';
import { TurmasService, Turma } from '../../../core/services/turmas.service';
import { ApoiadoresService, Apoiador } from '../../admin/apoiadores/apoiadores.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { CertificadoPreviewComponent } from '../components/certificado-preview/certificado-preview.component';

@Component({
  selector: 'app-modelos-lista',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule, CertificadoPreviewComponent, DatePipe],
  templateUrl: './modelos-lista.html',
  styleUrls: ['./modelos-lista.scss'],
})
export class ModelosLista implements OnInit {
  // Estado Reativo local via Signals
  modelos = signal<ModeloCertificado[]>([]);
  isLoading = signal<boolean>(true);
  erro = signal<string>('');
  
  modeloPreview = signal<ModeloCertificado | null>(null);
  modeloManual = signal<ModeloCertificado | null>(null);
  isEmitindoManual = signal(false);
  isCarregandoManual = signal(false);
  alunosManual = signal<Beneficiario[]>([]);
  turmasManual = signal<Turma[]>([]);
  apoiadoresManual = signal<Apoiador[]>([]);
  buscaAlunoManual = signal('');
  buscaApoiadorManual = signal('');
  manualForm = {
    alunoId: '',
    turmaId: '',
    apoiadorId: '',
    tituloAcao: '',
    motivo: '',
    dataInicio: '',
    dataFim: '',
    dataEmissao: new Date().toISOString().slice(0, 10),
  };

  @ViewChild('previewDialog') previewDialog?: ElementRef<HTMLDialogElement>;
  @ViewChild('manualDialog') manualDialog?: ElementRef<HTMLDialogElement>;
  @ViewChild('manualFirstInput') manualFirstInput?: ElementRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

  private lastFocusBeforeModal: HTMLElement | null = null;

  // Dependências
  private readonly modelosService = inject(ModelosCertificadosService);
  private readonly beneficiariosService = inject(BeneficiariosService);
  private readonly turmasService = inject(TurmasService);
  private readonly apoiadoresService = inject(ApoiadoresService);
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
        next: (res: ModeloCertificado[]) => {
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
    this.lastFocusBeforeModal = document.activeElement as HTMLElement;
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

  abrirEmissaoManual(modelo: ModeloCertificado): void {
    this.lastFocusBeforeModal = document.activeElement as HTMLElement;
    this.modeloManual.set(modelo);
    this.manualForm = {
      alunoId: '',
      turmaId: '',
      apoiadorId: '',
      tituloAcao: '',
      motivo: '',
      dataInicio: '',
      dataFim: '',
      dataEmissao: new Date().toISOString().slice(0, 10),
    };
    this.buscaAlunoManual.set('');
    this.buscaApoiadorManual.set('');
    this.carregarOpcoesEmissaoManual(modelo);
    setTimeout(() => {
      const dialog = this.manualDialog?.nativeElement;
      if (dialog && !dialog.open) {
        dialog.showModal();
      }
      this.manualFirstInput?.nativeElement.focus();
    }, 0);
  }

  alunosFiltradosManual(): Beneficiario[] {
    if (this.manualForm.alunoId) return [];
    const termo = this.normalizarBusca(this.buscaAlunoManual());
    const alunos = this.alunosManual();
    if (!termo) return alunos.slice(0, 50);

    return alunos.filter((aluno) => {
      const nome = this.normalizarBusca(aluno.nomeCompleto);
      const matricula = this.normalizarBusca(aluno.matricula || '');
      return nome.includes(termo) || matricula.includes(termo);
    }).slice(0, 50);
  }

  apoiadoresFiltradosManual(): Apoiador[] {
    if (this.manualForm.apoiadorId) return [];
    const termo = this.normalizarBusca(this.buscaApoiadorManual());
    const apoiadores = this.apoiadoresManual();
    if (!termo) return apoiadores.slice(0, 50);

    return apoiadores.filter((apoiador) => {
      const nome = this.normalizarBusca(apoiador.nomeFantasia || apoiador.nomeRazaoSocial);
      const razao = this.normalizarBusca(apoiador.nomeRazaoSocial);
      return nome.includes(termo) || razao.includes(termo);
    }).slice(0, 50);
  }

  selecionarAlunoManual(aluno: Beneficiario): void {
    this.manualForm.alunoId = aluno.id;
    this.buscaAlunoManual.set(`${aluno.nomeCompleto}${aluno.matricula ? ' - ' + aluno.matricula : ''}`);
  }

  selecionarApoiadorManual(apoiador: Apoiador): void {
    this.manualForm.apoiadorId = apoiador.id;
    this.buscaApoiadorManual.set(apoiador.nomeFantasia || apoiador.nomeRazaoSocial);
  }

  onBuscaAlunoManual(value: string): void {
    this.buscaAlunoManual.set(value);
    const selecionado = this.alunosManual().find((aluno) => aluno.id === this.manualForm.alunoId);
    const labelSelecionado = selecionado ? `${selecionado.nomeCompleto}${selecionado.matricula ? ' - ' + selecionado.matricula : ''}` : '';
    if (value !== labelSelecionado) {
      this.manualForm.alunoId = '';
    }
  }

  onBuscaApoiadorManual(value: string): void {
    this.buscaApoiadorManual.set(value);
    const selecionado = this.apoiadoresManual().find((apoiador) => apoiador.id === this.manualForm.apoiadorId);
    const labelSelecionado = selecionado ? (selecionado.nomeFantasia || selecionado.nomeRazaoSocial) : '';
    if (value !== labelSelecionado) {
      this.manualForm.apoiadorId = '';
    }
  }

  private normalizarBusca(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private carregarOpcoesEmissaoManual(modelo: ModeloCertificado): void {
    this.isCarregandoManual.set(true);
    if (modelo.tipo === 'ACADEMICO') {
      forkJoin({
        alunos: this.beneficiariosService.listar(1, 100),
        turmas: this.turmasService.listar(1, 100, undefined, 'all', undefined, undefined, false),
      }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: ({ alunos, turmas }) => {
          this.alunosManual.set(alunos.data || []);
          this.turmasManual.set(turmas.data || []);
          this.isCarregandoManual.set(false);
        },
        error: () => {
          this.isCarregandoManual.set(false);
          this.toast.erro('Nao foi possivel carregar alunos e cursos.');
        },
      });
      return;
    }

    this.apoiadoresService.listar(0, 100, undefined, undefined, true, true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.apoiadoresManual.set(res.data || []);
          this.isCarregandoManual.set(false);
        },
        error: () => {
          this.isCarregandoManual.set(false);
          this.toast.erro('Nao foi possivel carregar apoiadores.');
        },
      });
  }

  fecharEmissaoManual(): void {
    const dialog = this.manualDialog?.nativeElement;
    if (dialog?.open) dialog.close();
  }

  onManualDialogClosed(): void {
    this.modeloManual.set(null);
    this.isEmitindoManual.set(false);
    this.isCarregandoManual.set(false);
    if (this.lastFocusBeforeModal) {
      this.lastFocusBeforeModal.focus();
      this.lastFocusBeforeModal = null;
    }
  }

  onManualBackdropClick(event: MouseEvent): void {
    if (event.target === this.manualDialog?.nativeElement) {
      this.fecharEmissaoManual();
    }
  }

  emitirManual(): void {
    const modelo = this.modeloManual();
    if (!modelo || this.isEmitindoManual()) return;

    this.isEmitindoManual.set(true);
    if (modelo.tipo === 'ACADEMICO') {
      if (!this.manualForm.alunoId || !this.manualForm.turmaId) {
        this.toast.aviso('Selecione um aluno cadastrado e um curso cadastrado.');
        this.isEmitindoManual.set(false);
        return;
      }
      this.modelosService.emitirManualAcademico({
        modeloId: modelo.id,
        alunoId: this.manualForm.alunoId,
        turmaId: this.manualForm.turmaId,
        dataEmissao: this.manualForm.dataEmissao || undefined,
      }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (res) => {
          this.isEmitindoManual.set(false);
          this.fecharEmissaoManual();
          this.toast.sucesso('Certificado manual gerado com sucesso.');
          if (res.pdfUrl) window.open(res.pdfUrl, '_blank', 'noopener');
        },
        error: (err: { error?: { message?: string | string[] } }) => {
          this.isEmitindoManual.set(false);
          const msg = err.error?.message || 'Erro ao gerar certificado manual.';
          this.toast.erro(typeof msg === 'string' ? msg : msg[0]);
        },
      });
      return;
    }

    if (!this.manualForm.apoiadorId || !this.manualForm.tituloAcao.trim()) {
      this.toast.aviso('Selecione um apoiador cadastrado e informe o titulo da acao.');
      this.isEmitindoManual.set(false);
      return;
    }

    this.modelosService.emitirHonrariaManual({
      modeloId: modelo.id,
      apoiadorId: this.manualForm.apoiadorId,
      tituloAcao: this.manualForm.tituloAcao,
      motivo: this.manualForm.motivo || this.manualForm.tituloAcao,
      dataEvento: this.manualForm.dataEmissao,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.isEmitindoManual.set(false);
        this.fecharEmissaoManual();
        const blob = res.body;
        if (blob) window.open(URL.createObjectURL(blob), '_blank', 'noopener');
        this.toast.sucesso('Certificado de honraria gerado com sucesso.');
      },
      error: () => {
        this.isEmitindoManual.set(false);
        this.toast.erro('Erro ao gerar certificado de honraria.');
      },
    });
  }

  onDialogClosed(): void {
    this.modeloPreview.set(null);
    if (this.lastFocusBeforeModal) {
      this.lastFocusBeforeModal.focus();
      this.lastFocusBeforeModal = null;
    }
  }

  async excluirModelo(modelo: ModeloCertificado): Promise<void> {
    const ok = await this.confirmDialog.confirmar({
      titulo: 'Excluir Modelo',
      mensagem: `Tem certeza que deseja excluir o modelo "${modelo.nome}" Esta ação não pode ser desfeita.`,
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
        error: (err: { error?: { message?: string | string[] } }) => {
          const msg = err.error?.message || 'Erro ao excluir. O modelo pode estar em uso.';
          this.toast.erro(typeof msg === 'string' ? msg : msg[0]);
        }
      });
  }
}

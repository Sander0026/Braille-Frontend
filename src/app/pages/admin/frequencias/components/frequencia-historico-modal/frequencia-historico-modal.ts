import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { Frequencia, ResumoFrequencia, FrequenciasService } from '../../../../../core/services/frequencias.service';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
  selector: 'app-frequencia-historico-modal',
  standalone: true,
  imports: [CommonModule, A11yModule],
  providers: [DatePipe],
  templateUrl: './frequencia-historico-modal.html',
  styleUrl: './frequencia-historico-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FrequenciaHistoricoModalComponent {
  carregandoPdf = signal(false);
  // Inputs baseados em signals
  readonly isOpen = input.required<boolean>();
  readonly carregandoDetalhes = input.required<boolean>();
  readonly detalhesResumo = input.required<ResumoFrequencia | null>();
  readonly detalhesAlunos = input.required<Frequencia[]>();

  // Outputs
  readonly fechar = output<void>();

  constructor(
    private datePipe: DatePipe,
    private frequenciasService: FrequenciasService,
    private toast: ToastService
  ) {}

  formatarData(iso: string | null | undefined): string {
    if (!iso) return '—';
    const partes = iso.substring(0, 10).split('-');
    if (partes.length !== 3) return iso;
    const [ano, mes, dia] = partes;
    return `${dia}/${mes}/${ano}`;
  }

  onClose(): void {
    this.fechar.emit();
  }

  gerarPdf(): void {
    const resumo = this.detalhesResumo();
    if (!resumo || !resumo.turmaId || !resumo.dataAula) {
      this.toast.erro('Não há dados suficientes para gerar o PDF desta chamada.');
      return;
    }

    this.carregandoPdf.set(true);
    this.frequenciasService.gerarPdfChamada(resumo.turmaId, resumo.dataAula).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `frequencia_${resumo.dataAula}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.carregandoPdf.set(false);
        this.toast.sucesso('PDF gerado e baixado com sucesso!');
      },
      error: () => {
        this.toast.erro('Não foi possível gerar o PDF da frequência. Tente novamente.');
        this.carregandoPdf.set(false);
      },
      complete: () => {
        this.carregandoPdf.set(false);
      }
    });
  }
}

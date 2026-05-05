import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { Frequencia, ResumoFrequencia } from '../../../../../core/services/frequencias.service';

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
  // Inputs baseados em signals
  readonly isOpen = input.required<boolean>();
  readonly carregandoDetalhes = input.required<boolean>();
  readonly detalhesResumo = input.required<ResumoFrequencia | null>();
  readonly detalhesAlunos = input.required<Frequencia[]>();

  // Outputs
  readonly fechar = output<void>();

  constructor(private datePipe: DatePipe) {}

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
}

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusAcompanhamentoIndividual } from '../../models/acompanhamento-individual.model';
import { formatarStatusAcompanhamento } from '../../utils/formatar-status-acompanhamento.util';

@Component({
  selector: 'app-status-acompanhamento-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="status" [ngClass]="status">{{ label }}</span>`,
  styles: [`
    .status { display:inline-flex; border-radius:999px; padding:.25rem .65rem; font-size:.78rem; font-weight:800; white-space:nowrap; }
    .EM_ANDAMENTO { background:#e8f6ef; color:#166534; }
    .FINALIZADO { background:#eef2f7; color:#475569; }
    .ARQUIVADO { background:#fff7ed; color:#9a3412; }
  `],
})
export class StatusAcompanhamentoBadgeComponent {
  @Input({ required: true }) status!: StatusAcompanhamentoIndividual;

  get label(): string {
    return formatarStatusAcompanhamento(this.status);
  }
}

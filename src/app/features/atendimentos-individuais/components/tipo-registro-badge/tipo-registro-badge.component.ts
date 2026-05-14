import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TipoRegistroAtendimentoIndividual } from '../../models/atendimento-individual.model';
import { formatarTipoRegistro } from '../../utils/formatar-tipo-registro.util';

@Component({
  selector: 'app-tipo-registro-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="tipo" [ngClass]="tipo">{{ label }}</span>`,
  styles: [`
    .tipo { display:inline-flex; border-radius:999px; padding:.25rem .65rem; font-size:.78rem; font-weight:800; }
    .ATENDIMENTO_REALIZADO { background:#e8f6ef; color:#166534; }
    .FALTA_JUSTIFICADA { background:#eff6ff; color:#1d4ed8; }
    .FALTA_NAO_JUSTIFICADA { background:#fef2f2; color:#b91c1c; }
    .CANCELADO { background:#f8fafc; color:#475569; }
  `],
})
export class TipoRegistroBadgeComponent {
  @Input({ required: true }) tipo!: TipoRegistroAtendimentoIndividual;

  get label(): string {
    return formatarTipoRegistro(this.tipo);
  }
}

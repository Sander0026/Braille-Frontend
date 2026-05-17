import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RelatorioFiltro, RelatorioResumo } from '../../../../../core/services/relatorios.service';

@Component({
  selector: 'app-relatorio-exportacoes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './relatorio-exportacoes.html',
  styleUrl: './relatorio-exportacoes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelatorioExportacoes {
  @Input() filtros: RelatorioFiltro = {};
  @Input() resumo: RelatorioResumo | null = null;
  @Input() exportandoPdf = false;
  @Input() exportandoXlsx = false;

  @Output() baixarPdf = new EventEmitter<void>();
  @Output() baixarXlsx = new EventEmitter<void>();

  filtrosAtivos(): number {
    return Object.values(this.filtros).filter((value) => value !== undefined && value !== null && value !== '').length;
  }
}

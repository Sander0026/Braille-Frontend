import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { AuditLog } from '../../../../../core/services/audit-log.service';
import { AuditDiffUtil, AuditDiff } from '../../../../../shared/utils/audit-diff.util';

@Component({
  selector: 'app-audit-modal-detalhes',
  standalone: true,
  imports: [CommonModule, A11yModule],
  templateUrl: './audit-modal-detalhes.component.html',
  styleUrls: ['./audit-modal-detalhes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuditModalDetalhesComponent implements OnChanges {
  @Input({ required: true }) isOpen = false;
  @Input({ required: true }) log: AuditLog | null = null;
  @Input({ required: true }) acaoCor: Record<string, string> = {};
  
  @Output() closeRequested = new EventEmitter<void>();

  diferencas: AuditDiff[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['log'] && this.log) {
      const oldVal = (this.log.oldValue ?? null) as Record<string, unknown> | null;
      const newVal = (this.log.newValue ?? null) as Record<string, unknown> | null;
      this.diferencas = AuditDiffUtil.gerarDiferencas(oldVal, newVal);
    } else if (changes['log'] && !this.log) {
      this.diferencas = [];
    }
  }

  fechar(): void {
    this.closeRequested.emit();
  }

  formatarData(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }
}

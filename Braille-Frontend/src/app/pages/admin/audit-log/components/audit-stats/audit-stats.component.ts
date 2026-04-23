import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditStats } from '../../../../../core/services/audit-log.service';

@Component({
  selector: 'app-audit-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audit-stats.component.html',
  styleUrls: ['./audit-stats.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuditStatsComponent {
  @Input({ required: true }) stats!: AuditStats | null;
}

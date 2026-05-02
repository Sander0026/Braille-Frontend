import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { StatCardDef } from '../../models/dashboard.models';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatCardComponent {
  @Input({ required: true }) card!: StatCardDef;
}

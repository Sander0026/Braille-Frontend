import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ActionLinkDef } from '../../models/dashboard.models';

@Component({
  selector: 'app-quick-action',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './quick-action.component.html',
  styleUrl: './quick-action.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuickActionComponent {
  @Input({ required: true }) action!: ActionLinkDef;
}

import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManualCard } from '../../ajuda.constants';

@Component({
  selector: 'app-manual-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './manual-card.component.html',
  styleUrl: './manual-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManualCardComponent {
  @Input({ required: true }) manual!: ManualCard;
  @Output() openManualList = new EventEmitter<ManualCard>();

  onAbrirLista(): void {
    this.openManualList.emit(this.manual);
  }
}

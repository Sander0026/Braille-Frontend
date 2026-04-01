import { Component, ChangeDetectionStrategy, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { HotkeyAction } from '../../../../core/services/hotkeys.service';

@Component({
  selector: 'app-modal-hotkeys',
  standalone: true,
  imports: [CommonModule, A11yModule],
  templateUrl: './modal-hotkeys.component.html',
  styleUrl: './modal-hotkeys.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalHotkeysComponent {
  @Input() hotkeysDisponiveis: HotkeyAction[] = [];
  @Output() close = new EventEmitter<void>();

  fecharModal(): void {
    this.close.emit();
  }
}

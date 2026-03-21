import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, A11yModule],
  styleUrl: './confirm-dialog.component.scss',
  template: `
    @if (svc.dialogData(); as dialog) {
    <div class="cd-backdrop" (click)="svc._cancelar()" role="dialog" aria-modal="true"
         [attr.aria-label]="dialog.titulo || 'Confirmar ação'">
      <div class="cd-card" cdkTrapFocus cdkTrapFocusAutoCapture (click)="$event.stopPropagation()">

        <!-- Ícone por tipo -->
        <div class="cd-icon" [class]="'cd-icon tipo-' + (dialog.tipo || 'danger')">
          @if ((dialog.tipo || 'danger') === 'danger') {
            <span class="material-symbols-rounded">delete_forever</span>
          } @else if (dialog.tipo === 'warning') {
            <span class="material-symbols-rounded">warning</span>
          } @else {
            <span class="material-symbols-rounded">help</span>
          }
        </div>

        <!-- Título -->
        <h2 class="cd-titulo">{{ dialog.titulo || 'Confirmar' }}</h2>

        <!-- Mensagem -->
        <p class="cd-mensagem">{{ dialog.mensagem }}</p>

        <!-- Botões -->
        <div class="cd-acoes">
          <button class="cd-btn cd-btn-cancelar" (click)="svc._cancelar()" type="button">
            {{ dialog.textoBotaoCancelar || 'Cancelar' }}
          </button>
          <button class="cd-btn" (click)="svc._confirmar()" type="button"
                  [class]="'cd-btn tipo-' + (dialog.tipo || 'danger')">
            {{ dialog.textoBotaoConfirmar || 'Confirmar' }}
          </button>
        </div>

      </div>
    </div>
    }
  `
})
export class ConfirmDialog {
  readonly svc = inject(ConfirmDialogService);
}

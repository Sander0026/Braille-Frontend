import { Component, inject, HostListener } from '@angular/core';
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
    <div class="cd-backdrop" (click)="svc._cancelar()">
      <div class="cd-card" cdkTrapFocus cdkTrapFocusAutoCapture (click)="$event.stopPropagation()"
           role="alertdialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-message">

        <!-- Ícone por tipo -->
        <div class="cd-icon" [class]="'cd-icon tipo-' + (dialog.tipo || 'danger')" aria-hidden="true">
          @if ((dialog.tipo || 'danger') === 'danger') {
            <span class="material-symbols-rounded">delete_forever</span>
          } @else if (dialog.tipo === 'warning') {
            <span class="material-symbols-rounded">warning</span>
          } @else {
            <span class="material-symbols-rounded">help</span>
          }
        </div>

        <!-- Título -->
        <h2 id="dialog-title" class="cd-titulo">{{ dialog.titulo || 'Confirmar' }}</h2>

        <!-- Mensagem -->
        <p id="dialog-message" class="cd-mensagem">{{ dialog.mensagem }}</p>

        <!-- Botões -->
        <div class="cd-acoes">
          <button class="cd-btn cd-btn-cancelar" (click)="svc._cancelar()" type="button" cdkFocusInitial>
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

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.svc.dialogData()) {
      this.svc._cancelar();
    }
  }
}

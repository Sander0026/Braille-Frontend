import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

@Component({
    selector: 'app-confirm-dialog',
    standalone: true,
    imports: [CommonModule],
    template: `
    @if (svc.dialogData()) {
    <div class="cd-backdrop" (click)="svc._cancelar()" role="dialog" aria-modal="true"
         [attr.aria-label]="svc.dialogData()?.titulo || 'Confirmar ação'">
      <div class="cd-card" (click)="$event.stopPropagation()">

        <!-- Ícone por tipo -->
        <div class="cd-icon" [attr.data-tipo]="svc.dialogData()?.tipo || 'danger'">
          @if ((svc.dialogData()?.tipo || 'danger') === 'danger') {
            <span class="material-symbols-rounded">delete_forever</span>
          } @else if (svc.dialogData()?.tipo === 'warning') {
            <span class="material-symbols-rounded">warning</span>
          } @else {
            <span class="material-symbols-rounded">help</span>
          }
        </div>

        <!-- Título -->
        <h2 class="cd-titulo">{{ svc.dialogData()?.titulo || 'Confirmar' }}</h2>

        <!-- Mensagem -->
        <p class="cd-mensagem">{{ svc.dialogData()?.mensagem }}</p>

        <!-- Botões -->
        <div class="cd-acoes">
          <button class="cd-btn cd-btn-cancelar" (click)="svc._cancelar()" type="button">
            {{ svc.dialogData()?.textoBotaoCancelar || 'Cancelar' }}
          </button>
          <button class="cd-btn" (click)="svc._confirmar()" type="button"
                  [attr.data-tipo]="svc.dialogData()?.tipo || 'danger'">
            {{ svc.dialogData()?.textoBotaoConfirmar || 'Confirmar' }}
          </button>
        </div>

      </div>
    </div>
    }
  `,
    styles: [`
    // Overlay fixo cobrindo toda a viewport
    .cd-backdrop {
      position: fixed;
      inset: 0;
      z-index: 2000;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      animation: cd-fade-in 150ms ease-out;
    }

    // Card do modal
    .cd-card {
      background: #fff;
      border-radius: 1rem;
      box-shadow: 0 24px 64px rgba(0,0,0,0.22);
      width: 100%;
      max-width: 420px;
      padding: 2rem 1.75rem 1.5rem;
      text-align: center;
      animation: cd-slide-up 200ms ease-out;
    }

    // Ícone circular
    .cd-icon {
      width: 4rem;
      height: 4rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.25rem;

      .material-symbols-rounded {
        font-family: 'Material Symbols Rounded', sans-serif !important;
        font-size: 2rem;
        font-weight: normal;
        line-height: 1;
      }

      &[data-tipo="danger"]  { background: #fee2e2; color: #dc2626; }
      &[data-tipo="warning"] { background: #fef3c7; color: #d97706; }
      &[data-tipo="info"]    { background: #dbeafe; color: #2563eb; }
    }

    // Tipografia
    .cd-titulo {
      font-size: 1.125rem;
      font-weight: 700;
      color: #111827;
      margin: 0 0 0.625rem;
    }

    .cd-mensagem {
      font-size: 0.9375rem;
      color: #4b5563;
      line-height: 1.5;
      margin: 0 0 1.75rem;
    }

    // Botões
    .cd-acoes {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
    }

    .cd-btn {
      flex: 1;
      max-width: 160px;
      padding: 0.6875rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.9rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 150ms ease;

      &[data-tipo="danger"]  { background: #dc2626; color: #fff; &:hover { background: #b91c1c; } }
      &[data-tipo="warning"] { background: #d97706; color: #fff; &:hover { background: #b45309; } }
      &[data-tipo="info"]    { background: #2563eb; color: #fff; &:hover { background: #1d4ed8; } }
    }

    .cd-btn-cancelar {
      background: #f3f4f6;
      color: #374151;
      &:hover { background: #e5e7eb; }
    }

    // Animações
    @keyframes cd-fade-in  { from { opacity: 0; } to { opacity: 1; } }
    @keyframes cd-slide-up { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    // Mobile
    @media (max-width: 480px) {
      .cd-backdrop { padding: 1rem; }
      .cd-acoes { flex-direction: column-reverse; }
      .cd-btn { max-width: 100%; }
    }
  `]
})
export class ConfirmDialog {
    readonly svc = inject(ConfirmDialogService);
}

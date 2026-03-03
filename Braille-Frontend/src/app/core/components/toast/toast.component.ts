import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="toast-container" aria-live="polite" aria-atomic="true">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-message" [ngClass]="toast.tipo" role="alert">
          <span class="material-symbols-rounded toast-icon">
            {{ getIcon(toast.tipo) }}
          </span>
          <span class="toast-text">{{ toast.mensagem }}</span>
          <button type="button" class="toast-close" (click)="remover(toast.id)" aria-label="Fechar notificação">
            <span class="material-symbols-rounded">close</span>
          </button>
        </div>
      }
    </div>
  `,
    styleUrls: ['./toast.component.scss']
})
export class ToastComponent {
    toastService = inject(ToastService);

    getIcon(tipo: string): string {
        switch (tipo) {
            case 'sucesso': return 'check_circle';
            case 'erro': return 'error';
            case 'aviso': return 'warning';
            case 'info': return 'info';
            default: return 'info';
        }
    }

    remover(id: number): void {
        this.toastService.remover(id);
    }
}

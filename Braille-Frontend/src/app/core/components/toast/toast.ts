import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl: './toast.scss'
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

  labelTipo(tipo: string): string {
    switch (tipo) {
      case 'sucesso': return 'Sucesso';
      case 'erro': return 'Erro';
      case 'aviso': return 'Aviso';
      case 'info': return 'Informação';
      default: return 'Alerta';
    }
  }

  remover(id: number): void {
    this.toastService.remover(id);
  }
}

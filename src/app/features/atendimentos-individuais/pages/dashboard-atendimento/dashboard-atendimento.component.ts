import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AtendimentosIndividuaisApiService } from '../../services/atendimentos-individuais-api.service';
import { DashboardAtendimentoIndividual } from '../../models/dashboard-atendimento.model';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-dashboard-atendimento',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard-atendimento.component.html',
  styleUrl: './dashboard-atendimento.component.scss',
})
export class DashboardAtendimentoComponent implements OnInit {
  private readonly api = inject(AtendimentosIndividuaisApiService);
  private readonly toast = inject(ToastService);

  readonly dashboard = signal<DashboardAtendimentoIndividual | null>(null);
  readonly carregando = signal(true);
  readonly erro = signal('');

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set('');
    this.api.dashboard().subscribe({
      next: data => {
        this.dashboard.set(data);
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.erro.set('Nao foi possivel carregar o dashboard administrativo.');
        this.toast.erro('Nao foi possivel carregar o dashboard.');
      },
    });
  }

  periodoLabel(): string {
    const periodo = this.dashboard()?.periodo;
    if (!periodo) return 'Mes atual';
    return `${this.formatarData(periodo.inicio)} ate ${this.formatarData(periodo.fim)}`;
  }

  private formatarData(value: string): string {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('pt-BR');
  }
}

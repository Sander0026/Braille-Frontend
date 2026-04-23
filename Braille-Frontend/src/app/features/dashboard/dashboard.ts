import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable, catchError, of, map, tap } from 'rxjs';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { inject } from '@angular/core';
import { DashboardConfigService } from './services/dashboard-config.service';
import { DashboardUIState } from './models/dashboard.models';
import { StatCardComponent } from './components/stat-card/stat-card.component';
import { QuickActionComponent } from './components/quick-action/quick-action.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, StatCardComponent, QuickActionComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Dashboard implements OnInit {
  uiState$!: Observable<DashboardUIState | null>;
  erro = signal<string>('');
  acessoNegado = signal<boolean>(false);
  private readonly liveAnnouncer = inject(LiveAnnouncer);

  constructor(
    private dashboardConfig: DashboardConfigService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('acesso') === 'negado') {
      this.acessoNegado.set(true);
      this.liveAnnouncer.announce('Acesso negado: Você não tem permissão para acessar a área solicitada.');
    }

    this.uiState$ = this.dashboardConfig.getDashboardState().pipe(
      tap(() => this.liveAnnouncer.announce('Resumo do dashboard carregado com sucesso.')),
      catchError(err => {
        this.erro.set('Não foi possível carregar as estatísticas.');
        this.liveAnnouncer.announce('Erro ao carregar estatísticas.');
        return of(null);
      })
    );
  }
}

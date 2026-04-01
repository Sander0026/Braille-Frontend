import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable, catchError, of, map, tap } from 'rxjs';
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

  constructor(
    private dashboardConfig: DashboardConfigService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('acesso') === 'negado') {
      this.acessoNegado.set(true);
    }

    this.uiState$ = this.dashboardConfig.getDashboardState().pipe(
      catchError(err => {
        this.erro.set('Não foi possível carregar as estatísticas.');
        return of(null);
      })
    );
  }
}

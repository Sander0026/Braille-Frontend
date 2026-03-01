import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService, DashboardStats } from '../../../core/services/dashboard.service';

interface StatCard {
  label: string;
  valor: number | null;
  icon: string;
  cor: string;
  rota: string;
  ariaLabel: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  stats: DashboardStats | null = null;
  isLoading = true;
  erro = '';

  cards: StatCard[] = [];

  constructor(private dashboardService: DashboardService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.dashboardService.getEstatisticas().subscribe({
      next: (data: DashboardStats) => {
        this.stats = data;
        this.isLoading = false;
        this.buildCards();
        this.cdr.detectChanges();
      },
      error: () => {
        this.erro = 'Não foi possível carregar as estatísticas.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private buildCards(): void {
    if (!this.stats) return;
    this.cards = [
      {
        label: 'Alunos Ativos',
        valor: this.stats.alunosAtivos,
        icon: 'people',
        cor: 'primary',
        rota: '/admin/alunos',
        ariaLabel: `${this.stats.alunosAtivos} alunos ativos. Ir para lista de alunos`
      },
      {
        label: 'Turmas Ativas',
        valor: this.stats.turmasAtivas,
        icon: 'school',
        cor: 'info',
        rota: '/admin/turmas',
        ariaLabel: `${this.stats.turmasAtivas} turmas ativas. Ir para lista de turmas`
      },
      {
        label: 'Equipe',
        valor: this.stats.membrosEquipe,
        icon: 'badge',
        cor: 'success',
        rota: '/admin/usuarios',
        ariaLabel: `${this.stats.membrosEquipe} membros da equipe. Ir para usuários`
      }
    ];
  }
}

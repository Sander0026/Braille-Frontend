import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { DashboardService, DashboardStats } from '../../../core/services/dashboard.service';
import { AuthService } from '../../../core/services/auth.service';

interface StatCard {
  label: string;
  valor: number | null;
  icon: string;
  cor: string;
  rota: string;
  ariaLabel: string;
  queryParams?: Record<string, string>;
}

interface ActionLink {
  label: string;
  icon: string;
  rota: string;
  ariaLabel: string;
  queryParams?: any;
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
  acoes: ActionLink[] = [];

  acessoNegado = false;
  userRole = 'PROFESSOR';

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.userRole = user?.role || 'PROFESSOR';

    // Verifica se veio de um redirect de acesso negado (role.guard)
    this.acessoNegado = this.route.snapshot.queryParamMap.get('acesso') === 'negado';

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

    // 1) Define todos os cards possíveis
    const cardAlunos: StatCard = {
      label: 'Alunos Ativos', valor: this.stats.alunosAtivos,
      icon: 'people', cor: 'primary', rota: '/admin/alunos',
      ariaLabel: `${this.stats.alunosAtivos} alunos ativos. Ir para lista de alunos`
    };
    const cardTurmas: StatCard = {
      label: 'Turmas Ativas', valor: this.stats.turmasAtivas,
      icon: 'school', cor: 'info', rota: '/admin/turmas',
      ariaLabel: `${this.stats.turmasAtivas} turmas ativas. Ir para lista de turmas`
    };
    const cardEquipe: StatCard = {
      label: 'Equipe', valor: this.stats.membrosEquipe,
      icon: 'badge', cor: 'success', rota: '/admin/usuarios',
      ariaLabel: `${this.stats.membrosEquipe} membros da equipe. Ir para usuários`
    };
    const cardComunicados: StatCard = {
      label: 'Comunicados', valor: this.stats.comunicadosGerais || 0,
      icon: 'speaker_notes', cor: 'warning', rota: '/admin/conteudo',
      queryParams: { aba: 'comunicados' },
      ariaLabel: `${this.stats.comunicadosGerais || 0} comunicados disponíveis. Gerenciar no site`
    };

    // 2) Filtra conforme o role do usuário logado
    this.cards = [];
    if (this.userRole === 'ADMIN') {
      this.cards = [cardAlunos, cardTurmas, cardEquipe, cardComunicados];
    } else if (this.userRole === 'SECRETARIA') {
      this.cards = [cardAlunos, cardTurmas];
    } else if (this.userRole === 'PROFESSOR') {
      // Professor foca no pedagógico: só as turmas (depois a api das turmas filtrará só as dele)
      this.cards = [cardTurmas];
    } else if (this.userRole === 'COMUNICACAO') {
      this.cards = [cardComunicados];
    }

    // 3) Monta os atalhos dinamicamente (Ações rápidas)
    this.acoes = [];
    if (['ADMIN', 'SECRETARIA'].includes(this.userRole)) {
      this.acoes.push({ rota: '/admin/alunos/cadastro', icon: 'person_add', label: 'Novo Aluno', ariaLabel: 'Cadastrar novo aluno' });
      this.acoes.push({ rota: '/admin/contatos', icon: 'mail', label: 'Fale Conosco', ariaLabel: 'Ver mensagens de contato' });
    }
    if (['ADMIN', 'PROFESSOR'].includes(this.userRole)) {
      this.acoes.push({ rota: '/admin/frequencias', icon: 'checklist', label: 'Realizar Chamada', ariaLabel: 'Ir para chamadas e frequências' });
    }
    if (['ADMIN', 'SECRETARIA', 'PROFESSOR'].includes(this.userRole)) {
      const labelTurma = this.userRole === 'PROFESSOR' ? 'Minhas Turmas' : 'Gerenciar Turmas';
      this.acoes.push({ rota: '/admin/turmas', icon: 'school', label: labelTurma, ariaLabel: 'Acessar turmas' });
    }
    if (['ADMIN', 'COMUNICACAO'].includes(this.userRole)) {
      this.acoes.push({ rota: '/admin/conteudo', icon: 'web', label: 'Gerenciar Site', ariaLabel: 'Acessar o gerenciador de conteúdo do portal' });
      // Ações específicas para ir direto para as abas (se o admin/conteudo suportasse deep linking, ou apenas como atalhos gerais)
      if (this.userRole === 'COMUNICACAO') {
        this.acoes.push({ rota: '/admin/conteudo', icon: 'campaign', label: 'Novo Comunicado', ariaLabel: 'Adicionar novo comunicado', queryParams: { aba: 'comunicados', novo: 'true', categoria: 'GERAL' } });
      }
    }
  }
}

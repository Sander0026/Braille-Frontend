import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DashboardStats, DashboardService } from '../../../core/services/dashboard.service';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardUIState, StatCardDef, ActionLinkDef } from '../models/dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardConfigService {
  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService
  ) {}

  getDashboardState(): Observable<DashboardUIState> {
    return this.dashboardService.getEstatisticas().pipe(
      map(stats => this.buildUIState(stats))
    );
  }

  private buildUIState(stats: DashboardStats): DashboardUIState {
    const user = this.authService.getUser();
    const role = user?.role || 'PROFESSOR';

    const cardAlunos: StatCardDef = {
      label: 'Alunos Ativos', valor: stats.alunosAtivos,
      icon: 'people', cor: 'primary', rota: '/admin/alunos',
      ariaLabel: `${stats.alunosAtivos} alunos ativos. Ir para lista de alunos`
    };
    const cardTurmas: StatCardDef = {
      label: 'Turmas Ativas', valor: stats.turmasAtivas,
      icon: 'school', cor: 'info', rota: '/admin/turmas',
      ariaLabel: `${stats.turmasAtivas} turmas ativas. Ir para lista de turmas`
    };
    const cardEquipe: StatCardDef = {
      label: 'Equipe', valor: stats.membrosEquipe,
      icon: 'badge', cor: 'success', rota: '/admin/usuarios',
      ariaLabel: `${stats.membrosEquipe} membros da equipe. Ir para usuários`
    };
    const cardComunicados: StatCardDef = {
      label: 'Comunicados', valor: stats.comunicadosGerais || 0,
      icon: 'speaker_notes', cor: 'warning', rota: '/admin/conteudo',
      queryParams: { aba: 'comunicados' },
      ariaLabel: `${stats.comunicadosGerais || 0} comunicados disponíveis. Gerenciar no site`
    };

    let cards: StatCardDef[] = [];
    if (role === 'ADMIN') {
      cards = [cardAlunos, cardTurmas, cardEquipe, cardComunicados];
    } else if (role === 'SECRETARIA') {
      cards = [cardAlunos, cardTurmas];
    } else if (role === 'PROFESSOR') {
      cards = [cardTurmas];
    } else if (role === 'COMUNICACAO') {
      cards = [cardComunicados];
    }

    const acoes: ActionLinkDef[] = [];
    if (['ADMIN', 'SECRETARIA'].includes(role)) {
      acoes.push({ rota: '/admin/alunos/cadastro', icon: 'person_add', label: 'Novo Aluno', ariaLabel: 'Cadastrar novo aluno' });
      acoes.push({ rota: '/admin/contatos', icon: 'mail', label: 'Fale Conosco', ariaLabel: 'Ver mensagens de contato' });
    }
    if (['ADMIN', 'PROFESSOR'].includes(role)) {
      acoes.push({ rota: '/admin/frequencias', icon: 'checklist', label: 'Realizar Chamada', ariaLabel: 'Ir para chamadas e frequências' });
    }
    if (['ADMIN', 'SECRETARIA', 'PROFESSOR'].includes(role)) {
      const labelTurma = role === 'PROFESSOR' ? 'Minhas Turmas' : 'Gerenciar Turmas';
      acoes.push({ rota: '/admin/turmas', icon: 'school', label: labelTurma, ariaLabel: 'Acessar turmas' });
    }
    if (['ADMIN', 'COMUNICACAO'].includes(role)) {
      acoes.push({ rota: '/admin/conteudo', icon: 'web', label: 'Gerenciar Site', ariaLabel: 'Acessar o gerenciador de conteúdo do portal' });
      if (role === 'COMUNICACAO') {
        acoes.push({ rota: '/admin/conteudo', icon: 'campaign', label: 'Novo Comunicado', ariaLabel: 'Adicionar novo comunicado', queryParams: { aba: 'comunicados', novo: 'true', categoria: 'GERAL' } });
      }
    }

    return { cards, acoes };
  }
}

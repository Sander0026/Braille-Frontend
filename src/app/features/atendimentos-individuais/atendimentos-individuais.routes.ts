import { Routes } from '@angular/router';
import { atendimentoIndividualPermissionGuard } from './guards/atendimento-individual-permission.guard';

export const ATENDIMENTOS_INDIVIDUAIS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [atendimentoIndividualPermissionGuard],
    loadComponent: () =>
      import('./pages/atendimento-individual-home/atendimento-individual-home.component')
        .then(m => m.AtendimentoIndividualHomeComponent),
  },
  {
    path: 'criar',
    canActivate: [atendimentoIndividualPermissionGuard],
    loadComponent: () =>
      import('./pages/criar-acompanhamento/criar-acompanhamento.component')
        .then(m => m.CriarAcompanhamentoComponent),
  },
  {
    path: 'dashboard',
    canActivate: [atendimentoIndividualPermissionGuard],
    data: { roles: ['ADMIN', 'SECRETARIA'] },
    loadComponent: () =>
      import('./pages/dashboard-atendimento/dashboard-atendimento.component')
        .then(m => m.DashboardAtendimentoComponent),
  },
  {
    path: 'em-andamento',
    canActivate: [atendimentoIndividualPermissionGuard],
    loadComponent: () =>
      import('./pages/acompanhamentos-em-andamento/acompanhamentos-em-andamento.component')
        .then(m => m.AcompanhamentosEmAndamentoComponent),
  },
  {
    path: 'finalizados',
    canActivate: [atendimentoIndividualPermissionGuard],
    loadComponent: () =>
      import('./pages/acompanhamentos-finalizados/acompanhamentos-finalizados.component')
        .then(m => m.AcompanhamentosFinalizadosComponent),
  },
  {
    path: 'arquivados',
    canActivate: [atendimentoIndividualPermissionGuard],
    data: { roles: ['ADMIN', 'SECRETARIA'] },
    loadComponent: () =>
      import('./pages/acompanhamentos-arquivados/acompanhamentos-arquivados.component')
        .then(m => m.AcompanhamentosArquivadosComponent),
  },
  {
    path: 'relatorio',
    canActivate: [atendimentoIndividualPermissionGuard],
    loadComponent: () =>
      import('./pages/relatorio-atendimento/relatorio-atendimento.component')
        .then(m => m.RelatorioAtendimentoComponent),
  },
  {
    path: ':id/novo-atendimento',
    canActivate: [atendimentoIndividualPermissionGuard],
    loadComponent: () =>
      import('./pages/novo-atendimento/novo-atendimento.component')
        .then(m => m.NovoAtendimentoComponent),
  },
  {
    path: ':id',
    canActivate: [atendimentoIndividualPermissionGuard],
    loadComponent: () =>
      import('./pages/detalhe-acompanhamento/detalhe-acompanhamento.component')
        .then(m => m.DetalheAcompanhamentoComponent),
  },
];

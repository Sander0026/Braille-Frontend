import { Routes } from '@angular/router';
import { atendimentoIndividualPermissionGuard } from './guards/atendimento-individual-permission.guard';
import { descarteGuard } from '../../core/guards/descarte.guard';

export const ATENDIMENTOS_INDIVIDUAIS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [atendimentoIndividualPermissionGuard],
    loadComponent: () =>
      import('./pages/atendimento-individual-home/atendimento-individual-home.component')
        .then(m => m.AtendimentoIndividualHomeComponent),
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
    path: ':id',
    canActivate: [atendimentoIndividualPermissionGuard],
    canDeactivate: [descarteGuard],
    loadComponent: () =>
      import('./pages/detalhe-acompanhamento/detalhe-acompanhamento.component')
        .then(m => m.DetalheAcompanhamentoComponent),
  },
];

import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // ── Área Pública ───────────────────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./layouts/public-layout/public-layout').then(m => m.PublicLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/public/home/home').then(m => m.Home)
      }
    ]
  },

  // ── Área Admin (protegida por JWT) ─────────────────────────────
  {
    path: 'admin',
    loadComponent: () => import('./layouts/admin-layout/admin-layout').then(m => m.AdminLayout),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // Dashboard
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/admin/dashboard/dashboard').then(m => m.Dashboard),
        title: 'Dashboard — ILBES'
      },

      // Alunos / Beneficiários
      {
        path: 'alunos',
        loadComponent: () => import('./features/beneficiaries/beneficiary-list/beneficiary-list').then(m => m.BeneficiaryList),
        title: 'Alunos — ILBES'
      },
      {
        path: 'alunos/cadastro',
        loadComponent: () => import('./pages/admin/beneficiarios/cadastro-wizard/cadastro-wizard').then(m => m.CadastroWizard),
        title: 'Novo Aluno — ILBES'
      },

      // Turmas
      {
        path: 'turmas',
        loadComponent: () => import('./pages/admin/turmas/turmas-lista/turmas-lista').then(m => m.TurmasLista),
        title: 'Turmas — ILBES'
      },

      // Frequências
      {
        path: 'frequencias',
        loadComponent: () => import('./pages/admin/frequencias/frequencias-lista/frequencias-lista').then(m => m.FrequenciasLista),
        title: 'Frequências — ILBES'
      },

      // Comunicados
      {
        path: 'comunicados',
        loadComponent: () => import('./pages/admin/comunicados/comunicados-lista/comunicados-lista').then(m => m.ComunicadosLista),
        title: 'Comunicados — ILBES'
      },

      // Inscrições do site
      {
        path: 'inscricoes',
        loadComponent: () => import('./pages/admin/inscricoes/inscricoes-lista/inscricoes-lista').then(m => m.InscricoesLista),
        title: 'Inscrições — ILBES'
      },

      // Contatos / Fale Conosco
      {
        path: 'contatos',
        loadComponent: () => import('./pages/admin/contatos/contatos-lista/contatos-lista').then(m => m.ContatosLista),
        title: 'Fale Conosco — ILBES'
      },

      // Usuários
      {
        path: 'usuarios',
        loadComponent: () => import('./pages/admin/usuarios/usuarios-lista/usuarios-lista').then(m => m.UsuariosLista),
        title: 'Usuários — ILBES'
      },
      {
        path: 'usuarios/cadastro',
        loadComponent: () => import('./pages/admin/usuarios/cadastro-usuario-wizard/cadastro-usuario-wizard').then(m => m.CadastroUsuarioWizard),
        title: 'Novo Usuário — ILBES'
      }
    ]
  },

  {
    path: 'login',
    loadComponent: () => import('./pages/public/login/login').then(m => m.Login),
    title: 'Entrar — ILBES'
  },

  // ── 404 ───────────────────────────────────────────────────────
  { path: '**', redirectTo: '' }
];
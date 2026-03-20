import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { descarteGuard } from './core/guards/descarte.guard';

export const routes: Routes = [
  // ── Área Pública ───────────────────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./layouts/public-layout/public-layout').then(m => m.PublicLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/public/home/home').then(m => m.Home),
        title: 'Início — Instituto Luiz Braille'
      },
      {
        path: 'sobre',
        loadComponent: () => import('./pages/public/sobre/sobre').then(m => m.Sobre),
        title: 'Sobre Nós — Instituto Luiz Braille'
      },
      {
        path: 'contato',
        loadComponent: () => import('./pages/public/contato/contato').then(m => m.Contato),
        title: 'Fale Conosco — Instituto Luiz Braille'
      },
      {
        path: 'noticias',
        loadComponent: () => import('./pages/public/noticias-lista/noticias-lista').then(m => m.NoticiasLista),
        title: 'Notícias e Comunicados — ILBES'
      },
      {
        path: 'noticias/:id',
        loadComponent: () => import('./pages/public/noticia-detalhe/noticia-detalhe').then(m => m.NoticiaDetalhe),
        title: 'Notícia — Instituto Luiz Braille'
      }
    ]
  },

  // ── Área Admin (protegida por JWT) ─────────────────────────────
  {
    path: 'admin',
    loadComponent: () => import('./layouts/admin-layout/admin-layout').then(m => m.AdminLayout),
    canActivate: [authGuard, roleGuard],
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
        title: 'Alunos — ILBES',
        data: { roles: ['ADMIN', 'SECRETARIA'] }
      },
      {
        path: 'alunos/cadastro',
        loadComponent: () => import('./pages/admin/beneficiarios/cadastro-wizard/cadastro-wizard').then(m => m.CadastroWizard),
        title: 'Novo Aluno — ILBES',
        canDeactivate: [descarteGuard],
        data: { roles: ['ADMIN', 'SECRETARIA'] }
      },

      // Turmas
      {
        path: 'turmas',
        loadComponent: () => import('./pages/admin/turmas/turmas-lista/turmas-lista').then(m => m.TurmasLista),
        title: 'Turmas — ILBES'
      },
      {
        path: 'turmas/cadastro',
        loadComponent: () => import('./pages/admin/turmas/cadastro-turma-wizard/cadastro-turma-wizard').then(m => m.CadastroTurmaWizard),
        title: 'Nova Oficina — ILBES',
        canDeactivate: [descarteGuard],
        data: { roles: ['ADMIN', 'SECRETARIA'] }
      },

      // Frequências
      {
        path: 'frequencias',
        loadComponent: () => import('./pages/admin/frequencias/frequencias-lista/frequencias-lista').then(m => m.FrequenciasLista),
        title: 'Frequências — ILBES'
      },

      // Conteúdo do Site (CMS)
      {
        path: 'conteudo',
        loadComponent: () => import('./pages/admin/conteudo-site/conteudo-site').then(m => m.ConteudoSite),
        title: 'Conteúdo do Site — ILBES',
        data: { roles: ['ADMIN', 'COMUNICACAO'] }
      },

      // Contatos / Fale Conosco
      {
        path: 'contatos',
        loadComponent: () => import('./pages/admin/contatos/contatos-lista/contatos-lista').then(m => m.ContatosLista),
        title: 'Fale Conosco — ILBES',
        data: { roles: ['ADMIN', 'SECRETARIA'] }
      },

      // Usuários
      {
        path: 'usuarios',
        loadComponent: () => import('./pages/admin/usuarios/usuarios-lista/usuarios-lista').then(m => m.UsuariosLista),
        title: 'Usuários — ILBES',
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'usuarios/cadastro',
        loadComponent: () => import('./pages/admin/usuarios/cadastro-usuario-wizard/cadastro-usuario-wizard').then(m => m.CadastroUsuarioWizard),
        title: 'Novo Usuário — ILBES',
        data: { roles: ['ADMIN'] }
      },

      // Auditoria — Fase 5
      {
        path: 'auditoria',
        loadComponent: () => import('./pages/admin/audit-log/audit-log-lista/audit-log-lista').then(m => m.AuditLogLista),
        title: 'Auditoria do Sistema — ILBES',
        data: { roles: ['ADMIN'] }
      }
    ]
  },


  {
    path: 'login',
    loadComponent: () => import('./pages/public/login/login').then(m => m.Login),
    title: 'Entrar — ILBES'
  },

  // ── 404 ───────────────────────────────────────────────────────
  {
    path: '**',
    loadComponent: () => import('./pages/public/not-found/not-found').then(m => m.NotFound),
    title: 'Página Não Encontrada — ILBES'
  }
];
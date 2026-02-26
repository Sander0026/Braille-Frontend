import { Routes } from '@angular/router';

// Layouts
import { PublicLayout } from './layouts/public-layout/public-layout';
import { AdminLayout } from './layouts/admin-layout/admin-layout';

// Telas Públicas
import { Home } from './pages/public/home/home';
import { Login } from './pages/public/login/login';

// Telas Privadas (Admin)
import { Dashboard } from './pages/admin/dashboard/dashboard';
import { CadastroWizard } from './pages/admin/beneficiarios/cadastro-wizard/cadastro-wizard';
import { UsuariosLista } from './pages/admin/usuarios/usuarios-lista/usuarios-lista';
import { CadastroUsuarioWizard } from './pages/admin/usuarios/cadastro-usuario-wizard/cadastro-usuario-wizard';

// O nosso Segurança!
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  // ==========================================
  // 🌐 ÁREA PÚBLICA (Site Institucional)
  // ==========================================
  {
    path: '',
    component: PublicLayout,
    children: [
      { path: '', component: Home } // Página inicial do site
    ]
  },
  { path: 'login', component: Login }, // Tela de entrar no sistema

  // ==========================================
  // 🔒 ÁREA RESTRITA (Gerenciamento da Instituição)
  // ==========================================
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [authGuard], // 👈 O CADEADO! Ninguém entra aqui sem token.
    children: [
      { path: '', component: Dashboard },
      { path: 'beneficiarios/cadastro', component: CadastroWizard },
      { path: 'usuarios', component: UsuariosLista },
      { path: 'usuarios/cadastro', component: CadastroUsuarioWizard },
      { path: 'turmas', loadComponent: () => import('./pages/admin/turmas/turmas-lista/turmas-lista').then(m => m.TurmasLista) },
      { path: 'turmas/cadastro', loadComponent: () => import('./pages/admin/turmas/cadastro-turma-wizard/cadastro-turma-wizard').then(m => m.CadastroTurmaWizard) }

      // Futuramente, adicionaremos rotas com verificação de Role aqui:
      // { path: 'professores/diario', component: DiarioClasse, canActivate: [roleGuard] }
    ]
  },

  // ==========================================
  // ⚠️ ROTA CORINGA (Página 404)
  // ==========================================
  // Se o usuário digitar um link que não existe, manda de volta pro início
  { path: '**', redirectTo: '' }
];
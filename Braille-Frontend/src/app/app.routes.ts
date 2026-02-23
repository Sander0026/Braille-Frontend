import { Routes } from '@angular/router';
import { PublicLayout } from './layouts/public-layout/public-layout';
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { Home } from './pages/public/home/home';
import { Dashboard } from './pages/admin/dashboard/dashboard';

export const routes: Routes = [
  // 🌐 ROTA PÚBLICA (Usa a casca do Site Institucional)
  {
    path: '',
    component: PublicLayout,
    children: [
      { path: '', component: Home },
      // O Mural de Comunicados entrará aqui depois!
    ]
  },

  // 🔒 ROTA PRIVADA (Usa a casca do Painel de Gestão)
  {
    path: 'admin',
    component: AdminLayout,
    children: [
      { path: '', component: Dashboard },
      // Telas de Alunos, Turmas e Usuários entrarão aqui depois!
    ]
  }
];
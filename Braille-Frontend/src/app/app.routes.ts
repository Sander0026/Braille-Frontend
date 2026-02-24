import { Routes } from '@angular/router';
import { PublicLayout} from './layouts/public-layout/public-layout';
import { AdminLayout} from './layouts/admin-layout/admin-layout';
import { Home } from './pages/public/home/home';
import { Dashboard } from './pages/admin/dashboard/dashboard';
import { Login } from './pages/public/login/login'; 
import { CadastroWizard } from './pages/admin/beneficiarios/cadastro-wizard/cadastro-wizard';

export const routes: Routes = [
  // 🌐 ROTA PÚBLICA (Site Institucional)
  {
    path: '',
    component: PublicLayout,
    children: [
      { path: '', component: Home },
      { path: 'login', component: Login } // 👈 2. Tem que estar exatamente AQUI, com vírgula na linha de cima!
    ]
  },

  // 🔒 ROTA PRIVADA (Painel de Gestão)
  {
    path: 'admin',
    component: AdminLayout,
    children: [
      { path: '', component: Dashboard },
      { path: 'beneficiarios/cadastro', component: CadastroWizard }
    ]
  }
];
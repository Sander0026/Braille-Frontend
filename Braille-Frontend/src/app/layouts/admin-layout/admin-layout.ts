import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, UserInfo } from '../../core/services/auth.service';
import { Router } from '@angular/router';

interface NavItem {
  rota: string;
  label: string;
  icon: string;
  aria: string;
}

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss'
})
export class AdminLayout implements OnInit {
  isSidebarOpen = true;
  usuario: UserInfo | null = null;

  readonly navItems: NavItem[] = [
    { rota: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard', aria: 'Ir para Dashboard' },
    { rota: '/admin/alunos', label: 'Alunos', icon: 'people', aria: 'Ir para lista de alunos' },
    { rota: '/admin/turmas', label: 'Turmas', icon: 'school', aria: 'Ir para lista de turmas' },
    { rota: '/admin/frequencias', label: 'Frequências', icon: 'checklist', aria: 'Ir para registro de frequências' },
    { rota: '/admin/comunicados', label: 'Comunicados', icon: 'campaign', aria: 'Ir para comunicados' },
    { rota: '/admin/contatos', label: 'Fale Conosco', icon: 'mail', aria: 'Ir para mensagens de contato' },
    { rota: '/admin/usuarios', label: 'Usuários', icon: 'manage_accounts', aria: 'Ir para gestão de usuários' },
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.usuario = this.authService.getUser();
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  sair(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  get iniciais(): string {
    if (!this.usuario?.username) return 'U';
    return this.usuario.username.slice(0, 2).toUpperCase();
  }

  get labelCargo(): string {
    const roles: Record<string, string> = {
      ADMIN: 'Administrador',
      SECRETARIA: 'Secretaria',
      PROFESSOR: 'Professor'
    };
    return roles[this.usuario?.role ?? ''] ?? 'Usuário';
  }
}

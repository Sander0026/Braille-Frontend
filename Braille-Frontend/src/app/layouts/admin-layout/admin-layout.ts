import { Component, OnInit, HostListener } from '@angular/core';
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

/** Estados possíveis do sidebar */
type SidebarState = 'full' | 'icons' | 'hidden';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss'
})
export class AdminLayout implements OnInit {
  sidebarState: SidebarState = 'full';
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
    this.setSidebarForViewport();
  }

  /** Ajusta o estado inicial conforme viewport */
  private setSidebarForViewport(): void {
    this.sidebarState = window.innerWidth > 768 ? 'full' : 'icons';
  }

  /** Botão de toggle do header */
  toggleSidebar(): void {
    if (window.innerWidth > 768) {
      // Desktop: alterna entre full ↔ icons
      this.sidebarState = this.sidebarState === 'full' ? 'icons' : 'full';
    } else {
      // Mobile: alterna entre icons ↔ hidden
      this.sidebarState = this.sidebarState === 'hidden' ? 'icons' : 'hidden';
    }
  }

  /** Quando a tela redimensiona, reajusta o sidebar */
  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth > 768 && this.sidebarState === 'hidden') {
      this.sidebarState = 'icons';
    }
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

  /** Ícone do botão de toggle (hamburguer / seta) */
  get toggleIcon(): string {
    if (window.innerWidth <= 768) {
      return this.sidebarState === 'hidden' ? 'menu' : 'close';
    }
    return this.sidebarState === 'full' ? 'chevron_left' : 'chevron_right';
  }

  get toggleLabel(): string {
    if (window.innerWidth <= 768) {
      return this.sidebarState === 'hidden' ? 'Abrir menu lateral' : 'Fechar menu lateral';
    }
    return this.sidebarState === 'full' ? 'Recolher menu lateral' : 'Expandir menu lateral';
  }

  get showLabels(): boolean {
    return this.sidebarState === 'full';
  }
}

import { Component, Input, Output, EventEmitter, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AccessibilityService, FonteSize } from '../../services/accessibility.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent {
  // ── Modos e Temas ─────────────────────────────────────────
  @Input() theme: 'public' | 'admin' = 'public';

  // ── Public Header ─────────────────────────────────────────
  @Input() isMobileMenuOpen = false;
  @Output() readonly mobileMenuToggle = new EventEmitter<void>();
  @Output() readonly closeMobile = new EventEmitter<void>();

  // ── Admin Header ──────────────────────────────────────────
  @Input() nomeDisplay = '';
  @Input() fotoPerfil: string | null = null;
  @Input() iniciaisDisplay = '';
  @Input() labelCargo = '';
  @Input() perfilEmail: string | undefined | null = '';
  @Input() sidebarState: 'full' | 'icons' | 'hidden' = 'full';
  @Input() toggleIcon = 'menu';
  @Input() toggleLabel = 'Alternar menu lateral';
  
  // Controle interno do Dropdown do admin
  menuAberto = false;

  @Output() readonly sidebarToggle = new EventEmitter<void>();
  @Output() readonly userAction = new EventEmitter<'perfil' | 'foto' | 'senha' | 'sair'>();

  // ── Serviços (via inject readonly) ────────────────────────
  readonly a11y = inject(AccessibilityService);

  // ── Ações Public ──────────────────────────────────────────
  toggleMobileMenu(): void {
    this.mobileMenuToggle.emit();
  }

  closeMobileMenu(): void {
    this.closeMobile.emit();
  }

  // ── Ações Admin ───────────────────────────────────────────
  toggleSidebar(): void {
    this.sidebarToggle.emit();
  }

  toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.menuAberto = !this.menuAberto;
  }

  // Fecha o dropdown ao clicar em qualquer lugar da página (fora do menu)
  // O stopPropagation() no botão e no dropdown impede que este listener
  // dispare ao clicar dentro do menu — só fecha quando clica fora.
  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.menuAberto) this.menuAberto = false;
  }

  // Fecha o dropdown com Escape (acessibilidade WCAG 2.1)
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.menuAberto) this.menuAberto = false;
  }

  emitUserAction(action: 'perfil' | 'foto' | 'senha' | 'sair'): void {
    this.menuAberto = false;
    this.userAction.emit(action);
  }

  // ── Ações Acessibilidade (Comuns) ─────────────────────────
  setFonte(tamanho: FonteSize): void {
    this.a11y.setFonte(tamanho);
  }

  toggleAltoContraste(): void {
    this.a11y.toggleAltoContraste();
  }
}


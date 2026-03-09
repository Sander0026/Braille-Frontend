import { Component, OnInit, OnDestroy, HostListener, ElementRef, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService, UserInfo, PerfilUsuario } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ConfirmDialog } from '../../core/components/confirm-dialog/confirm-dialog.component';
import { ToastComponent } from '../../core/components/toast/toast.component';
import { AccessibilityService, FonteSize } from '../../core/services/accessibility.service';
import { HotkeysService, HotkeyAction } from '../../core/services/hotkeys.service';

interface NavItem {
  rota: string;
  label: string;
  icon: string;
  aria: string;
  role?: string[];
}

type SidebarState = 'full' | 'icons' | 'hidden';
type Modal = 'none' | 'foto' | 'senha' | 'perfil' | 'hotkeys';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, ReactiveFormsModule, ConfirmDialog, ToastComponent],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss'
})
export class AdminLayout implements OnInit, OnDestroy {
  // ── Sidebar ──────────────────────────────────────────
  sidebarState: SidebarState = 'full';
  isMobile = false;

  // ── Usuário ──────────────────────────────────────────
  usuario: UserInfo | null = null;
  perfil: PerfilUsuario | null = null;
  fotoPerfil: string | null = null;
  nomeDisplay = 'Usuário';
  iniciaisDisplay = 'U';

  // ── Dropdown de perfil ───────────────────────────────
  menuAberto = false;

  // ── Modais ───────────────────────────────────────────
  modalAtivo: Modal = 'none';
  hotkeysDisponiveis: HotkeyAction[] = [];

  // ── Form: Trocar Senha ───────────────────────────────
  formSenha!: FormGroup;
  senhaErro: string | null = null;
  senhaSucesso = false;
  carregandoSenha = false;

  // ── Form: Perfil ─────────────────────────────────────
  formPerfil!: FormGroup;
  perfilErro: string | null = null;
  perfilSucesso = false;
  carregandoPerfil = false;

  // ── Form: Trocar Foto ────────────────────────────────
  fotoPreview: string | null = null;
  fotoSelecionada: File | null = null;
  fotoErro: string | null = null;
  carregandoFoto = false;


  private destroy$ = new Subject<void>();

  readonly navItems: NavItem[] = [
    { rota: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard', aria: 'Ir para Dashboard' },
    { rota: '/admin/alunos', label: 'Alunos', icon: 'people', aria: 'Ir para lista de alunos', role: ['ADMIN', 'SECRETARIA'] },
    { rota: '/admin/turmas', label: 'Turmas', icon: 'school', aria: 'Ir para lista de turmas', role: ['ADMIN', 'SECRETARIA', 'PROFESSOR'] },
    { rota: '/admin/frequencias', label: 'Frequências', icon: 'checklist', aria: 'Ir para frequências', role: ['ADMIN', 'SECRETARIA', 'PROFESSOR'] },
    { rota: '/admin/conteudo', label: 'Conteúdo do Site', icon: 'web', aria: 'Gerir conteúdo público', role: ['ADMIN', 'COMUNICACAO'] },
    { rota: '/admin/contatos', label: 'Fale Conosco', icon: 'mail', aria: 'Ir para contatos', role: ['ADMIN', 'SECRETARIA', 'COMUNICACAO'] },
    { rota: '/admin/usuarios', label: 'Usuários', icon: 'manage_accounts', aria: 'Ir para usuários', role: ['ADMIN'] },
    { rota: '/admin/auditoria', label: 'Auditoria', icon: 'policy', aria: 'Ver logs de auditoria do sistema', role: ['ADMIN'] },
  ];


  get rotasPermitidas(): NavItem[] {
    const userRole = this.usuario?.role || 'PROFESSOR';
    return this.navItems.filter(item => {
      // Se a rota tem restrição de role, verifica. Senão, mostra pra todos
      if (item.role) {
        return item.role.includes(userRole);
      }
      return true;
    });
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private elRef: ElementRef,
    private cdr: ChangeDetectorRef,
    public a11y: AccessibilityService,
    private hotkeysService: HotkeysService
  ) { }

  ngOnInit(): void {
    this.usuario = this.authService.getUser();
    this.updateMobileState();
    this.inicializarFormSenha();
    this.inicializarFormPerfil();
    this.carregarPerfil();

    this.hotkeysDisponiveis = this.hotkeysService.getRegisteredHotkeys();
    this.hotkeysService.onHelpRequested$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.abrirModalHotkeys();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Perfil ──────────────────────────────────────────
  private carregarPerfil(): void {
    this.authService.getMe()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (perfil) => {
          // Adiar para fora do ciclo de verificação atual (evita NG0100)
          Promise.resolve().then(() => {
            this.perfil = perfil;
            this.fotoPerfil = perfil.fotoPerfil;
            this.atualizarDisplayUser();
            this.atualizarFormPerfil(perfil);
            this.cdr.detectChanges();
          });
        },
        error: () => {
          Promise.resolve().then(() => {
            this.atualizarDisplayUser();
            this.cdr.detectChanges();
          });
        }
      });
  }

  private atualizarFormPerfil(perfil: PerfilUsuario): void {
    this.formPerfil?.patchValue({
      nome: perfil.nome ?? '',
      email: perfil.email ?? '',
    });
  }

  // ── Sidebar ─────────────────────────────────────────
  private updateMobileState(): void {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= 768;

    if (!wasMobile && this.isMobile) {
      if (this.sidebarState === 'full') this.sidebarState = 'icons';
    } else if (wasMobile && !this.isMobile) {
      if (this.sidebarState === 'hidden') this.sidebarState = 'icons';
    } else if (!this.isMobile && this.sidebarState !== 'icons') {
      this.sidebarState = 'full';
    } else if (this.isMobile && this.sidebarState === 'full') {
      this.sidebarState = 'icons';
    }
  }

  @HostListener('window:resize')
  onResize(): void { this.updateMobileState(); }

  toggleSidebar(): void {
    if (!this.isMobile) {
      this.sidebarState = this.sidebarState === 'full' ? 'icons' : 'full';
    } else {
      this.sidebarState = this.sidebarState === 'hidden' ? 'icons' : 'hidden';
    }
  }

  // ── Dropdown ─────────────────────────────────────────
  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.menuAberto = !this.menuAberto;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const menuEl = this.elRef.nativeElement.querySelector('.user-menu-wrapper');
    if (menuEl && !menuEl.contains(event.target as Node)) {
      this.menuAberto = false;
    }
  }

  // ── Modais ───────────────────────────────────────────
  abrirModalFoto(): void {
    this.menuAberto = false;
    this.fotoPreview = null;
    this.fotoSelecionada = null;
    this.fotoErro = null;
    this.modalAtivo = 'foto';
  }

  abrirModalSenha(): void {
    this.menuAberto = false;
    this.formSenha.reset();
    this.senhaErro = null;
    this.senhaSucesso = false;
    this.modalAtivo = 'senha';
  }

  abrirModalPerfil(): void {
    this.menuAberto = false;
    this.perfilErro = null;
    this.perfilSucesso = false;
    if (this.perfil) this.atualizarFormPerfil(this.perfil);
    this.modalAtivo = 'perfil';
  }

  abrirModalHotkeys(): void {
    this.menuAberto = false;
    this.modalAtivo = 'hotkeys';
    this.cdr.detectChanges();
  }

  fecharModal(): void {
    this.modalAtivo = 'none';
  }

  // ── Foto ─────────────────────────────────────────────
  onFotoSelecionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.fotoErro = null;

    if (!file) return;

    const extensoesValidas = ['image/jpeg', 'image/png', 'image/webp'];
    if (!extensoesValidas.includes(file.type)) {
      this.fotoErro = 'Formato inválido. Use JPG, PNG ou WebP.';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.fotoErro = 'A imagem deve ter no máximo 2 MB.';
      return;
    }

    this.fotoSelecionada = file;
    const reader = new FileReader();
    reader.onload = (e) => { this.fotoPreview = e.target?.result as string; };
    reader.readAsDataURL(file);
  }

  salvarFoto(): void {
    if (!this.fotoSelecionada || this.carregandoFoto) return;

    this.carregandoFoto = true;
    this.fotoErro = null;

    this.authService.uploadFoto(this.fotoSelecionada)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ url }) => {
          this.authService.atualizarFoto(url)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.fotoPerfil = url;
                this.carregandoFoto = false;
                this.fecharModal();
                this.cdr.detectChanges();
              },
              error: () => {
                this.fotoErro = 'Erro ao salvar a foto. Tente novamente.';
                this.carregandoFoto = false;
                this.cdr.detectChanges();
              }
            });
        },
        error: () => {
          this.fotoErro = 'Erro ao fazer o upload. Tente novamente.';
          this.carregandoFoto = false;
          this.cdr.detectChanges();
        }
      });
  }

  // ── Senha ─────────────────────────────────────────────
  private inicializarFormSenha(): void {
    this.formSenha = this.fb.group({
      senhaAtual: ['', Validators.required],
      novaSenha: ['', [Validators.required, Validators.minLength(8)]],
      confirmarSenha: ['', Validators.required]
    }, { validators: this.senhasIguaisValidator });
  }

  private inicializarFormPerfil(): void {
    this.formPerfil = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', Validators.email],
    });
  }

  salvarPerfil(): void {
    if (this.formPerfil.invalid || this.carregandoPerfil) return;
    const { nome, email } = this.formPerfil.value;
    this.carregandoPerfil = true;
    this.perfilErro = null;
    this.authService.atualizarPerfil({ nome, email: email || undefined })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (p) => {
          this.perfil = p;
          this.carregandoPerfil = false;
          this.perfilSucesso = true;
          this.cdr.detectChanges();
          setTimeout(() => {
            this.perfilSucesso = false;
            this.cdr.detectChanges();
          }, 2500);
        },
        error: (err) => {
          this.carregandoPerfil = false;
          this.perfilErro = err?.error?.message ?? 'Erro ao atualizar o perfil.';
          this.cdr.detectChanges();
        }
      });
  }

  private senhasIguaisValidator(group: FormGroup): { [key: string]: boolean } | null {
    const nova = group.get('novaSenha')?.value;
    const confirmar = group.get('confirmarSenha')?.value;
    return nova && confirmar && nova !== confirmar ? { senhasDiferentes: true } : null;
  }

  get confirmacaoInvalida(): boolean {
    return !!(this.formSenha.hasError('senhasDiferentes') &&
      this.formSenha.get('confirmarSenha')?.touched);
  }

  salvarSenha(): void {
    if (this.formSenha.invalid || this.carregandoSenha) return;

    const { senhaAtual, novaSenha } = this.formSenha.value;
    this.carregandoSenha = true;
    this.senhaErro = null;

    this.authService.trocarSenha(senhaAtual, novaSenha)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.carregandoSenha = false;
          this.senhaSucesso = true;
          this.cdr.detectChanges();
          setTimeout(() => this.fecharModal(), 1800);
        },
        error: (err) => {
          this.carregandoSenha = false;
          this.senhaErro = err?.error?.message ?? 'Erro ao trocar a senha. Verifique a senha atual.';
          this.cdr.detectChanges();
        }
      });
  }

  // ── Helpers ──────────────────────────────────────────
  sair(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private atualizarDisplayUser(): void {
    this.nomeDisplay = this.perfil?.nome ?? this.usuario?.nome ?? this.usuario?.username ?? 'Usuário';
    this.iniciaisDisplay = this.nomeDisplay.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  }

  get labelCargo(): string {
    const roles: Record<string, string> = {
      ADMIN: 'Administrador',
      SECRETARIA: 'Secretaria',
      PROFESSOR: 'Professor',
      COMUNICACAO: 'Comunicação'
    };
    return roles[this.perfil?.role ?? this.usuario?.role ?? ''] ?? 'Usuário';
  }

  get toggleIcon(): string {
    return this.isMobile
      ? (this.sidebarState === 'hidden' ? 'menu' : 'close')
      : (this.sidebarState === 'full' ? 'chevron_left' : 'chevron_right');
  }

  get toggleLabel(): string {
    return this.isMobile
      ? (this.sidebarState === 'hidden' ? 'Abrir menu lateral' : 'Fechar menu lateral')
      : (this.sidebarState === 'full' ? 'Recolher menu lateral' : 'Expandir menu lateral');
  }

  get showLabels(): boolean {
    return this.sidebarState === 'full';
  }

  // ── Acessibilidade ───────────────────────────────────
  toggleAltoContraste(): void {
    this.a11y.toggleAltoContraste();
  }

  setFonte(tamanho: FonteSize): void {
    this.a11y.setFonte(tamanho);
  }

  get fonteAtual(): FonteSize {
    return this.a11y.fonteAtual;
  }

  get altoContrasteAtivo(): boolean {
    return this.a11y.isAltoContraste;
  }
}

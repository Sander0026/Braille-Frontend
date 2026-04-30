# Modulo: Layout, Navegacao e Shell Visual

---

# 1. Visao Geral

## Objetivo

Documentar os shells visuais publico e administrativo, header, sidebar, footer, modais de perfil, foto, senha, atalhos e o fluxo de navegacao responsivo.

## Responsabilidade

`PublicLayout` organiza a experiencia publica com menu, footer e CTA flutuante. `AdminLayout` organiza a experiencia autenticada com sidebar RBAC, header de usuario, acessibilidade, modais, atalhos e `RouterOutlet` para telas internas.

## Fluxo de Funcionamento

As rotas carregam `PublicLayout` ou `AdminLayout`. Cada layout renderiza elementos comuns e delega a tela ativa ao `RouterOutlet`. O admin carrega usuario/perfil, filtra menu por papel, alterna sidebar conforme viewport, captura atalhos e abre modais de conta.

---

# 2. Arquitetura e Metodologias

## Padroes Arquiteturais Identificados

* Shell layout pattern.
* Smart/container component em `AdminLayout`.
* Presentational components em `HeaderComponent` e `Sidebar`.
* EventEmitter pattern para comunicacao filho-pai.
* OnPush change detection no admin/public layouts.
* Signals para estado simples no `PublicLayout`.
* RBAC visual por filtro de navegacao.
* Accessibility-first navigation com foco, labels e contraste.

## Justificativa Tecnica

A separacao entre layout e paginas reduz repeticao de header/sidebar. `AdminLayout` centraliza comportamento de sessao para evitar que cada pagina trate perfil e logout. `HeaderComponent` recebe dados por `@Input` e emite acoes, mantendo baixo acoplamento. `Sidebar` recebe `rotasPermitidas`, portanto nao conhece regras de autenticacao.

---

# 3. Fluxo Interno do Codigo

## Fluxo de Execucao

1. Rota publica carrega `PublicLayout`; rota admin carrega `AdminLayout`.
2. `PublicLayout` injeta `AccessibilityService`, guarda estado `isMobileMenuOpen` em signal e oferece `toggleMobileMenu`/`closeMobileMenu`.
3. `AdminLayout.ngOnInit` le usuario do JWT, atualiza estado mobile, busca perfil completo e carrega atalhos registrados.
4. `AdminLayout.rotasPermitidas` filtra `navItems` pelo papel do usuario.
5. `HeaderComponent` renderiza modo publico ou admin conforme `theme`.
6. Acoes de header (`perfil`, `foto`, `senha`, `sair`) sobem via `userAction`.
7. `AdminLayout` abre modais e preserva o elemento focado antes do modal.
8. Ao fechar modal, foco retorna ao elemento anterior.
9. `Sidebar` emite `sair` quando solicitado.
10. Resize da janela recalcula estado da sidebar.

## Dependencias Internas

* `AuthService`
* `AccessibilityService`
* `HotkeysService`
* `ConfirmDialogService`
* `HeaderComponent`
* `Sidebar`
* `FooterComponent`
* `ToastComponent`
* `ConfirmDialog`
* `ModalFotoComponent`
* `ModalSenhaComponent`
* `ModalPerfilComponent`
* `ModalHotkeysComponent`
* `FloatingCtaComponent`

## Dependencias Externas

* `@angular/core`
* `@angular/common`
* `@angular/router`
* `@angular/cdk/a11y`
* `rxjs`

---

# 4. Dicionario Tecnico

## Variaveis

* `sidebarState`: `'full' | 'icons' | 'hidden'`; controla densidade da sidebar.
* `isMobile`: booleano derivado de `window.innerWidth <= 768`.
* `usuario`: payload decodificado do JWT.
* `perfil`: perfil completo carregado via API.
* `fotoPerfil`: URL da foto atual.
* `nomeDisplay`: nome exibido no header.
* `iniciaisDisplay`: fallback visual quando nao ha foto.
* `modalAtivo`: `'none' | 'foto' | 'senha' | 'perfil' | 'hotkeys'`.
* `hotkeysDisponiveis`: lista de atalhos registrados.
* `lastFocusBeforeModal`: ancora de foco para acessibilidade.
* `navItems`: matriz de rotas, labels, icones, aria-labels e roles.
* `isMobileMenuOpen`: signal publico para menu mobile.
* `menuAberto`: estado local do dropdown de usuario no header.

## Funcoes e Metodos

* `ngOnInit`: inicializa usuario, perfil, responsividade e atalhos.
* `ngOnDestroy`: finaliza `destroy$`.
* `carregarPerfil`: busca `/auth/me`.
* `updateMobileState`: adapta sidebar a mobile/desktop.
* `onResize`: HostListener de resize.
* `toggleSidebar`: alterna estados da sidebar.
* `onHeaderAction`: roteia acoes emitidas pelo header.
* `abrirModal`: abre modal preservando foco original.
* `fecharModal`: fecha modal e devolve foco.
* `onFotoAtualizada`: sincroniza foto no layout.
* `onPerfilAtualizado`: sincroniza perfil e display.
* `confirmarERemoverFoto`: usa dialogo global antes de limpar foto.
* `sair`: logout e navegacao para `/login`.
* `atualizarDisplayUser`: calcula nome e iniciais.
* `toggleMobileMenu` e `closeMobileMenu`: controlam menu publico mobile.
* `HeaderComponent.toggleUserMenu`: abre/fecha dropdown admin.
* `HeaderComponent.onEscapeKey`: fecha dropdown com Escape.

## Classes

* `AdminLayout`: container admin com estado de usuario, navegacao, modal e acessibilidade.
* `PublicLayout`: container publico com menu mobile e servico de acessibilidade.
* `HeaderComponent`: componente reutilizavel para header publico/admin.
* `Sidebar`: menu lateral admin filtrado por permissao.

## Interfaces e Tipagens

* `NavItem`: `{ rota, label, icon, aria, role? }`.
* `SidebarState`: `'full' | 'icons' | 'hidden'`.
* `ModalType`: `'none' | 'foto' | 'senha' | 'perfil' | 'hotkeys'`.
* `RotaSidebar`: contrato visual da sidebar.

---

# 5. Servicos e Integracoes

## APIs

* `GET /api/auth/me`: perfil do usuario no layout admin.
* `PATCH /api/auth/me/foto`: remocao/atualizacao de foto via fluxo de modal.
* `PATCH /api/auth/me`: atualizacao de perfil.
* `PATCH /api/auth/me/senha`: troca de senha.

## Banco de Dados

Nao acessa diretamente. O layout reflete usuarios, perfis e roles persistidos no backend.

## Servicos Externos

Nao possui integracao externa direta; usa recursos globais de Sentry, PWA e API por meio de providers.

---

# 6. Seguranca e Qualidade

## Seguranca

* Menu admin e filtrado por papel, reduzindo descoberta de funcionalidades.
* Logout limpa tokens.
* Modais preservam foco e reduzem erro operacional.
* Remocao de foto exige confirmacao.
* Acoes sensiveis sao delegadas a API protegida por JWT.

## Qualidade

* `ChangeDetectionStrategy.OnPush` reduz renderizacoes desnecessarias.
* `takeUntil(this.destroy$)` evita vazamento de subscriptions.
* Dropdown fecha com clique externo e Escape.
* Labels ARIA estao presentes nos itens de navegacao.

## Performance

* Sidebar calcula rotas permitidas por getter simples.
* Layout publico usa signal para estado local.
* Admin usa `markForCheck` apenas apos eventos assíncronos.

---

# 7. Regras de Negocio

* ADMIN ve todas as rotas administrativas.
* SECRETARIA ve alunos, turmas, frequencias, certificados, apoiadores e contatos.
* PROFESSOR ve turmas e frequencias.
* COMUNICACAO ve apoiadores, conteudo e contatos no layout.
* Ajuda nao exige role especifica no menu, mas ainda exige area admin autenticada.
* Em mobile, sidebar nunca fica em estado `full` permanente; alterna entre icones e oculto.

---

# 8. Pontos de Atencao

* O filtro visual de `navItems` nao substitui `roleGuard`; ambos devem permanecer alinhados. A rota de contatos foi ajustada para acompanhar o menu e o backend.
* `window.innerWidth` torna layout dependente de browser; SSR exigiria guarda.
* Divergencia entre roles da rota de apoiadores e roles do menu foi corrigida; manter revisao conjunta ao criar novas rotas.
* `setTimeout` em `fecharModal` e aceitavel para aguardar DOM, mas poderia evoluir para `afterNextRender`.

---

# 9. Relacao com Outros Modulos

* Consome `AuthService`, `HotkeysService`, `AccessibilityService` e `ConfirmDialogService`.
* Fornece shell para todos os dominios admin.
* Header e sidebar sao usados por layouts.
* Modais de perfil atualizam estado que impacta header.

---

# 10. Resumo Tecnico Final

O modulo de layout e navegacao tem criticidade alta para UX, acessibilidade e seguranca percebida. A complexidade e media-alta pelo suporte a responsividade, roles, modais e atalhos. A implementacao segue bons padroes Angular com OnPush, componentes apresentacionais e eventos explicitos. O principal risco e manter roles sincronizadas entre menu, rotas e backend.

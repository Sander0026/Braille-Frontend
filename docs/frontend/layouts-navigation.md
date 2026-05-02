# Módulo: Layouts e Navegação

---

# 1. Visão Geral

## Objetivo

Documentar os dois shells visuais da aplicação — `PublicLayout` e `AdminLayout` —
e todos os componentes estruturais de navegação: header, sidebar, footer e toast.

## Responsabilidade

Os layouts funcionam como **orquestradores visuais**: definem o esqueleto da página,
instanciam componentes estruturais e expõem um `<router-outlet>` onde as páginas
são injetadas pelo Angular Router.

## Fluxo de Funcionamento

```
URL acessada pelo usuário
    ↓
Router seleciona PublicLayout ou AdminLayout (baseado no path)
    ↓
Layout renderiza componentes estruturais (header, sidebar, footer)
    ↓
<router-outlet> injeta o componente da página específica
    ↓
Componentes da página consomem serviços via inject()
```

---

# 2. Arquitetura e Metodologias

## Padrões Identificados

- **Shell Pattern** — dois layouts encapsulam o contexto visual de cada área
- **Smart/Dumb Component** — layouts são "smart" (lógica de auth/menu); páginas são "dumb"
- **Signals** — estado de sidebar (aberta/fechada), perfil do usuário, loading
- **Lazy Loading** — próprios layouts são lazy: `loadComponent()` em `app.routes.ts`

---

# 3. `PublicLayout` — Shell do Site Institucional

**Arquivo:** `src/app/layouts/public-layout/public-layout.ts`

Hospeda o site público acessível sem autenticação.

### Estrutura visual
```
┌─────────────────────────────────┐
│  HeaderComponent (público)      │
├─────────────────────────────────┤
│  <router-outlet>                │  ← Home, Sobre, Contato, Notícias...
│  (página carregada pelo router) │
├─────────────────────────────────┤
│  FooterComponent                │
└─────────────────────────────────┘
```

### Componentes instanciados
- `HeaderComponent` — logo, menu de navegação pública, link para Login
- `FooterComponent` — rodapé institucional com links e contato
- Botão de acessibilidade (VLibras) — integração com widget gov.br

---

# 4. `AdminLayout` — Shell do Painel Administrativo

**Arquivo:** `src/app/layouts/admin-layout/admin-layout.ts`

Shell protegido por `authGuard` + `roleGuard`. Carrega o perfil do usuário autenticado
e filtra o menu lateral de acordo com o role.

### Estrutura visual
```
┌──────────┬──────────────────────────────────┐
│          │  HeaderComponent (admin)          │
│ Sidebar  ├──────────────────────────────────┤
│          │  <router-outlet>                  │
│ (menu    │  (Dashboard, Alunos, Turmas...)   │
│ lateral) │                                   │
│          │                                   │
└──────────┴──────────────────────────────────┘
         ToastComponent (flutuante, global)
         ConfirmDialogComponent (modal global)
```

### Responsabilidades do AdminLayout
1. Chama `AuthService.getMe()` ao inicializar para carregar foto e nome de exibição
2. Filtra itens do menu baseado em `user.role` (RBAC visual)
3. Gerencia estado de collapse da sidebar (signal local)
4. Instancia `HotkeysService` via `inject()` para registrar atalhos globais
5. Escuta `HotkeysService.onHelpRequested$` para abrir modal de ajuda de atalhos

### Itens do menu lateral por role

| Item de Menu | Rota | Roles |
|---|---|---|
| Dashboard | `/admin/dashboard` | Todos |
| Alunos | `/admin/alunos` | ADMIN, SECRETARIA |
| Turmas | `/admin/turmas` | Todos |
| Frequências | `/admin/frequencias` | Todos |
| Apoiadores | `/admin/apoiadores` | ADMIN, SECRETARIA, COMUNICACAO |
| Certificados | `/admin/modelos-certificados` | ADMIN, SECRETARIA |
| Conteúdo do Site | `/admin/conteudo` | ADMIN, COMUNICACAO |
| Fale Conosco | `/admin/contatos` | ADMIN, SECRETARIA, COMUNICACAO |
| Usuários | `/admin/usuarios` | ADMIN |
| Auditoria | `/admin/auditoria` | ADMIN |
| Ajuda | `/admin/ajuda` | Todos |

---

# 5. Componentes Estruturais Globais

## 5.1 `HeaderComponent` (admin)

**Arquivo:** `src/app/core/components/header/`

- Exibe nome e foto de perfil do usuário autenticado
- Botão de logout → `AuthService.logout()` + redirect `/login`
- Botão de editar perfil → abre `PerfilModal`
- Botão de trocar foto → abre `FotoModal`
- Botão de trocar senha → abre `SenhaModal`
- Toggle de sidebar no mobile (emite evento para `AdminLayout`)

## 5.2 `SidebarComponent`

**Arquivo:** `src/app/core/components/sidebar/`

- Renderiza menu lateral filtrando por `user.role`
- Suporte a collapse em desktop (signal de estado)
- Totalmente navegável por teclado (Tab + Enter)
- `aria-current="page"` no item ativo
- `aria-label` descritivo em cada link

## 5.3 `ToastComponent`

**Arquivo:** `src/app/core/components/toast/`

- Consome `ToastService.toasts` (signal computed)
- Renderiza pilha de toasts no canto inferior direito
- Cada toast tem `role="alert"` para leitores de tela
- Auto-remove após duração configurada no serviço
- Cores semânticas: verde (sucesso), vermelho (erro), amarelo (aviso), azul (info)

## 5.4 `ConfirmDialogComponent`

**Arquivo:** `src/app/core/components/confirm-dialog/`

- Modal global de confirmação com `cdkTrapFocus` (não vaza foco)
- Consome `ConfirmDialogService` (signal-based)
- Botões "Confirmar" e "Cancelar" com callbacks tipados
- Fecha com Esc e clique no backdrop

## 5.5 `FooterComponent`

**Arquivo:** `src/app/core/components/footer/`

- Rodapé do site público
- Links para Home, Sobre, Contato
- Dados de contato e endereço do ILBES

---

# 6. Segurança e Acessibilidade

## Segurança

- `AdminLayout` só é renderizado após `authGuard` liberar a rota — sem flash de conteúdo admin
- Itens de menu não renderizados para roles sem permissão → RBAC visual + guard de rota

## Acessibilidade

- Sidebar com `aria-label="Menu de navegação"` e `nav` semântico
- `aria-current="page"` no link ativo
- Header com `role="banner"` e main com `role="main"`
- Toast com `role="alert"` + `LiveAnnouncer` integrado via `ToastService`
- ConfirmDialog com `cdkTrapFocus` — foco não escapa do modal

---

# 7. Pontos de Atenção

- `getMe()` é chamado toda vez que `AdminLayout` inicializa — ao navegar entre páginas admin,
  o layout não é destruído (Angular mantém o shell vivo), então `getMe()` só é chamado uma vez por sessão.
- A sidebar filtra visualmente por role, mas a proteção real está nos guards de rota —
  nunca depender apenas do menu para segurança.

---

# 8. Relação com Outros Módulos

| Módulo | Relação |
|---|---|
| `AuthService` | AdminLayout consome `getUser()` e `getMe()` |
| `HotkeysService` | Instanciado e escutado pelo AdminLayout |
| `ToastService` | ToastComponent renderiza os signals do serviço |
| `ConfirmDialogService` | ConfirmDialogComponent renderiza o diálogo global |
| `app.routes.ts` | Define qual layout é usado por cada grupo de rotas |

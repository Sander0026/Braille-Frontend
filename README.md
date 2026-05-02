# Braille-Frontend

**Sistema Administrativo Integrado — Instituto Luiz Braille do Espírito Santo (ILBES)**

SPA Angular 21 que serve dois ambientes: o **site público institucional** e o **painel administrativo** para gestão de alunos, turmas, frequências, certificados e comunicados.

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | Angular 21 (Standalone Components) |
| Estilos | TailwindCSS 3 + SCSS |
| Estado | Angular Signals + RxJS |
| HTTP | HttpClient + 3 Interceptors |
| Editor Rich Text | ngx-quill |
| Visualizador PDF | pdfjs-dist |
| Sanitização HTML | DOMPurify |
| Acessibilidade (dev) | axe-core + Angular CDK LiveAnnouncer |
| Testes E2E | Cypress 15 (4 roles) |
| Testes Unitários | Vitest 4 |
| Linting | ESLint 9 + angular-eslint |
| PWA | @angular/service-worker |
| Deploy | Vercel |

---

## Setup Local em 5 Passos

**Pré-requisitos:** Node.js 22+, npm 11+, Angular CLI 21

```bash
# 1. Clone o repositório
git clone <url-do-repositorio>
cd Braille-Frontend

# 2. Instale as dependências
npm install

# 3. Configure o ambiente
# (o proxy.conf.json já redireciona /api → localhost:3000 automaticamente)
# Nenhuma variável de ambiente é necessária para desenvolvimento local

# 4. Suba o servidor de desenvolvimento
npm start
# Acesse: http://localhost:4200

# 5. (Opcional) Aponte para a API em produção
# Edite src/environments/environment.ts se quiser usar a API do Render em vez do local
```

> **Pré-requisito:** o backend ([Braille-Api](../Braille-Api)) deve estar rodando em `localhost:3000` para o proxy funcionar.

---

## Scripts Disponíveis

| Script | Comando | Descrição |
|---|---|---|
| Desenvolvimento | `npm start` | Serve em `localhost:4200` com proxy para API |
| Build produção | `npm run build` | Gera bundle otimizado em `dist/` |
| Testes unitários | `npm test` | Roda Vitest em modo watch |
| Lint | `npm run lint` | ESLint + angular-eslint |
| Cypress (interface) | `npm run teste_automatizado:gui` | Abre o Cypress visualmente |
| Cypress (admin) | `npm run teste_automatizado:adm` | E2E headless com role ADMIN |
| Cypress (secretaria) | `npm run teste_automatizado:secretaria` | E2E com role SECRETARIA |
| Cypress (professor) | `npm run teste_automatizado:professor` | E2E com role PROFESSOR |
| Cypress (comunicação) | `npm run teste_automatizado:comunicacao` | E2E com role COMUNICACAO |

---

## Arquitetura de Pastas

```
src/
├── main.ts                  # Bootstrap, axe-core (dev)
├── environments/            # environment.ts (dev) + environment.prod.ts
├── app/
│   ├── app.config.ts        # Providers globais: HTTP, Router, PWA, Locale, Quill
│   ├── app.routes.ts        # Rotas lazy-loaded (público + admin)
│   ├── core/
│   │   ├── services/        # 19 serviços HTTP de domínio
│   │   ├── interceptors/    # api + auth + error (3 interceptors)
│   │   ├── guards/          # authGuard + roleGuard + descarteGuard
│   │   ├── pipes/           # safe-html, safe-url, cloudinary
│   │   ├── interfaces/      # Interfaces de domínio (certificados, descarte)
│   │   └── components/      # Header, Footer, Sidebar, Toast, ConfirmDialog
│   ├── layouts/
│   │   ├── admin-layout/    # Shell protegido (JWT + RBAC)
│   │   └── public-layout/   # Shell público (sem autenticação)
│   ├── features/
│   │   ├── beneficiaries/   # Listagem e formulário de alunos
│   │   └── dashboard/       # Dashboard administrativo
│   ├── pages/
│   │   ├── admin/           # Páginas do painel: turmas, frequências, usuários...
│   │   ├── public/          # Home, Sobre, Contato, Notícias, Login...
│   │   └── modelos-certificados/
│   └── shared/
│       ├── components/      # ui-button, ui-card, ui-input, ui-modal, pdf-viewer
│       ├── directives/      # phone-mask, tab-escape, animate-on-scroll
│       ├── pipes/           # (pipes compartilhados)
│       ├── utils/           # audit-diff, html-sanitizer, masks, safe-resource-url
│       ├── validators/      # password validator
│       └── providers/       # tab-escape provider
└── styles/                  # Estilos globais SCSS + TailwindCSS
```

---

## Perfis de Acesso (Roles)

| Role | Área de acesso |
|---|---|
| `ADMIN` | Acesso total — único que vê auditoria e usuários |
| `SECRETARIA` | Alunos, turmas, frequências, atestados |
| `PROFESSOR` | Apenas lançamento de chamada nas suas turmas |
| `COMUNICACAO` | Comunicados, apoiadores, conteúdo do site |

---

## URLs de Produção

| Ambiente | URL |
|---|---|
| Site público | `instituto-luizbraille.vercel.app` |
| Painel administrativo | `instituto-luizbraille.vercel.app/login` |
| API (backend) | `https://braille-api-oieq.onrender.com/api` |

---

## Documentação Técnica

A documentação completa está em [`docs/frontend/`](docs/frontend/INDEX.md).

| Documento | Descrição |
|---|---|
| [Índice](docs/frontend/INDEX.md) | Visão geral e mapa de navegação |
| [Setup](docs/frontend/00-setup.md) | Ambiente local detalhado |
| [Bootstrap e Rotas](docs/frontend/app-bootstrap-rotas.md) | Inicialização e roteamento |
| [Auth e Guards](docs/frontend/auth-session-guards.md) | JWT, refresh token, RBAC |
| [Serviços HTTP](docs/frontend/core-http-services.md) | Todos os serviços e endpoints |
| [Layouts](docs/frontend/layouts-navigation.md) | Shells público e admin |
| [Componentes Shared](docs/frontend/shared-ui-a11y-utils.md) | UI, directives, pipes, utils |
| [Testes](docs/frontend/09-testes.md) | Cypress e Vitest |
| [PWA e Deploy](docs/frontend/10-pwa-deploy.md) | Build, Vercel e CSP |
| [Acessibilidade](docs/frontend/11-acessibilidade.md) | WCAG, axe-core, LiveAnnouncer |
| [Decisões Técnicas](docs/frontend/12-decisoes-tecnicas.md) | ADRs |

---

## Contribuição

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para padrões de código, fluxo de branches e checklist de PR.
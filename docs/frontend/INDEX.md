# Documentação Técnica Frontend — Braille-Frontend

**Sistema Administrativo Integrado — Instituto Luiz Braille do Espírito Santo (ILBES)**

> Gerada por engenharia reversa completa do código-fonte — Angular 21 Standalone.
> Última atualização: 2026-05-02 | Versão: 2.0

---

## Como Navegar por Esta Documentação

**Sou novo no projeto → Comece por:**
1. [README.md](../../README.md) — visão geral e setup em 5 passos
2. [00-setup.md](./00-setup.md) — ambiente local detalhado
3. [CONTRIBUTING.md](../../CONTRIBUTING.md) — como contribuir
4. [01-app-bootstrap-rotas.md](./01-app-bootstrap-rotas.md) — como a aplicação funciona

**Preciso entender autenticação →** [02-auth-session-guards.md](./02-auth-session-guards.md)

**Preciso chamar a API →** [03-core-http-services.md](./03-core-http-services.md)

**Preciso criar um componente acessível →** [15-acessibilidade.md](./15-acessibilidade.md) + [05-shared-ui-a11y-utils.md](./05-shared-ui-a11y-utils.md)

**Quero entender por que X foi feito assim →** [16-decisoes-tecnicas.md](./16-decisoes-tecnicas.md)

---

## Índice de Documentos

| # | Documento | Cobertura |
|---|---|---|
| 00 | [Setup e Onboarding](./00-setup.md) | Pré-requisitos, instalação, ambiente, scripts, troubleshooting |
| 01 | [Bootstrap, Config e Rotas](./01-app-bootstrap-rotas.md) | `main.ts`, `app.config.ts`, `app.routes.ts`, tabela completa de rotas |
| 02 | [Autenticação, Sessão e Guards](./02-auth-session-guards.md) | JWT, refresh token concorrente, RBAC, `authGuard`, `roleGuard`, `descarteGuard` |
| 03 | [Serviços HTTP e APIs](./03-core-http-services.md) | 19 serviços, todos os endpoints, cache TTL, interfaces TypeScript |
| 04 | [Layouts e Navegação](./04-layouts-navigation.md) | `PublicLayout`, `AdminLayout`, sidebar, header, toast, menu por role |
| 05 | [Componentes Shared, Pipes e Utilitários](./05-shared-ui-a11y-utils.md) | UI atoms, `SafeHtmlPipe`, `CloudinaryPipe`, masks, validators, directives |
| 06 | [Dashboard](./06-dashboard.md) | KPIs, cache, acessibilidade |
| 07 | [Beneficiários e Alunos](./07-beneficiaries.md) | CRUD completo, wizard, reativação, LGPD, importação, exportação |
| 08 | [Turmas e Frequências](./08-turmas-frequencias.md) | Máquina de estados de turma, diário de chamada, atestados |
| 09 | [Usuários e Perfil](./09-usuarios-perfil.md) | Gestão de funcionários, wizard de cadastro, perfil próprio |
| 10 | [Conteúdo Público e Fale Conosco](./10-conteudo-publico-contatos.md) | CMS (Quill), comunicados, formulário de contato |
| 11 | [Apoiadores e Certificados](./11-apoiadores-certificados.md) | Parceiros, modelos PDF, emissão, validação pública |
| 12 | [Auditoria, Ajuda e Qualidade](./12-audit-ajuda-quality.md) | Log de auditoria, diff com mascaramento, central de ajuda, hotkeys |
| 13 | [Testes](./13-testes.md) | Vitest (unitários), Cypress E2E, cypress-axe, CI/CD |
| 14 | [PWA e Deploy](./14-pwa-deploy.md) | Build, service worker, Vercel, análise linha a linha do CSP |
| 15 | [Acessibilidade (WCAG)](./15-acessibilidade.md) | axe-core, LiveAnnouncer, WCAG 2.1 AA, VLibras, checklist |
| 16 | [Decisões Técnicas (ADRs)](./16-decisoes-tecnicas.md) | 11 ADRs: Angular standalone, JWT, interceptors, Sentry, branches |
| 17 | [Atendimentos Individuais](./17-atendimentos-individuais.md) | Acompanhamentos independentes de turmas, tela admin e perfil do aluno |
| 18 | [Atendimento Individual — Técnico](./17-atendimento-individual.md) | Acompanhamentos, atendimentos, timeline, modais, relatórios, descarte e arquivamento |

---

## Mapa Arquitetural

```
src/
├── main.ts                   ← Bootstrap + axe-core (dev only, dynamic import)
├── environments/
│   ├── environment.ts        ← DEV: apiUrl = '/api' (proxy local)
│   └── environment.prod.ts   ← PROD: apiUrl = 'https://braille-api-oieq.onrender.com/api'
├── app/
│   ├── app.config.ts         ← Providers globais: HTTP + interceptors + PWA + Quill + locale
│   ├── app.routes.ts         ← Rotas lazy-loaded (público + admin protegido)
│   ├── core/
│   │   ├── services/         ← 19 serviços HTTP (AuthService, BeneficiariosService, ...)
│   │   ├── interceptors/     ← apiInterceptor → authInterceptor → errorInterceptor
│   │   ├── guards/           ← authGuard + roleGuard + descarteGuard
│   │   ├── pipes/            ← SafeHtmlPipe, SafeUrlPipe, CloudinaryPipe
│   │   └── components/       ← Header, Sidebar, Footer, Toast, ConfirmDialog
│   ├── layouts/
│   │   ├── public-layout/    ← Site público (sem auth)
│   │   └── admin-layout/     ← Painel protegido (authGuard + roleGuard)
│   ├── features/
│   │   ├── dashboard/        ← Dashboard administrativo
│   │   └── beneficiaries/    ← Listagem e formulário de alunos
│   ├── pages/
│   │   ├── admin/            ← Todas as páginas do painel
│   │   └── public/           ← Home, Sobre, Contato, Notícias, Login...
│   └── shared/
│       ├── components/       ← UiButton, UiCard, UiInput, UiModal, PdfViewer
│       ├── directives/       ← TabEscape, PhoneMask, AnimateOnScroll
│       ├── validators/       ← senhaForteValidator (OWASP)
│       ├── utils/            ← masks, audit-diff, html-sanitizer
│       └── providers/        ← provideTabEscapeForTextareas()
├── styles/                   ← TailwindCSS + SCSS globais
└── environments/             ← Configuração por ambiente
```

---

## Fluxo HTTP Completo

```
Componente → Serviço.listar()
    ↓
HttpClient.get('/api/beneficiaries')
    ↓
[1] apiInterceptor     → resolve /api/* para URL absoluta do Render
[2] authInterceptor    → injeta Bearer token | intercepta 401 → refresh
[3] errorInterceptor   → toast para status 0, 403, 5xx
    ↓
API NestJS (Render)
    ↓
Resposta tipada → Observable<T> → componente atualiza view
```

---

## Fluxo de Autenticação

```
Login → JWT salvo em localStorage
    ↓
authGuard verifica exp + precisaTrocarSenha
    ↓
roleGuard verifica route.data.roles vs user.role
    ↓
authInterceptor injeta token em cada request
    ↓
401 recebido → refresh automático (1 chamada para N requests)
    ↓
Token renovado → requests em fila são reexecutadas
```

---

## Stack Completa

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Angular Standalone | 21 |
| Estilos | TailwindCSS + SCSS | 3 |
| Estado | Angular Signals + RxJS | — |
| Editor Rich Text | ngx-quill | — |
| PDF | pdfjs-dist | — |
| Sanitização | DOMPurify | — |
| A11y (dev) | axe-core | — |
| A11y (E2E) | cypress-axe | — |
| A11y (runtime) | Angular CDK LiveAnnouncer | — |
| PWA | @angular/service-worker | — |
| Deploy | Vercel | — |
| Testes E2E | Cypress | 15 |
| Testes Unitários | Vitest | 4 |
| Linting | ESLint 9 + angular-eslint | — |

---

## URLs de Produção

| Serviço | URL |
|---|---|
| Site público | `instituto-luizbraille.vercel.app` |
| Painel admin | `instituto-luizbraille.vercel.app/login` |
| API (backend) | `https://braille-api-oieq.onrender.com/api` |
| Swagger (API docs) | `https://braille-api-oieq.onrender.com/api/docs` |

---

## Perfis de Acesso

| Role | O que acessa |
|---|---|
| `ADMIN` | Tudo — único com acesso a Usuários e Auditoria |
| `SECRETARIA` | Alunos, Turmas, Frequências, Certificados, Contatos |
| `PROFESSOR` | Dashboard + lançamento de chamada (apenas suas turmas) |
| `COMUNICACAO` | Dashboard, Comunicados, Apoiadores, Conteúdo do Site |

---

## Pontos de Atenção Globais

| Ponto | Detalhe |
|---|---|
| **`provideAnimations()` deprecated** | Mantido por dependência do `ngx-quill` — remover no Angular 23 |
| **JWT em localStorage** | Risco residual de XSS — mitigado por CSP + DOMPurify |
| **Render cold start** | Backend pode demorar 30-60s para responder no primeiro acesso diário |
| **Service Worker** | Desabilitado em desenvolvimento; ativar apenas via build de produção |
| **ngx-quill** | Requer `provideAnimations()` legado — bloqueia migração para animações modernas |
| **ViaCEP** | Serviço externo para preenchimento de endereço — sem SLA garantido |
| **Formulário de Contato** | Sem CAPTCHA — vulnerável a spam (melhoria recomendada) |

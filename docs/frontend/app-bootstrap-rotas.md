# Módulo: Aplicação, Bootstrap e Roteamento

---

# 1. Visão Geral

## Objetivo

Documentar o ciclo de inicialização da SPA Angular — desde o ponto de entrada `main.ts`
até o registro de providers globais em `app.config.ts` e a definição das rotas lazy-loaded em `app.routes.ts`.

## Responsabilidade

Estes três arquivos formam o **núcleo de composição** da aplicação. Toda feature,
serviço e componente existe dentro do contexto que eles constroem.

## Fluxo de Funcionamento

```
index.html → main.ts → bootstrapApplication(App, appConfig)
                              ↓
                        app.config.ts  (providers globais)
                              ↓
                        app.routes.ts  (mapa de rotas lazy)
                              ↓
               PublicLayout  ou  AdminLayout  (shell escolhido pela URL)
                              ↓
                     Página carregada via loadComponent()
```

---

# 2. Arquitetura e Metodologias

## Padrões Arquiteturais Identificados

- **Standalone Components** — sem NgModules; cada componente é auto-suficiente
- **Lazy Loading** — `loadComponent()` em todas as rotas; bundle inicial mínimo
- **Functional Guards** — guards como funções puras (`CanActivateFn`) em vez de classes
- **Provider Pattern** — `app.config.ts` centraliza toda a DI da aplicação
- **Shell Pattern** — dois layouts (shells) encapsulam áreas pública e administrativa

## Justificativa Técnica

A arquitetura standalone (introduzida no Angular 14, estabilizada no 17) elimina
a necessidade de `AppModule` e `NgModule` — reduzindo boilerplate e tornando
tree-shaking mais eficiente. Cada componente declara suas dependências diretamente
no `imports[]`, facilitando a leitura isolada do código.

O lazy loading via `loadComponent()` garante que o bundle inicial carregue apenas
o necessário para renderizar a primeira tela, melhorando o LCP (Largest Contentful Paint).

---

# 3. Fluxo Interno do Código

## 3.1 `src/main.ts` — Ponto de Entrada

```typescript
bootstrapApplication(App, appConfig)
  .then(() => {
    if (isDevMode()) {
      // Carrega axe-core dinamicamente (import lazy) — zero impacto em produção
      import('axe-core').then((axe) => {
        // Auditoria automática 2s após boot
        setTimeout(rodarAuditoria, 2000);
        // Expõe auditarAcessibilidade() no console do DevTools
        Object.defineProperty(globalThis, 'auditarAcessibilidade', { ... });
      });
    }
  });
```

**Responsabilidades do `main.ts`:**
1. Bootstraps a aplicação com `App` (componente raiz) e `appConfig` (providers)
2. Em modo dev, carrega o `axe-core` de forma **lazy** para não impactar produção
3. Executa auditoria de acessibilidade automática 2s após o boot
4. Expõe `auditarAcessibilidade()` globalmente para uso manual no DevTools

## 3.2 `src/app/app.config.ts` — Providers Globais

| Provider | O que faz |
|---|---|
| `provideBrowserGlobalErrorListeners()` | Captura erros globais não tratados |
| `provideAnimations()` | API legada de animações — mantida pelo `ngx-quill` |
| `provideRouter(routes)` | Registra o roteador com as rotas definidas |
| `provideHttpClient(withFetch(), withInterceptors([...]))` | HTTP com Fetch API + 3 interceptors em cadeia |
| `{ provide: LOCALE_ID, useValue: 'pt-BR' }` | Pipes de data/moeda/número em PT-BR |
| `importProvidersFrom(QuillModule.forRoot())` | Editor rich text global |
| `...provideTabEscapeForTextareas()` | Diretiva de acessibilidade em textareas |
| `provideServiceWorker(...)` | PWA — ativo apenas em produção |

**Ordem dos interceptors importa:**
```typescript
withInterceptors([apiInterceptor, authInterceptor, errorInterceptor])
// 1. apiInterceptor  → resolve URL relativa /api/* para URL absoluta
// 2. authInterceptor → injeta Bearer token + trata 401/refresh
// 3. errorInterceptor → exibe toast para erros 0, 403, 5xx
```

## 3.3 `src/app/app.routes.ts` — Mapa de Rotas

### Área Pública (`PublicLayout`)

| Rota | Componente | Título |
|---|---|---|
| `/` | `Home` | Início — Instituto Luiz Braille |
| `/sobre` | `Sobre` | Sobre Nós — Instituto Luiz Braille |
| `/contato` | `Contato` | Fale Conosco — Instituto Luiz Braille |
| `/noticias` | `NoticiasLista` | Notícias e Comunicados — ILBES |
| `/noticias/:id` | `NoticiaDetalhe` | Notícia — Instituto Luiz Braille |
| `/validar-certificado` | `ValidarCertificado` | Validação de Certificado — ILBES |
| `/login` | `Login` | Entrar — ILBES |
| `/**` | `NotFound` | Página Não Encontrada — ILBES |

### Área Administrativa (`AdminLayout`) — protegida por `[authGuard, roleGuard]`

| Rota | Componente | Roles permitidos | Guard extra |
|---|---|---|---|
| `/admin/dashboard` | `Dashboard` | Todos autenticados | — |
| `/admin/alunos` | `BeneficiaryList` | ADMIN, SECRETARIA | `descarteGuard` |
| `/admin/alunos/cadastro` | `BeneficiaryFormComponent` | ADMIN, SECRETARIA | `descarteGuard` |
| `/admin/turmas` | `TurmasLista` | Todos autenticados | `descarteGuard` |
| `/admin/frequencias` | `FrequenciasLista` | Todos autenticados | — |
| `/admin/apoiadores` | `ApoiadoresLista` | ADMIN, SECRETARIA, COMUNICACAO | `descarteGuard` |
| `/admin/modelos-certificados` | `ModelosLista` | ADMIN, SECRETARIA | — |
| `/admin/modelos-certificados/novo` | `ModelosForm` | ADMIN, SECRETARIA | `descarteGuard` |
| `/admin/modelos-certificados/editar/:id` | `ModelosForm` | ADMIN, SECRETARIA | `descarteGuard` |
| `/admin/conteudo` | `ConteudoSite` | ADMIN, COMUNICACAO | — |
| `/admin/contatos` | `ContatosLista` | ADMIN, SECRETARIA, COMUNICACAO | — |
| `/admin/usuarios` | `UsuariosLista` | ADMIN | — |
| `/admin/usuarios/cadastro` | `CadastroUsuarioWizard` | ADMIN | `descarteGuard` |
| `/admin/ajuda` | `Ajuda` | Todos autenticados | — |
| `/admin/auditoria` | `AuditLogLista` | ADMIN | — |

---

# 4. Dicionário Técnico

## Variáveis e Constantes

| Nome | Tipo | Onde | Descrição |
|---|---|---|---|
| `routes` | `Routes` | `app.routes.ts` | Array de definições de rota exportado para o router |
| `appConfig` | `ApplicationConfig` | `app.config.ts` | Objeto de configuração com todos os providers |

## Funções

| Função | Arquivo | Descrição |
|---|---|---|
| `bootstrapApplication()` | `main.ts` | Inicializa a SPA com o componente raiz e os providers |
| `rodarAuditoria()` | `main.ts` | Executa axe-core e imprime violações de acessibilidade no console |
| `logViolationNode()` | `main.ts` | Formata e exibe cada nó de violação de acessibilidade |
| `provideTabEscapeForTextareas()` | `tab-escape.provider.ts` | Retorna providers que aplicam `TabEscapeDirective` globalmente |

## Interfaces

| Interface | Arquivo | Campos |
|---|---|---|
| `Environment` | `environment.interface.ts` | `production: boolean`, `apiUrl: string` |
| `AxeNodeResult` | `main.ts` (local) | `target: Array<string \| string[]>`, `failureSummary?: string` |

---

# 5. Serviços e Integrações

## Dependências do Bootstrap

- `@angular/platform-browser` → `bootstrapApplication`
- `@angular/core` → `isDevMode`
- `axe-core` → auditoria de acessibilidade (carregado via dynamic import, apenas dev)
- `./app/app.config` → providers da aplicação
- `./app/app` → componente raiz

---

# 6. Segurança e Qualidade

## Segurança

- **axe-core isolado em dev:** o import dinâmico garante que a biblioteca nunca vai para o bundle de produção
- **`globalThis.auditarAcessibilidade` com `configurable: true`:** permite sobrescrever em testes sem lançar erros
- **Títulos de rota:** todas as rotas têm `title` definido — beneficia SEO e leitores de tela

## Performance

- **Lazy loading em todas as rotas:** bundle inicial mínimo; o Angular só carrega o chunk da página acessada
- **`withFetch()`:** usa a Fetch API nativa em vez de `XMLHttpRequest`, melhorando performance no servidor
- **`provideServiceWorker` só em produção:** evita o overhead do SW em desenvolvimento

## Débito Técnico

- **`provideAnimations()` está deprecated** desde Angular 19. Mantido como dependência bloqueante do `ngx-quill`.
  Remoção prevista quando `ngx-quill` migrar para a nova API de animações CSS (estimativa: Angular 23).

---

# 7. Regras de Negócio

- **Toda rota administrativa exige `authGuard` + `roleGuard`** — aplicados no nível do `AdminLayout`
- **`descarteGuard`** protege formulários com dados não salvos — deve ser aplicado em toda rota de formulário
- **`roleGuard` usa `route.data.roles`** — se a propriedade não for definida, todos os autenticados têm acesso
- **`/admin` redireciona para `/admin/dashboard`** via `{ path: '', redirectTo: 'dashboard', pathMatch: 'full' }`
- **`/**` (wildcard)** sempre redireciona para `NotFound` — nunca deve quebrar com tela em branco

---

# 8. Pontos de Atenção

- Ao adicionar nova rota admin, sempre definir `data: { roles: [...] }` — sem isso, todos os autenticados acessam
- Ao adicionar formulário com estado, sempre aplicar `canDeactivate: [descarteGuard]`
- O `title` de cada rota é obrigatório para SEO e acessibilidade — nunca omitir
- `app.routes.ts` centraliza tudo — evitar criar roteadores filho espalhados pelo projeto

---

# 9. Relação com Outros Módulos

| Módulo | Relação |
|---|---|
| `auth.guard.ts` | Protege todas as rotas admin verificando token JWT |
| `role.guard.ts` | Verifica `route.data.roles` contra o role do usuário |
| `descarte.guard.ts` | Chama `podeDescartar()` nos componentes de formulário |
| `api.interceptor.ts` | Resolve URLs relativas `/api/*` |
| `auth.interceptor.ts` | Injeta JWT e trata 401 |
| `error.interceptor.ts` | Feedback visual para erros HTTP |
| `AdminLayout` | Shell que hospeda todas as páginas admin |
| `PublicLayout` | Shell que hospeda o site público |

---

# 10. Resumo Técnico Final

| Item | Detalhe |
|---|---|
| **Função** | Inicialização, composição de providers e roteamento da SPA |
| **Criticidade** | 🔴 Crítica — qualquer erro aqui impede o boot da aplicação |
| **Complexidade** | Média — alto impacto, código enxuto |
| **Principais integrações** | axe-core (dev), Angular Router, HttpClient, Service Worker |
| **Risco principal** | Alterar a ordem dos interceptors ou remover um provider pode quebrar toda a aplicação silenciosamente |

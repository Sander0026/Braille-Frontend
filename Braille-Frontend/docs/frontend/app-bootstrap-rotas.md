# Modulo: Aplicacao, Bootstrap e Roteamento

---

# 1. Visao Geral

## Objetivo

Documentar a inicializacao da SPA Angular, os providers globais, a estrategia de roteamento, a configuracao de ambiente, o PWA, a pagina HTML raiz e a politica de carregamento das telas.

## Responsabilidade

Este modulo define a espinha dorsal do frontend: entrada em `src/main.ts`, raiz visual em `src/app/app.ts`, configuracao de providers em `src/app/app.config.ts`, rotas em `src/app/app.routes.ts`, ambientes em `src/environments`, PWA em `ngsw-config.json` e metadados globais em `src/index.html`.

## Fluxo de Funcionamento

O navegador carrega `index.html`, instancia `<app-root>`, executa `main.ts`, configura Sentry quando existe DSN, habilita auditoria axe-core em desenvolvimento e chama `bootstrapApplication(App, appConfig)`. O `App` carrega configuracoes do site, secoes dinamicas, monitora novas versoes do service worker e move foco para o primeiro `h1` apos mudancas de rota.

---

# 2. Arquitetura e Metodologias

## Padroes Arquiteturais Identificados

* SPA Angular standalone.
* Lazy loading por rota com `loadComponent`.
* Shell layout pattern para area publica e area administrativa.
* Provider composition em `ApplicationConfig`.
* Interceptor chain para cross-cutting concerns HTTP.
* PWA com service worker e cache groups.
* Observability pattern com Sentry.
* Progressive enhancement de acessibilidade com axe-core em desenvolvimento e VLibras em `index.html`.

## Justificativa Tecnica

A escolha por Angular standalone reduz acoplamento com NgModules e melhora tree-shaking. O lazy loading evita carregar telas administrativas e publicas antes do uso, reduzindo bundle inicial. A separacao entre layouts publico e administrativo isola responsabilidades de navegacao, sessao e menus. O `app.config.ts` concentra providers globais para manter bootstrap previsivel e testavel.

---

# 3. Fluxo Interno do Codigo

## Fluxo de Execucao

1. `src/index.html` define `lang="pt-BR"`, viewport, tema, manifest, fontes e widget VLibras.
2. `src/main.ts` inicializa Sentry somente se `environment.sentryDsn` estiver preenchido.
3. Em desenvolvimento, `main.ts` importa `axe-core` dinamicamente, roda auditoria apos renderizacao e expoe `globalThis.auditarAcessibilidade`.
4. `bootstrapApplication` monta `App` com `appConfig`.
5. `app.config.ts` registra roteador, HTTP com `withFetch`, interceptadores, locale `pt-BR`, Quill, service worker, listener global de Tab em textarea/contenteditable e Sentry `ErrorHandler`.
6. `App` chama `SiteConfigService.carregarConfigs()` e `carregarSecoes()` para hidratar tema/conteudo global.
7. `App` observa `SwUpdate.versionUpdates`; quando `VERSION_READY`, recarrega a pagina para evitar deadlock entre assets antigos e novo `index.html`.
8. `App` observa `NavigationEnd`; apos render, procura `h1`, aplica `tabindex="-1"` e move foco para acessibilidade.
9. `app.routes.ts` decide entre `PublicLayout`, `AdminLayout`, `Login` e `NotFound`.

## Dependencias Internas

* `App`
* `routes`
* `apiInterceptor`
* `authInterceptor`
* `errorInterceptor`
* `SiteConfigService`
* `provideTabEscapeForTextareas`
* `environment`
* layouts publico e administrativo
* guards `authGuard`, `roleGuard`, `descarteGuard`

## Dependencias Externas

* `@angular/core`
* `@angular/router`
* `@angular/common`
* `@angular/common/http`
* `@angular/service-worker`
* `@angular/animations`
* `@angular/cdk/a11y`
* `@sentry/angular`
* `ngx-quill`
* `rxjs`
* `axe-core` em desenvolvimento
* VLibras via script externo em `https://vlibras.gov.br/app/vlibras-plugin.js`

---

# 4. Dicionario Tecnico

## Variaveis

* `environment.production`: booleano que diferencia desenvolvimento e producao; controla otimizacoes, service worker e endpoint real.
* `environment.apiUrl`: base de API; em dev e `/api` para proxy, em prod e `https://braille-api-oieq.onrender.com/api`.
* `environment.sentryDsn`: DSN opcional; vazio desativa Sentry.
* `environment.sentryEnv`: nome logico do ambiente Sentry.
* `title`: signal em `App` com valor `Instituto Luiz Braille`.
* `swUpdate`: injecao opcional de `SwUpdate`; permite app funcionar mesmo sem service worker habilitado.
* `routes`: array de rotas principal; define lazy loading, guards, roles e titulos.

## Funcoes e Metodos

* `bootstrapApplication(App, appConfig)`: inicializa aplicacao standalone.
* `Sentry.init`: registra tracing e replay quando existe DSN.
* `rodarAuditoria`: executa `axe.run(document, { runOnly: ['wcag2a','wcag2aa'] })` em desenvolvimento.
* `carregarConfigs`: busca configuracoes globais e aplica cor primaria.
* `carregarSecoes`: busca conteudo dinamico por secao.
* `provideServiceWorker`: registra `ngsw-worker.js` quando `!isDevMode()`.

## Classes

* `App`: componente raiz standalone; coordena bootstrap funcional, PWA update e foco pos-navegacao.

## Interfaces e Tipagens

* `Environment`: contrato de ambiente com `production`, `apiUrl`, `sentryDsn` e `sentryEnv`.
* `Routes`: contrato Angular para arvore de navegacao.

---

# 5. Servicos e Integracoes

## APIs

O modulo nao chama endpoints diretamente exceto via `SiteConfigService`:

* `GET /site-config`: configuracoes gerais.
* `GET /site-config/secoes`: conteudo publico dinamico.

## Banco de Dados

Nao ha acesso direto. O frontend consome dados por API REST.

## Servicos Externos

* Sentry: captura de erros e tracing quando configurado.
* VLibras: widget de traducao/acessibilidade em Libras.
* Google Fonts: fontes `Inter`, `Pinyon Script` e `Cormorant Garamond`.
* Angular Service Worker: cache de app shell e assets.

---

# 6. Seguranca e Qualidade

## Seguranca

* Rotas administrativas exigem `authGuard` e `roleGuard`.
* Interceptadores centralizam base URL, JWT e erros.
* O service worker e registrado apenas em build nao dev.
* A auditoria axe-core e carregada dinamicamente apenas em desenvolvimento.
* O script VLibras e inicializado em bloco `try/catch` para nao quebrar bootstrap.

## Qualidade

* `angular.json` define budgets de bundle: initial warning 1MB, error 2MB; estilos por componente warning 50kB, error 100kB.
* Test runner configurado como Vitest.
* ESLint configurado para TS/HTML.
* Cypress cobre fluxos E2E e acessibilidade.

## Performance

* Lazy loading por componente reduz carregamento inicial.
* `provideHttpClient(withFetch())` usa backend fetch moderno.
* Service worker usa `installMode: prefetch` para app shell e `lazy` para assets.
* `afterNextRender` substitui `setTimeout` fragil em foco pos-render.

---

# 7. Regras de Negocio

* Area publica e acessivel sem autenticacao.
* Area administrativa exige usuario autenticado e papel autorizado por rota.
* `Login` fica fora do `PublicLayout` e do `AdminLayout`, evitando herdar navegacao indevida.
* `NotFound` recebe wildcard `**`.
* Quando uma nova versao PWA esta pronta, a pagina recarrega automaticamente para garantir consistencia entre index, CSP e assets.

---

# 8. Pontos de Atencao

* Rota `/admin/apoiadores` foi alinhada para `ADMIN`, `SECRETARIA` e `COMUNICACAO`, acompanhando menu e backend.
* `provideAnimations()` esta marcado como legado/depreciado em comentario por dependencia do `ngx-quill`.
* `environment.prod.ts` mantem `sentryDsn` vazio; observabilidade de producao nao coleta eventos ate configuracao real.
* Manipulacoes de `document`/`window` em `App` e `SiteConfigService` possuem guarda para reduzir risco caso SSR seja ativado.

---

# 9. Relacao com Outros Modulos

* `App` depende de `SiteConfigService`.
* `app.routes.ts` depende de layouts, paginas e guards.
* `app.config.ts` injeta todos os interceptadores usados pelos servicos HTTP.
* `index.html` influencia acessibilidade global e SEO inicial.
* `ngsw-config.json` afeta deploy, cache, atualizacao e confiabilidade offline.

---

# 10. Resumo Tecnico Final

O modulo de bootstrap e roteamento e critico e de alta centralidade. Ele estabelece a arquitetura Angular standalone, separa areas publica/admin, aplica seguranca por guards, melhora performance com lazy loading e PWA, e adiciona acessibilidade por foco pos-rota, VLibras e axe-core em dev. A complexidade e media-alta pela concentracao de responsabilidades globais, com riscos principais em divergencia de roles, Sentry desativado em producao e futura compatibilidade SSR.

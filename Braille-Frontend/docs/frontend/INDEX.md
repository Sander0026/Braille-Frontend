# Documentacao Tecnica Frontend

---

# 1. Visao Geral

## Objetivo

Este indice centraliza a documentacao tecnica gerada por engenharia reversa do frontend Angular do sistema Instituto Luiz Braille.

## Escopo

A varredura cobre arquitetura SPA, bootstrap, roteamento, layouts, guards, interceptadores, servicos HTTP, estado reativo, componentes compartilhados, dominios administrativos, paginas publicas, PWA, acessibilidade e testes.

## Modulos Documentados

* [Aplicacao, Bootstrap e Roteamento](./app-bootstrap-rotas.md)
* [Autenticacao, Sessao e Autorizacao](./auth-session-guards.md)
* [Servicos HTTP e Integracoes de API](./core-http-services.md)
* [Layout, Navegacao e Shell Visual](./layouts-navigation.md)
* [Acessibilidade, UI Compartilhada e Utilitarios](./shared-ui-a11y-utils.md)
* [Dashboard Administrativo](./dashboard.md)
* [Beneficiarios e Cadastro de Alunos](./beneficiaries.md)
* [Turmas e Frequencias](./turmas-frequencias.md)
* [Usuarios e Perfil Administrativo](./usuarios-perfil.md)
* [Conteudo Publico, Comunicados e Contatos](./conteudo-publico-contatos.md)
* [Apoiadores e Certificados](./apoiadores-certificados.md)
* [Auditoria, Ajuda e Qualidade](./audit-ajuda-quality.md)

---

# 2. Mapa Arquitetural

## Camadas Identificadas

* `src/main.ts`: inicializacao Angular, Sentry, axe-core em desenvolvimento e bootstrap da SPA.
* `src/app/app.config.ts`: providers globais, `HttpClient` com interceptadores, router, locale, Quill, PWA e Sentry `ErrorHandler`.
* `src/app/app.routes.ts`: composicao de rotas publicas e administrativas com lazy loading via `loadComponent`.
* `src/app/core`: servicos de dominio, guards, interceptadores, pipes seguros e componentes estruturais globais.
* `src/app/layouts`: shells publico e administrativo.
* `src/app/features`: dominios funcionais reutilizados por rotas administrativas, como dashboard e beneficiarios.
* `src/app/pages`: paginas publicas e administrativas.
* `src/app/shared`: componentes atomicos, diretivas, pipes, validadores, providers e utilitarios puros.
* `cypress`: testes E2E, acessibilidade e fluxos criticos.

## Dependencias Externas Principais

* Angular 21 para SPA standalone, router, forms, service worker e HTTP.
* Angular CDK para acessibilidade, `LiveAnnouncer` e focus trap.
* RxJS para Observables, cache com `shareReplay`, `BehaviorSubject`, `Subject` e composicao assíncrona.
* Angular Signals para estado local de UI e servicos de dialog/toast.
* `@sentry/angular` para observabilidade de erros quando `sentryDsn` estiver configurado.
* `ngx-quill` e `quill` para conteudo rico no CMS.
* `dompurify` e pipes de sanitizacao para reducao de risco XSS.
* `pdfjs-dist` e visualizadores de PDF para documentos e manuais.
* Cypress, axe-core, Vitest e ESLint para qualidade.

---

# 3. Historico de Varredura

## Entrada Atual

* Tipo de analise: frontend.
* Data local da execucao: 2026-04-29.
* Workspace analisado: `E:\PI-5\Braille-Frontend\Braille-Frontend`.
* Codigo gerado: documentacao Markdown em `docs/frontend`.

## Arquivos-Fonte Base Lidos

* `package.json`
* `angular.json`
* `ngsw-config.json`
* `proxy.conf.json`
* `src/index.html`
* `src/main.ts`
* `src/styles.scss`
* `src/environments/environment.ts`
* `src/environments/environment.prod.ts`
* `src/environments/environment.interface.ts`
* `src/app/app.ts`
* `src/app/app.config.ts`
* `src/app/app.routes.ts`
* `src/app/core/**/*.ts`
* `src/app/layouts/**/*.ts`
* `src/app/features/**/*.ts`
* `src/app/pages/**/*.ts`
* `src/app/shared/**/*.ts`
* `cypress/**/*.ts`

---

# 4. Rastreabilidade Entre Modulos

## Fluxo Publico

`PublicLayout` hospeda `HeaderComponent`, `FooterComponent`, `FloatingCtaComponent` e `RouterOutlet`. As paginas `Home`, `Sobre`, `Contato`, `Noticias`, `ValidarCertificado` e `NotFound` consomem `SiteConfigService`, `ComunicadosService`, `ContatoService`, `ModelosCertificadosService` e recursos visuais de `assets`.

## Fluxo Administrativo

`AdminLayout` e protegido por `authGuard` e `roleGuard`, carrega perfil via `AuthService`, filtra menu por papel, orquestra sidebar, header, modais, dialogo global, toast e atalhos. As paginas administrativas consomem os servicos de dominio em `core/services` e servicos locais, como `ApoiadoresService`.

## Fluxo HTTP

Toda chamada `HttpClient` passa por `apiInterceptor`, `authInterceptor` e `errorInterceptor`. O primeiro resolve base URL, o segundo injeta JWT e renova token em 401, e o terceiro centraliza feedback visual/audivel para falhas 0, 403 e 5xx.

---

# 5. Pontos Globais de Atencao

* `app.routes.ts` foi alinhado para usar `COMUNICACAO` na rota de apoiadores, junto de `ADMIN` e `SECRETARIA`.
* `AuthService` persiste tokens em `localStorage`, o que simplifica sessao SPA, mas aumenta exposicao em caso de XSS.
* Servicos internos criticos foram padronizados para `/api`, deixando o `apiInterceptor` resolver a URL base.
* `ComunicadosService.listar` usa `HttpParams`, mantendo encoding consistente dos filtros.
* `SiteConfigService.aplicarCorPrimaria` usa guarda de documento e calcula corretamente a variavel escurecida da cor primaria.
* Existem comentarios com caracteres mojibake em alguns arquivos, indicando divergencia de encoding anterior.

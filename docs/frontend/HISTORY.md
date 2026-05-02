# Histórico de Varreduras e Entregas — Frontend

---

## Varredura 1 — Documentação Inicial

**Data:** 2026-04-29
**Workspace:** `E:\PI-5\Braille-Frontend`
**Tipo de análise:** Frontend Angular (Standalone)

### Documentos gerados nesta varredura

- `INDEX.md`
- `app-bootstrap-rotas.md`
- `auth-session-guards.md`
- `core-http-services.md`
- `layouts-navigation.md`
- `shared-ui-a11y-utils.md`
- `dashboard.md`
- `beneficiaries.md`
- `turmas-frequencias.md`
- `usuarios-perfil.md`
- `conteudo-publico-contatos.md`
- `apoiadores-certificados.md`
- `audit-ajuda-quality.md`

### Itens rastreados

- Estrutura Angular standalone
- Rotas públicas e administrativas
- Guards e RBAC
- Interceptadores HTTP
- Serviços REST e endpoints
- DTOs, interfaces e modelos
- Componentes e layouts
- Estado reativo com Signals, Observables e BehaviorSubject
- Acessibilidade, WCAG, LiveAnnouncer, focus trap e axe-core
- PWA e service worker
- Testes unitários (Vitest), ESLint e Cypress

---

## Varredura 2 — Revisão Completa e Limpeza

**Data:** 2026-05-02
**Workspace:** `E:\PI-5\Braille-Frontend`
**Branch:** `dev`
**Commit:** `c3aabb0`
**Tipo de análise:** Frontend Angular — revisão, enriquecimento e limpeza

### Decisões tomadas antes da execução

| Ponto | Decisão |
|---|---|
| Branches | `dev → hom → main` (confirmado) |
| README1.md | Deletado |
| Scripts de patch (6 arquivos) | Deletados — não usados em produção |
| Sentry (`@sentry/angular`) | Removido completamente do projeto |

### Limpeza de código realizada

- `@sentry/angular` desinstalado via `npm uninstall`
- `src/main.ts` — toda lógica Sentry removida; axe-core mantido
- `src/app/app.config.ts` — Sentry ErrorHandler removido
- `src/environments/environment.interface.ts` — campos `sentryDsn` e `sentryEnv` removidos
- `src/environments/environment.ts` — campos Sentry removidos
- `src/environments/environment.prod.ts` — campos Sentry removidos
- `vercel.json` — entradas `https://o0.ingest.sentry.io` removidas da CSP
- Deletados: `README1.md`, `bypass-encoding.js`, `fix-async.js`, `fix-strings.js`, `fix-vitest.js`, `patch_focus.js`, `patch_usuario_modal.js`

### Correção de segurança (Snyk CWE-601)

- **Arquivo:** `src/app/pages/admin/apoiadores/components/apoiador-certificados/apoiador-certificados.component.ts`
- **Vulnerabilidade:** Open Redirect — `window.open(res.pdfUrl)` sem validação de domínio
- **Correção:** método `isSafeCloudinaryUrl()` valida que a URL pertence ao `res.cloudinary.com` antes de abrir; adicionado `noopener,noreferrer`

### Documentos novos criados nesta varredura

- `README.md` (raiz) — reescrito do zero
- `CONTRIBUTING.md` (raiz) — criado do zero
- `docs/frontend/00-setup.md` — onboarding e setup local
- `docs/frontend/09-testes.md` — Vitest e Cypress (com cypress-axe)
- `docs/frontend/10-pwa-deploy.md` — build, service worker, Vercel, CSP
- `docs/frontend/11-acessibilidade.md` — WCAG 2.1 AA, axe-core, LiveAnnouncer, checklist
- `docs/frontend/12-decisoes-tecnicas.md` — 11 ADRs

### Documentos revisados e enriquecidos nesta varredura

Todos os 13 documentos da varredura anterior foram reescritos com:
- Acentuação corrigida em todo o conteúdo
- Exemplos de código adicionados
- Diagramas de fluxo (ASCII) adicionados
- Referências ao Sentry removidas
- `INDEX.md` completamente atualizado

### Resultado final

| Métrica | Valor |
|---|---|
| Arquivos alterados no commit | 36 |
| Linhas adicionadas | 3.587 |
| Linhas removidas | 2.612 |
| Documentos totais em `docs/frontend/` | 19 |
| Erros de TypeScript no build | 0 |
| Vulnerabilidades Snyk corrigidas | 1 |

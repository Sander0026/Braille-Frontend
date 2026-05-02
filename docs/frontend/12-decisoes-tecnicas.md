# Decisões Técnicas (ADRs) — Braille-Frontend

Registro de Architecture Decision Records (ADRs) — cada decisão técnica significativa
documentada com contexto, alternativas consideradas e justificativa.

---

## ADR-001: Angular 21 com Standalone Components (sem NgModules)

**Status:** Aceito

**Contexto:**
O Angular 14 introduziu Standalone Components como alternativa aos NgModules.
No Angular 17 tornou-se o padrão recomendado, e no Angular 21 é a abordagem definitiva.

**Decisão:**
Toda a aplicação usa Standalone Components. Não existe nenhum `NgModule` customizado.

**Consequências:**
- Cada componente declara suas dependências no `imports[]` — mais legível isoladamente
- Tree-shaking mais eficiente — apenas o usado vai para o bundle
- Providers registrados via `app.config.ts` — fonte única de verdade para DI
- `importProvidersFrom()` é o mecanismo de compatibilidade para libs legadas (ex: `ngx-quill`)

---

## ADR-002: TailwindCSS 3 + SCSS (sem CSS-in-JS)

**Status:** Aceito

**Contexto:**
O sistema precisava de uma solução de estilização consistente e produtiva.

**Alternativas consideradas:**
- CSS-in-JS (Emotion, styled-components) — não nativo para Angular
- Angular Material — design system opinado demais para identidade visual personalizada
- Bootstrap — difícil de customizar para a paleta do ILBES

**Decisão:**
TailwindCSS 3 para classes utilitárias + SCSS para estilos de componente.

**Consequências:**
- Classes utilitárias eliminam nomes de classe arbitrários em CSS
- PurgeCSS embutido no Tailwind — apenas classes usadas vão para produção
- SCSS é usado para aninhamento e variáveis complexas que o Tailwind não cobre

---

## ADR-003: JWT em localStorage (em vez de HttpOnly Cookie)

**Status:** Aceito com ressalvas

**Contexto:**
A autenticação precisa persistir entre recarregamentos de página.

**Alternativas consideradas:**
- **HttpOnly Cookie** — mais seguro contra XSS; requer configuração CORS com `credentials: true`
  e mudanças significativas no backend NestJS

**Decisão:**
Access token e refresh token em `localStorage` com chaves `token_braille` e `refresh_braille`.

**Mitigações do risco XSS:**
- CSP rigorosa bloqueia scripts de terceiros não autorizados
- DOMPurify sanitiza todo HTML do CMS antes de renderizar
- `SafeHtmlPipe` e `SafeUrlPipe` bloqueam URLs maliciosas

**Consequências:**
- Risco residual de XSS capturar tokens — mitigado pelas defesas acima
- Implementação mais simples — sem `withCredentials` no backend
- Recomendação futura: migrar para HttpOnly Cookie se o sistema escalar e o risco aumentar

---

## ADR-004: `provideAnimations()` Mantido Apesar de Deprecated

**Status:** Aceito (temporário)

**Contexto:**
`provideAnimations()` foi deprecated no Angular 19. O Angular 21 recomenda `provideAnimationsAsync()`.

**Problema:**
`ngx-quill` (editor rich text) usa internamente a DSL legada de animações do Angular.
Migrar para `provideAnimationsAsync()` quebra o editor Quill com erros em tempo de execução.

**Decisão:**
Manter `provideAnimations()` até que `ngx-quill` publique versão compatível com Angular 21+.

**Remoção prevista:** Angular 23 ou quando `ngx-quill >= 28` for lançado.

---

## ADR-005: 3 Interceptors Separados (SRP)

**Status:** Aceito

**Contexto:**
O sistema precisa de: (1) resolução de URL da API, (2) injeção de JWT, (3) tratamento global de erros.

**Alternativas consideradas:**
- Um único interceptor "god class" com toda a lógica
- Interceptor único com condicionais para cada responsabilidade

**Decisão:**
3 interceptors separados: `apiInterceptor`, `authInterceptor`, `errorInterceptor`.

**Consequências:**
- Cada interceptor tem 1 responsabilidade → mais fácil de testar e manter
- Ordem importa: `api → auth → error` (URL resolvida antes de injetar token)
- Adicionar nova responsabilidade = novo interceptor, sem mexer nos existentes

---

## ADR-006: Refresh Token Concorrente com BehaviorSubject

**Status:** Aceito

**Contexto:**
Múltiplas requests simultâneas podem receber 401 ao mesmo tempo quando o token expira.
Sem coordenação, cada request dispararia seu próprio refresh, gerando race conditions.

**Decisão:**
`BehaviorSubject<string | null>` como fila de espera no `authInterceptor`.
Apenas a primeira request que recebe 401 dispara o refresh.
As demais ficam suspensas com `.pipe(filter(token => token !== null), take(1))`.

**Consequências:**
- Exatamente 1 chamada de refresh por ciclo de expiração
- Requests em fila automaticamente recebem o novo token e são reexecutadas
- Risco residual: se o refresh demorar muito, as requests na fila ficam pendentes por longo tempo

---

## ADR-007: Scripts de Patch Temporários (Removidos)

**Status:** Removido (2026-05-02)

**Contexto:**
Durante o desenvolvimento, 6 scripts foram criados para resolver problemas de ambiente:
`bypass-encoding.js`, `fix-async.js`, `fix-strings.js`, `fix-vitest.js`,
`patch_focus.js`, `patch_usuario_modal.js`.

**Decisão:**
Remover todos. Os problemas que eles resolviam foram corrigidos na implementação final
ou não são mais relevantes para o estado atual do sistema.

**Consequências:**
- Repositório mais limpo, sem scripts sem dono
- Se algum bug ressurgir, investigar diretamente na implementação em vez de aplicar patch externo

---

## ADR-008: CSP via Headers HTTP no vercel.json (em vez de meta tag)

**Status:** Aceito

**Contexto:**
Content-Security-Policy pode ser definido via `<meta http-equiv>` no HTML ou via header HTTP.

**Decisão:**
Headers HTTP no `vercel.json`.

**Consequências:**
- Headers HTTP têm precedência sobre meta tags e são mais seguros
- A meta tag CSP não suporta todas as diretivas (`frame-ancestors`, `report-uri`)
- Mudanças no CSP exigem deploy — não podem ser feitas sem versionar o código

---

## ADR-009: axe-core Apenas em isDevMode() (Dynamic Import)

**Status:** Aceito

**Contexto:**
`axe-core` é uma biblioteca pesada (~290KB) de auditoria de acessibilidade.

**Decisão:**
```typescript
if (isDevMode()) {
  import('axe-core').then(...);  // dynamic import — zero impacto em produção
}
```

**Consequências:**
- Bundle de produção não inclui `axe-core` — zero impacto de performance
- Auditoria automática disponível para todos os devs sem configuração adicional
- Dev vê violações de acessibilidade antes mesmo de abrir PR

---

## ADR-010: Remoção do Sentry (2026-05-02)

**Status:** Aceito

**Contexto:**
`@sentry/angular` foi instalado para monitoramento de erros em produção, mas o DSN
nunca foi configurado — o Sentry estava instalado mas desligado.

**Decisão:**
Remover completamente: `npm uninstall @sentry/angular`, limpar `main.ts`, `app.config.ts`
e `environment*.ts`.

**Alternativas futuras:**
- Reativar o Sentry: criar conta em `sentry.io`, gerar DSN, configurar no `environment.prod.ts`
- Usar alternativa open-source: GlitchTip ou Highlight.io
- O código foi estruturado para facilitar a reinserção do monitoramento no futuro

---

## ADR-011: Branches dev → hom → main (3 Ambientes)

**Status:** Aceito

**Contexto:**
O projeto precisa de separação entre desenvolvimento ativo, homologação e produção.

**Decisão:**

| Branch | Ambiente | Deploy |
|---|---|---|
| `dev` | Desenvolvimento | Manual |
| `hom` | Homologação | Manual |
| `main` | Produção | Automático (Vercel) |

**Consequências:**
- `main` nunca recebe commits diretos — só via PR de `hom`
- `hom` é o ambiente de validação antes de ir para produção
- `dev` é onde o desenvolvimento ativo acontece

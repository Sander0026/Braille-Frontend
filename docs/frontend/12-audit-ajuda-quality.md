# Módulo: Auditoria, Ajuda e Qualidade

---

# 1. Visão Geral

## Objetivo

Documentar três recursos transversais do sistema: o **log de auditoria** (rastreabilidade de ações),
a **central de ajuda** (guia do usuário embutido) e os mecanismos de **qualidade** do sistema.

---

# 2. Log de Auditoria (`/admin/auditoria`)

**Acesso:** apenas `ADMIN`
**Arquivo:** `src/app/pages/admin/audit-log/`

## 2.1 Funcionalidades

- Lista cronológica de todas as ações realizadas no sistema
- Filtros: tipo de ação (CRIAR, ATUALIZAR, EXCLUIR, LOGIN), entidade, usuário, período
- Detalhe de cada evento com diff visual "antes → depois"
- Exportação de período filtrado

## 2.2 Visualização do Diff

O componente usa `gerarDiferencas()` de `audit-diff.util.ts` para transformar
os objetos JSON `dadosAntigos` e `dadosNovos` em uma tabela legível:

```typescript
// audit-diff.util.ts
const diffs = gerarDiferencas(log.dadosAntigos, log.dadosNovos);
// Retorna: [{ campo: 'Nome', de: 'João', para: 'João Silva', alterado: true, sensivel: false }]
```

**Mascaramento automático de dados sensíveis:**

| Campo | Exibição no diff |
|---|---|
| CPF `12345678900` | `Final 8900` |
| RG `1234567` | `Final 4567` |
| Email `joao@gmail.com` | `j***@gmail.com` |
| Telefone | `Final 9999` |
| Senha hash | nunca exibida (`senhaHash` está em `AUDIT_IGNORED_FIELDS`) |

## 2.3 Endpoints

```typescript
listar(params): Observable<PaginatedResponse<AuditLog>>
  GET /api/audit-log

getStats(): Observable<AuditStats>
  GET /api/audit-log/stats

getHistorico(entidade, registroId): Observable<AuditLog[]>
  GET /api/audit-log/:entidade/:registroId
```

**Caches:** lista com TTL 1 min, stats com TTL 5 min.

## 2.4 Interface de AuditLog

```typescript
interface AuditLog {
  id: string;
  acao: 'CRIAR' | 'ATUALIZAR' | 'EXCLUIR' | 'LOGIN' | 'LOGOUT';
  entidade: string;              // 'Beneficiario', 'Turma', 'Usuario', etc.
  registroId: string;
  usuarioId: string;
  nomeUsuario: string;
  dadosAntigos: Record<string, unknown> | null;
  dadosNovos: Record<string, unknown> | null;
  criadoEm: string;             // ISO datetime
}
```

---

# 3. Central de Ajuda (`/admin/ajuda`)

**Acesso:** todos os autenticados
**Arquivo:** `src/app/pages/admin/ajuda/`

## 3.1 Funcionalidades

- Guia do usuário embutido (não é link externo — está dentro do sistema)
- Seções por role: ADMIN, SECRETARIA, PROFESSOR, COMUNICACAO
- Lista de atalhos de teclado (`Alt+Shift+*`) — consumida via `HotkeysService.getRegisteredHotkeys()`
- FAQ com as dúvidas mais comuns

## 3.2 Modal de Atalhos

Disparado por `Alt+Shift+H` via `HotkeysService.onHelpRequested$`.
O `AdminLayout` escuta esse Subject e abre o `HelpModalComponent`.

```typescript
// AdminLayout
this.hotkeys.onHelpRequested$.pipe(takeUntilDestroyed()).subscribe(() => {
  this.mostrarModalAjuda.set(true);
});
```

---

# 4. Mecanismos de Qualidade do Sistema

## 4.1 Auditoria de Acessibilidade (axe-core)

Em modo desenvolvimento (`isDevMode()`), o `main.ts` carrega `axe-core` dinamicamente.

```javascript
// Auditoria automática 2s após boot
// Expõe no DevTools:
auditarAcessibilidade()
```

**O que testa:**
- Contraste de cores (WCAG 2.1 SC 1.4.3)
- Labels em formulários (WCAG 2.1 SC 1.3.1)
- Atributos ARIA inválidos
- Imagens sem alt
- Ordem de foco lógica

## 4.2 Testes E2E Automatizados (Cypress + cypress-axe)

Os testes E2E incluem verificação automática de acessibilidade via `cypress-axe`:

```javascript
// cypress/support/commands.ts
cy.injectAxe();
cy.checkA11y(null, null, (violations) => {
  cy.task('log', `${violations.length} violações encontradas`);
});
```

## 4.3 Linting de Acessibilidade (angular-eslint)

O `eslint.config.js` inclui regras de acessibilidade do `angular-eslint`:
- `@angular-eslint/template/alt-text` — toda `<img>` deve ter `alt`
- `@angular-eslint/template/label-has-associated-control` — labels associados
- `@angular-eslint/template/interactive-supports-focus` — elementos interativos devem ser focáveis

---

# 5. Segurança

## Auditoria

- **Imutável:** logs de auditoria são `append-only` — nenhum endpoint de PATCH ou DELETE
- **Dados sensíveis mascarados:** CPF, RG, email e telefone nunca aparecem em texto claro no diff
- **Apenas ADMIN:** endpoint e página de auditoria inacessíveis para outros roles

## Ajuda

- Conteúdo da ajuda é estático (hardcoded no componente) — sem risco de XSS via CMS

---

# 6. Relação com Outros Módulos

| Módulo | Relação |
|---|---|
| `AuditLogService` | Dados de auditoria |
| `audit-diff.util` | Geração do diff visual |
| `HotkeysService` | Lista de atalhos na central de ajuda |
| `axe-core` | Auditoria de acessibilidade em dev |
| `cypress-axe` | Testes de acessibilidade E2E |

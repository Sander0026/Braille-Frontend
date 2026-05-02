# Módulo: Acessibilidade (A11y) — WCAG e Ferramentas

---

# 1. Visão Geral

## Objetivo

Documentar todas as estratégias, ferramentas e padrões de acessibilidade implementados
no sistema, respeitando as diretrizes WCAG 2.1 Nível AA e o contexto do Instituto Luiz Braille,
que atende pessoas com deficiência visual.

## Por que acessibilidade é prioridade absoluta aqui?

O ILBES é uma instituição especializada em atendimento a pessoas com deficiência visual.
Todos os funcionários, professores e possivelmente beneficiários que usam o sistema podem
ter algum grau de deficiência visual. **Acessibilidade não é opcional — é o requisito central.**

---

# 2. Ferramentas de Acessibilidade Implementadas

## 2.1 axe-core — Auditoria Automática em Desenvolvimento

**Onde:** `src/main.ts` (carregado via dynamic import apenas em `isDevMode()`)

```javascript
// Como usar no DevTools (F12) → Console:
auditarAcessibilidade()
```

**O que detecta:**
- Contraste insuficiente (WCAG 1.4.3)
- Imagens sem `alt` (WCAG 1.1.1)
- Formulários sem label (WCAG 1.3.1)
- ARIA inválido (WCAG 4.1.2)
- Ordem de foco ilógica (WCAG 2.4.3)
- Elementos interativos sem nome acessível (WCAG 4.1.2)

**Para auditar modais:**
```javascript
// 1. Abra o modal
// 2. No console:
auditarAcessibilidade()
// O axe inspeciona o estado atual do DOM, incluindo o modal
```

## 2.2 cypress-axe — Testes de Acessibilidade E2E

**Onde:** `cypress/support/e2e.ts`

```typescript
// Em qualquer spec Cypress:
cy.injectAxe();
cy.checkA11y(null, {
  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] }
});
```

Executa automaticamente em todos os testes de roles, garantindo que nenhuma regressão
de acessibilidade passe despercebida.

## 2.3 Angular CDK LiveAnnouncer — Anúncios para Leitores de Tela

**Onde:** `ToastService`, `HotkeysService`, guards, interceptors

```typescript
// ToastService — anuncia mensagens de feedback
this.liveAnnouncer.announce('Aluno salvo com sucesso', 'polite');
this.liveAnnouncer.announce('Erro ao salvar. Tente novamente.', 'assertive');
```

**`polite`:** aguarda o leitor de tela terminar o que está lendo antes de anunciar.
**`assertive`:** interrompe imediatamente — usado apenas para erros críticos.

## 2.4 VLibras — Tradução em Libras

Widget do governo federal integrado no site público. Permite que usuários surdos
naveguem o conteúdo com tradução automática para Língua Brasileira de Sinais.
Requer permissão explícita na CSP (`script-src`, `frame-src`, `connect-src`).

---

# 3. Padrões WCAG Implementados

## WCAG 1.1.1 — Conteúdo Não-Textual (Imagens com Alt)

```html
<!-- Imagens de apoiadores sempre com alt -->
<img [src]="apoiador.logo | cloudinary" [alt]="apoiador.nome" />

<!-- Ícones decorativos ocultos do leitor -->
<svg aria-hidden="true">...</svg>

<!-- SafeHtmlPipe injeta alt="" em imagens sem alt do CMS -->
// safe-html.pipe.ts
doc.querySelectorAll('img').forEach(img => {
  if (!img.hasAttribute('alt')) img.setAttribute('alt', ''); // decorativo
});
```

## WCAG 2.1.1 e 2.1.2 — Navegação por Teclado (Sem Armadilha)

```html
<!-- TabEscapeDirective resolve a armadilha em textareas -->
<textarea tabEscape formControlName="descricao"></textarea>
```

O `Tab` dentro de um `<textarea>` normalmente insere um caractere `\t`.
A `TabEscapeDirective` intercepta e move o foco para o próximo elemento.

## WCAG 3.2.5 — Abertura de Links em Nova Aba

```typescript
// SafeHtmlPipe injeta aria-label em links _blank do CMS
anchor.setAttribute('aria-label', `${text} - Abre em nova aba`);
anchor.setAttribute('title', `${text} (Abre em nova aba)`);
```

Leitores de tela anunciam "Abre em nova aba" quando o usuário encontra um link externo.

## WCAG 2.4.3 — Ordem de Foco Lógica (Modais)

```html
<!-- cdkTrapFocus mantém o foco dentro do modal -->
<div cdkTrapFocus role="dialog" aria-modal="true" [attr.aria-labelledby]="tituloId">
  ...
</div>
```

O `cdkTrapFocus` do Angular CDK previne que o usuário de teclado ou leitor de tela
"escape" do modal para elementos que estão visivelmente atrás.

## WCAG 1.4.3 — Contraste de Cores

- TailwindCSS configurado com a paleta do ILBES — todas as combinações de texto/fundo
  atendem ao contraste mínimo de 4.5:1 para texto normal e 3:1 para texto grande
- axe-core verifica automaticamente em desenvolvimento

## WCAG 4.1.2 — Nome, Função, Valor (ARIA)

```html
<!-- Botões com apenas ícone têm aria-label -->
<button aria-label="Excluir aluno João Silva">
  <svg aria-hidden="true">...</svg>
</button>

<!-- Link ativo na sidebar -->
<a [attr.aria-current]="isAtivo ? 'page' : null">Dashboard</a>

<!-- Toasts com role de alerta -->
<div role="alert" aria-live="assertive">{{ mensagem }}</div>
```

---

# 4. Atalhos de Teclado (Hotkeys)

O sistema implementa atalhos via `HotkeysService` usando `Alt+Shift` como prefixo
(protege contra conflitos com atalhos nativos do sistema operacional e browser).

| Atalho | Ação |
|---|---|
| `Alt+Shift+N` | Abrir cadastro de novo aluno |
| `Alt+Shift+O` | Ir para Turmas/Oficinas |
| `Alt+Shift+F` | Ir para Frequências |
| `Alt+Shift+H` | Abrir central de ajuda e lista de atalhos |
| `Alt+Shift+D` | Ir para o Dashboard |

**Desativados automaticamente** quando o foco está em `input`, `textarea`, `select` ou `contenteditable`.

---

# 5. Formulários Acessíveis

```html
<!-- Padrão para campos de formulário -->
<label [for]="campoId">Nome Completo *</label>
<input
  [id]="campoId"
  [attr.aria-required]="true"
  [attr.aria-invalid]="campo.invalid && campo.touched"
  [attr.aria-describedby]="erroId"
/>
<span [id]="erroId" role="alert" *ngIf="campo.invalid && campo.touched">
  {{ mensagemErro }}
</span>
```

- `aria-required` informa ao leitor que o campo é obrigatório
- `aria-invalid` informa quando o campo tem erro
- `aria-describedby` aponta para a mensagem de erro específica
- `role="alert"` faz o leitor anunciar o erro automaticamente

---

# 6. Linting de Acessibilidade

`eslint.config.js` inclui regras do `angular-eslint` que bloqueam commits com:
- `<img>` sem `alt` (`@angular-eslint/template/alt-text`)
- Labels sem associação com controle (`@angular-eslint/template/label-has-associated-control`)
- Elementos interativos sem foco (`@angular-eslint/template/interactive-supports-focus`)

---

# 7. Checklist de Acessibilidade para Novos Componentes

Antes de abrir PR com novo componente, verificar:

- [ ] Imagens têm `alt` descritivo (ou `alt=""` se decorativas)
- [ ] Botões com ícone têm `aria-label`
- [ ] Modais usam `cdkTrapFocus` + `role="dialog"` + `aria-modal="true"`
- [ ] Tabelas têm `scope="col"` nos headers
- [ ] Links externos têm indicação "Abre em nova aba"
- [ ] `auditarAcessibilidade()` rodou e não retornou violações críticas
- [ ] Testou navegação apenas com teclado (Tab, Enter, Esc, setas)

---

# 8. Relação com Outros Módulos

| Módulo | Relação |
|---|---|
| `TabEscapeDirective` | WCAG 2.1.1 — armadilha de teclado em textarea |
| `SafeHtmlPipe` | WCAG 1.1.1 e 3.2.5 — alt em imagens, aria em links |
| `ToastService` | LiveAnnouncer — feedback auditivo |
| `HotkeysService` | Navegação por teclado com atalhos |
| `ConfirmDialogComponent` | WCAG 2.4.3 — focus trap em modais |
| `axe-core` | Auditoria automática em dev |
| `cypress-axe` | Testes automáticos de a11y E2E |
| `eslint.config.js` | Lint de acessibilidade em build time |

# Módulo: Testes Automatizados

---

# 1. Visão Geral

## Objetivo

Documentar a estratégia de testes do frontend: testes unitários com **Vitest**
e testes E2E com **Cypress** (incluindo auditoria de acessibilidade via `cypress-axe`).

## Responsabilidade

Os testes garantem que os fluxos críticos (login, cadastro de aluno, chamada de frequência)
funcionem corretamente para cada perfil de usuário, e que as páginas estejam acessíveis
de acordo com as diretrizes WCAG.

---

# 2. Testes Unitários (Vitest)

**Framework:** Vitest 4 + jsdom
**Arquivo de configuração:** `vite.config.ts`

## 2.1 Executar

```bash
# Modo watch (reexecuta ao salvar)
npm test

# Execução única (CI)
npm test -- --run

# Com cobertura de código
npm test -- --coverage
```

## 2.2 Estrutura

Os arquivos de teste ficam junto ao arquivo que testam (collocação):

```
src/app/
├── core/pipes/
│   ├── safe-html.pipe.ts
│   └── safe-html.pipe.spec.ts    ← teste do pipe
├── shared/validators/
│   ├── password.validator.ts
│   └── password.validator.spec.ts
```

## 2.3 Como Escrever um Teste

```typescript
// exemplo: src/app/shared/validators/password.validator.spec.ts
import { describe, it, expect } from 'vitest';
import { FormControl } from '@angular/forms';
import { senhaForteValidator } from './password.validator';

describe('senhaForteValidator', () => {
  it('deve retornar null para senha vazia (compatível com Validators.required)', () => {
    const ctrl = new FormControl('');
    expect(senhaForteValidator(ctrl)).toBeNull();
  });

  it('deve rejeitar senha sem maiúscula', () => {
    const ctrl = new FormControl('senha123!');
    const erros = senhaForteValidator(ctrl);
    expect(erros?.['senhaFraca'].missingUppercase).toBe(true);
  });

  it('deve aceitar senha válida', () => {
    const ctrl = new FormControl('Senha123!');
    expect(senhaForteValidator(ctrl)).toBeNull();
  });
});
```

## 2.4 O que Priorizar nos Testes Unitários

| Prioridade | O que testar |
|---|---|
| 🔴 Alta | `senhaForteValidator`, `SafeHtmlPipe`, `SafeUrlPipe`, `audit-diff.util`, `masks.util` |
| 🟡 Média | `AuthService.decodeToken()`, `isUserInfo()`, `CloudinaryPipe` |
| 🟢 Baixa | Componentes de apresentação pura (sem lógica) |

---

# 3. Testes E2E (Cypress)

**Framework:** Cypress 15
**Arquivo de configuração:** `cypress.config.ts`

```typescript
// cypress.config.ts
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    setupNodeEvents(on, config) {
      on('task', { log, table })  // helpers para debug
    }
  }
});
```

## 3.1 Pré-requisitos

```bash
# Backend deve estar rodando em localhost:3000
# Frontend deve estar rodando em localhost:4200

# Em terminais separados:
# Terminal 1:
cd Braille-Api && npm run start:dev

# Terminal 2:
cd Braille-Frontend && npm start
```

## 3.2 Executar Cypress

```bash
# Interface visual (recomendado para desenvolver testes)
npm run teste_automatizado:gui

# Headless por role (para CI ou validação final)
npm run teste_automatizado:adm
npm run teste_automatizado:secretaria
npm run teste_automatizado:professor
npm run teste_automatizado:comunicacao
```

## 3.3 Estrutura dos Testes E2E

```
cypress/
├── e2e/
│   ├── admin/
│   │   ├── login.cy.ts          # Fluxo de login e troca de senha
│   │   ├── alunos.cy.ts         # CRUD de beneficiários
│   │   ├── turmas.cy.ts         # Gestão de turmas
│   │   ├── frequencias.cy.ts    # Chamada de frequência
│   │   └── auditoria.cy.ts     # Log de auditoria (ADMIN)
│   └── public/
│       ├── home.cy.ts           # Página inicial pública
│       └── contato.cy.ts        # Formulário de contato
├── support/
│   ├── commands.ts              # Comandos customizados (cy.login(), cy.injectAxe())
│   └── e2e.ts                   # Import global de cypress-axe
└── fixtures/
    └── usuarios.json            # Dados de teste por role
```

## 3.4 Comandos Customizados

```typescript
// cypress/support/commands.ts

// Login programático (sem passar pela UI — mais rápido)
Cypress.Commands.add('login', (role: 'admin' | 'secretaria' | 'professor' | 'comunicacao') => {
  cy.request('POST', `${Cypress.env('apiUrl')}/auth/login`, {
    username: Cypress.env(`${role}_user`),
    senha: Cypress.env(`${role}_senha`)
  }).then(({ body }) => {
    localStorage.setItem('token_braille', body.access_token);
    if (body.refresh_token) {
      localStorage.setItem('refresh_braille', body.refresh_token);
    }
  });
});
```

## 3.5 Testes de Acessibilidade com cypress-axe

```typescript
// Exemplo em qualquer spec:
describe('Dashboard — Acessibilidade', () => {
  beforeEach(() => {
    cy.login('admin');
    cy.visit('/admin/dashboard');
    cy.injectAxe();  // injeta axe-core na página carregada
  });

  it('não deve ter violações de acessibilidade', () => {
    cy.checkA11y(null, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa']  // WCAG 2.1 Nível AA
      }
    });
  });
});
```

**O que `checkA11y` verifica automaticamente:**
- Contraste de cores (WCAG 1.4.3)
- Atributos ARIA inválidos (WCAG 4.1.2)
- Imagens sem texto alternativo (WCAG 1.1.1)
- Labels de formulário ausentes (WCAG 1.3.1)
- Ordem lógica de foco (WCAG 2.4.3)

## 3.6 Como Escrever Novos Testes E2E

```typescript
// Padrão recomendado
describe('Módulo de Turmas — SECRETARIA', () => {
  beforeEach(() => {
    cy.login('secretaria');
    cy.visit('/admin/turmas');
    cy.injectAxe();
  });

  it('deve listar turmas', () => {
    cy.get('[data-cy="turmas-tabela"]').should('be.visible');
    cy.checkA11y();  // sempre verificar acessibilidade
  });

  it('deve criar nova turma', () => {
    cy.get('[data-cy="btn-nova-turma"]').click();
    cy.get('[data-cy="campo-nome"]').type('Informática Básica');
    // ...
    cy.get('[data-cy="btn-salvar"]').click();
    cy.contains('Turma criada com sucesso');
  });
});
```

**Convenção de atributos `data-cy`:** todo elemento interativo testado deve ter `data-cy="identificador-unico"`.

---

# 4. Integração em CI/CD

Os testes podem ser integrados no GitHub Actions antes do deploy:

```yaml
# .github/workflows/ci.yml (exemplo)
- name: Run Cypress Tests
  run: npm run teste_automatizado:adm
  env:
    CYPRESS_admin_user: ${{ secrets.CYPRESS_ADMIN_USER }}
    CYPRESS_admin_senha: ${{ secrets.CYPRESS_ADMIN_SENHA }}
    CYPRESS_apiUrl: ${{ secrets.API_URL }}
```

---

# 5. Pontos de Atenção

- **Credenciais de teste** nunca devem ser hardcoded — usar `cypress.env.json` (gitignored) ou variáveis de ambiente
- **Banco de teste** idealmente separado do banco de produção — evitar testes E2E em produção
- **`cypress-axe` é síncrono** — `cy.checkA11y()` pode falhar por violações em conteúdo carregado dinamicamente;
  usar `cy.wait()` ou `cy.get('[elemento]').should('be.visible')` antes de verificar
- **Testes de role** dependem de contas ativas no backend — manter usuários de teste atualizados

---

# 6. Relação com Outros Módulos

| Módulo | Relação |
|---|---|
| `main.ts` | axe-core em dev (complementa os testes E2E) |
| `cypress-axe` | Testes automáticos de acessibilidade WCAG |
| `vitest.config.ts` | Configuração dos testes unitários |
| `cypress.config.ts` | Configuração base do Cypress |
| Todos os componentes | Alvo dos testes unitários e E2E |

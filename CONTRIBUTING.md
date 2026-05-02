# Guia de Contribuição — Braille-Frontend

---

## Pré-requisitos

| Ferramenta | Versão mínima |
|---|---|
| Node.js | 22+ |
| npm | 11+ |
| Angular CLI | 21 (`npm install -g @angular/cli@21`) |

---

## Fluxo de Branches

```
dev ──── feature/minha-feature ──► dev ──► hom ──► main
         (seu trabalho aqui)      (PR)    (QA)   (produção)
```

| Branch | Propósito |
|---|---|
| `main` | Produção — deploy automático na Vercel |
| `hom` | Homologação — testes finais antes de subir para main |
| `dev` | Desenvolvimento — base de todas as features |
| `feature/*` | Sua branch de trabalho — criada a partir de `dev` |

**Regra:** nunca commitar diretamente em `main` ou `hom`.

---

## Fluxo de Trabalho

```bash
# 1. Atualize dev antes de criar sua branch
git checkout dev
git pull origin dev

# 2. Crie sua branch de feature
git checkout -b feature/nome-descritivo

# 3. Trabalhe e commite seguindo o padrão abaixo
git add .
git commit -m "feat(turmas): adiciona filtro por professor na listagem"

# 4. Antes de abrir PR, sincronize com dev
git fetch origin
git rebase origin/dev

# 5. Abra Pull Request: feature/* → dev
```

---

## Padrão de Commits (Conventional Commits)

```
<tipo>(<escopo>): <descrição curta em PT-BR>
```

| Tipo | Quando usar |
|---|---|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Só documentação |
| `style` | Formatação (sem mudança de lógica) |
| `refactor` | Refatoração sem nova feature nem bug fix |
| `test` | Adição ou correção de testes |
| `chore` | Tarefas de manutenção (deps, build, configs) |
| `a11y` | Melhorias de acessibilidade |

**Exemplos:**
```
feat(auth): implementa tela de troca de senha obrigatória
fix(beneficiaries): corrige paginação ao filtrar por status inativo
docs(readme): atualiza instruções de setup local
a11y(modal): adiciona focus trap no modal de confirmação
chore(deps): atualiza Angular para 21.2.1
```

---

## Como Criar um Novo Componente

```bash
# Componente standalone (padrão do projeto)
ng generate component pages/admin/meu-modulo/minha-tela --standalone --skip-tests

# Serviço
ng generate service core/services/meu-servico --skip-tests
```

**Convenções:**
- Componentes são standalone (sem NgModules)
- Usar `inject()` em vez de injeção por construtor sempre que possível
- Estado local com `signal()` + `computed()` em vez de propriedades mutáveis
- HTTP sempre em services — nunca diretamente em componentes

---

## Como Adicionar uma Nova Rota Admin

1. Crie o componente em `src/app/pages/admin/meu-modulo/`
2. Adicione a rota em `src/app/app.routes.ts`:

```typescript
{
  path: 'meu-modulo',
  loadComponent: () => import('./pages/admin/meu-modulo/meu-modulo').then(m => m.MeuModulo),
  title: 'Meu Módulo — ILBES',
  canActivate: [roleGuard],
  data: { roles: ['ADMIN', 'SECRETARIA'] }  // defina quem pode acessar
}
```

3. Adicione o link no menu lateral em `src/app/core/components/sidebar/`

---

## Como Adicionar um Novo Serviço HTTP

```typescript
@Injectable({ providedIn: 'root' })
export class MeuService {
  private readonly http = inject(HttpClient);

  // URLs relativas — o apiInterceptor resolve para environment.apiUrl automaticamente
  listar(): Observable<MeuTipo[]> {
    return this.http.get<MeuTipo[]>('/api/meu-recurso');
  }
}
```

**Regras:**
- Sempre usar URLs relativas iniciando com `/api/` (o `apiInterceptor` resolve o base URL)
- Tipar explicitamente todas as respostas HTTP
- Cache com `Map` + TTL para listagens que não mudam frequentemente

---

## Antes de Abrir um PR

- [ ] `npm run lint` passa sem erros
- [ ] `npm run build` compila sem erros de TypeScript
- [ ] Novos componentes têm acessibilidade básica (aria-label, role, tabindex)
- [ ] Não há `console.log` de debug esquecidos
- [ ] Não há `any` novo introduzido sem justificativa
- [ ] Testou em mobile (DevTools → responsive mode)
- [ ] Se alterou rotas: testou guards (tentar acessar sem login, com role errado)

---

## Padrão de Acessibilidade (Obrigatório)

O sistema serve pessoas com deficiência visual. Toda interface deve:

- Usar `aria-label` em botões sem texto visível
- Usar `role` semântico em elementos interativos customizados
- Testar com `auditarAcessibilidade()` no console do browser (em `npm start`)
- Não criar "armadilha de teclado" em modais — usar `cdkTrapFocus` do Angular CDK
- Usar `LiveAnnouncer` para feedback de ações assíncronas (ex: "Aluno salvo com sucesso")

---

## Estrutura de Testes

```bash
# Testes unitários (Vitest)
npm test

# Cypress — interface visual (recomendado para desenvolver testes)
npm run teste_automatizado:gui

# Cypress — headless por role
npm run teste_automatizado:adm
npm run teste_automatizado:secretaria
npm run teste_automatizado:professor
npm run teste_automatizado:comunicacao
```

Ver [docs/frontend/09-testes.md](docs/frontend/09-testes.md) para detalhes.

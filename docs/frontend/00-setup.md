# Módulo: Setup e Ambiente Local

---

# 1. Visão Geral

## Objetivo

Guiar qualquer desenvolvedor do zero ao ambiente de desenvolvimento funcional,
sem ambiguidades e sem depender de conhecimento prévio do projeto.

## Responsabilidade

Este documento centraliza tudo que é necessário para rodar, configurar e entender
o ciclo de vida local da aplicação Braille-Frontend.

## Fluxo de Funcionamento

O desenvolvedor instala as dependências, configura o proxy (que já vem pronto) e executa
`npm start`. O Angular CLI serve a SPA em `localhost:4200` e redireciona todas as chamadas
`/api/*` para o backend local em `localhost:3000` via `proxy.conf.json`.

---

# 2. Pré-requisitos

| Ferramenta | Versão | Como verificar |
|---|---|---|
| Node.js | **22+** | `node --version` |
| npm | **11+** | `npm --version` |
| Angular CLI | **21** | `ng version` |
| Git | Qualquer | `git --version` |

**Instalar Angular CLI globalmente:**
```bash
npm install -g @angular/cli@21
```

---

# 3. Instalação

```bash
# 1. Clone o repositório
git clone <url-do-repositorio>
cd Braille-Frontend

# 2. Checkout na branch de desenvolvimento
git checkout dev

# 3. Instale as dependências
npm install
```

> **Atenção:** use sempre `npm install` — o projeto usa `npm@11.6.2` definido em `packageManager`.
> Não use `yarn` ou `pnpm`.

---

# 4. Configuração de Ambiente

## Como funciona o sistema de ambientes

O projeto usa dois arquivos de ambiente que o Angular CLI troca automaticamente no build:

| Arquivo | Usado quando | `apiUrl` |
|---|---|---|
| `src/environments/environment.ts` | `ng serve` (desenvolvimento) | `/api` (proxy local) |
| `src/environments/environment.prod.ts` | `ng build` (produção) | `https://braille-api-oieq.onrender.com/api` |

## Proxy local (proxy.conf.json)

Em desenvolvimento, `apiUrl` é `/api`. O `proxy.conf.json` na raiz intercepta
todas as chamadas `/api/*` e redireciona para o backend:

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}
```

**Ou seja:** para rodar localmente, basta ter o backend rodando em `localhost:3000`.
Nenhuma variável de ambiente precisa ser configurada manualmente.

## Apontar para a API de produção (modo híbrido)

Se quiser rodar o frontend local mas usando a API do Render (útil para testar
sem precisar do backend local):

```typescript
// src/environments/environment.ts — altere temporariamente
export const environment: Environment = {
  production: false,
  apiUrl: 'https://braille-api-oieq.onrender.com/api',  // ← aponta para produção
};
```

> ⚠️ **Nunca commite esta alteração.** Reverta antes de abrir PR.

---

# 5. Rodando Localmente

```bash
# Servidor de desenvolvimento (com proxy para API local)
npm start

# Acesse em:
# http://localhost:4200           → site público
# http://localhost:4200/login     → login do painel
# http://localhost:4200/admin     → painel (redireciona para login se não autenticado)
```

### Credenciais de desenvolvimento

> Crie um usuário ADMIN diretamente no banco via o backend local, ou use as credenciais
> fornecidas pela equipe de dev.

---

# 6. Build de Produção

```bash
# Gera os arquivos em dist/braille-frontend/browser/
npm run build

# Para verificar o bundle localmente:
npx http-server dist/braille-frontend/browser -p 8080
```

O build de produção:
- Minifica e faz tree-shaking do código
- Gera o Service Worker (`ngsw-worker.js`) para PWA
- Aplica as configurações de `environment.prod.ts`

---

# 7. Scripts de Desenvolvimento

```bash
npm start                              # ng serve com proxy
npm run build                          # build produção
npm run watch                          # build dev com rebuild automático
npm run lint                           # ESLint + angular-eslint
npm test                               # Vitest (testes unitários)
npm run teste_automatizado:gui         # Cypress com interface visual
npm run teste_automatizado:adm         # Cypress headless role=admin
npm run teste_automatizado:secretaria  # Cypress headless role=secretaria
npm run teste_automatizado:professor   # Cypress headless role=professor
npm run teste_automatizado:comunicacao # Cypress headless role=comunicacao
```

---

# 8. Fluxo de Dados HTTP em Desenvolvimento

```
Componente
    ↓
Serviço Angular (ex: BeneficiariosService.listar())
    ↓
HttpClient.get('/api/beneficiaries')
    ↓
apiInterceptor → detecta URL relativa /api/*
    ↓ (environment.ts: apiUrl = '/api' — sem substituição)
proxy.conf.json → redireciona para http://localhost:3000/api/beneficiaries
    ↓
Backend NestJS (Render em prod, localhost:3000 em dev)
```

---

# 9. Auditoria de Acessibilidade em Desenvolvimento

O `main.ts` carrega `axe-core` automaticamente em modo dev. Ao abrir o browser:

1. Após 2 segundos do boot, o axe-core roda automaticamente e exibe violações no console
2. Para auditar manualmente (útil para modais):

```javascript
// No console do DevTools (F12):
auditarAcessibilidade()
```

---

# 10. Troubleshooting Comum

| Problema | Causa | Solução |
|---|---|---|
| `CORS error` em dev | Backend não está rodando | Suba o `Braille-Api` em `localhost:3000` |
| `Cannot GET /admin` ao recarregar | SPA sem rota server-side | Normal no Vercel (já configurado no `vercel.json`); em dev use `ng serve` |
| Service Worker em loop | SW cacheado de build anterior | Abra DevTools → Application → Storage → Clear site data |
| `NG0100` ExpressionChanged | Signal atualizado durante detecção | Mova a atualização para `effect()` ou `afterNextRender()` |
| Quill não carrega estilos | Animações desativadas | Confirmar que `provideAnimations()` está em `app.config.ts` |
| Cypress falha em login | Backend não acessível no CI | Verificar `CYPRESS_BASE_URL` e se a API de teste está no ar |

---

# 11. Pontos de Atenção

- **`provideAnimations()` está deprecated** desde Angular 19 — mantido por dependência do `ngx-quill`.
  Remoção prevista quando `ngx-quill` migrar para a nova API CSS de animações (Angular 23+).
- **Sem variáveis de ambiente no frontend Angular** — tudo vai compilado no bundle.
  Nunca coloque secrets no `environment.ts`.
- **O Service Worker só ativa em produção** (`enabled: !isDevMode()`).
  Em desenvolvimento, PWA está sempre desligado.

---

# 12. Relação com Outros Módulos

- `src/main.ts` — bootstrap da aplicação e axe-core
- `src/app/app.config.ts` — providers globais registrados aqui
- `src/app/app.routes.ts` — todas as rotas da SPA
- `proxy.conf.json` — redirecionamento HTTP em dev
- `angular.json` — configuração de build, budgets e environments
- `vercel.json` — headers de segurança e roteamento SPA em produção

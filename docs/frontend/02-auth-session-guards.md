# Módulo: Autenticação, Sessão e Autorização

---

# 1. Visão Geral

## Objetivo

Documentar o fluxo completo de autenticação da SPA: login, persistência de tokens JWT,
renovação automática de sessão, proteção de rotas por papel (RBAC), proteção
de formulários contra descarte acidental e tratamento de todos os casos de expiração.

## Responsabilidade

Este módulo é composto por:
- `AuthService` — fachada de sessão e perfil
- `authGuard` — protege acesso às páginas admin
- `roleGuard` — autorização por papel (`ADMIN`, `SECRETARIA`, etc.)
- `descarteGuard` — evita perda de dados em formulários
- `authInterceptor` — injeta JWT e renova tokens transparentemente
- `apiInterceptor` — resolve URLs relativas
- `errorInterceptor` — centraliza feedback de erros HTTP
- `StorageService` — upload de arquivos

## Fluxo de Funcionamento

```
Login → JWT salvo em localStorage → authGuard libera /admin
                                         ↓
                                  roleGuard verifica role
                                         ↓
                              authInterceptor injeta Bearer token
                                         ↓
                              API retorna 401 (token expirado)
                                         ↓
                         authInterceptor chama /auth/refresh
                                         ↓
                    Novo access_token → request original é refeita
```

---

# 2. Arquitetura e Metodologias

## Padrões Arquiteturais Identificados

- **Service Layer** — `AuthService` como única fonte de verdade para sessão
- **Interceptor Pattern** — separação de responsabilidades entre 3 interceptors
- **RBAC declarativo** — roles definidos em `route.data.roles` no arquivo de rotas
- **Functional Guards** — guards como funções puras (`CanActivateFn`)
- **Concurrent Refresh** — `BehaviorSubject` coordena múltiplas requisições em espera
- **DTO Pattern** — interfaces tipadas para login, refresh, perfil e senha

## Justificativa Técnica

Separar `apiInterceptor`, `authInterceptor` e `errorInterceptor` aplica o Princípio
da Responsabilidade Única (SRP): cada interceptor resolve exatamente um problema.
A alternativa — um único interceptor grande — seria difícil de testar e manter.

O `BehaviorSubject` no refresh concorrente evita o "thundering herd": sem ele,
se 5 requests simultâneas receberem 401, o sistema dispararia 5 chamadas de refresh.
Com o `BehaviorSubject`, apenas a primeira dispara o refresh; as demais ficam na fila
e recebem o novo token quando ele chega.

---

# 3. Fluxo Interno do Código

## 3.1 Fluxo de Login

```
LoginComponent.onSubmit()
    ↓
AuthService.login({ username, senha })
    ↓
POST /api/auth/login
    ↓
Resposta: { access_token, refresh_token }
    ↓
localStorage.setItem('token_braille', access_token)
localStorage.setItem('refresh_braille', refresh_token)
    ↓
Router.navigate(['/admin/dashboard'])
```

## 3.2 Fluxo de Proteção de Rota

```
Usuário navega para /admin/alguma-rota
    ↓
authGuard.canActivate()
    ├── AuthService.isLoggedIn() → decodifica JWT, verifica exp
    ├── Se token expirado → toast + redirect /login
    ├── Se precisaTrocarSenha === true → logout + redirect /login
    └── Se OK → passa para roleGuard

roleGuard.canActivate()
    ├── Lê route.data.roles
    ├── Se roles não definido → libera acesso
    ├── Se user.role está em roles → libera acesso
    └── Se role não permitido → toast "Permissão Negada" + redirect /admin/dashboard
```

## 3.3 Fluxo do Refresh Token (Concorrente)

```
Request → authInterceptor injeta Bearer token
    ↓
API retorna 401
    ↓
É a rota /auth/refresh? → logout + redirect /login (protege loop infinito)
    ↓
Tem refresh token?
    ├── NÃO → logout + redirect /login
    └── SIM:
        ├── isRefreshing === true? → entra na fila (refreshTokenSubject.pipe(filter, take(1)))
        └── isRefreshing === false:
            ├── isRefreshing = true
            ├── refreshTokenSubject.next(null)  // congela a fila
            ├── POST /api/auth/refresh
            ├── Sucesso → isRefreshing = false, refreshTokenSubject.next(novo_token)
            │   └── Todas as requests na fila recebem o novo token e são refeitas
            └── Falha → isRefreshing = false, logout + redirect /login
```

## 3.4 Fluxo dos 3 Interceptors em Cadeia

```
HttpClient.get('/api/beneficiaries')
    ↓
[1] apiInterceptor
    └── /api/beneficiaries → https://braille-api-oieq.onrender.com/api/beneficiaries

[2] authInterceptor
    ├── É rota pública POST? (/auth/login, /contatos, /inscricoes) → não injeta token
    └── Tem token? → clone(setHeaders: { Authorization: 'Bearer <token>' })

[3] errorInterceptor
    ├── Sucesso → passa transparentemente
    ├── status === 0 → toast "Sistema fora do ar"
    ├── status === 403 → toast "Comando Proibido"
    └── status >= 500 → toast "Servidor falhou internamente"
```

---

# 4. Dicionário Técnico

## Variáveis

| Nome | Tipo | Onde | Descrição |
|---|---|---|---|
| `TOKEN_KEY` | `string` | `AuthService` | Chave `'token_braille'` usada no localStorage |
| `REFRESH_KEY` | `string` | `AuthService` | Chave `'refresh_braille'` usada no localStorage |
| `apiUrl` | `string` | `AuthService` | `'/api/auth'` — base de todos os endpoints de auth |
| `isRefreshing` | `boolean` | `authInterceptor` (módulo) | Flag global que evita refresh paralelo |
| `refreshTokenSubject` | `BehaviorSubject<string \| null>` | `authInterceptor` (módulo) | Coordena fila de requests durante o refresh |
| `publicPaths` | `string[]` | `authInterceptor` | Rotas HTTP POST que não recebem token JWT |

## Funções e Métodos

### `AuthService`

| Método | Parâmetros | Retorno | Descrição |
|---|---|---|---|
| `login()` | `{ username, senha }` | `Observable<AuthTokens>` | Autentica e salva tokens |
| `logout()` | — | `void` | Remove tokens do localStorage |
| `getToken()` | — | `string \| null` | Retorna access token |
| `getRefreshToken()` | — | `string \| null` | Retorna refresh token |
| `renovarToken()` | — | `Observable<AuthTokens>` | Chama `/auth/refresh` com userId + refreshToken |
| `isLoggedIn()` | — | `boolean` | Decodifica JWT e verifica `exp * 1000 > Date.now()` |
| `getUser()` | — | `UserInfo \| null` | Decodifica payload do JWT |
| `trocarSenha()` | `senhaAtual, novaSenha` | `Observable<{message}>` | PATCH `/auth/trocar-senha` |
| `getMe()` | — | `Observable<PerfilUsuario>` | GET `/auth/me` — perfil completo |
| `atualizarFoto()` | `fotoPerfil: string \| null` | `Observable<{message}>` | PATCH `/auth/foto-perfil` |
| `atualizarPerfil()` | `{ nome?, email? }` | `Observable<PerfilUsuario>` | PATCH `/auth/perfil` |
| `uploadFoto()` | `file: File` | `Observable<{url}>` | Delega para `StorageService.uploadGlobalImage()` |
| `decodeToken()` | `token: string` | `AuthTokenPayload \| null` | Decodifica Base64Url → JSON com tratamento de UTF-8 |
| `isUserInfo()` | `payload` | `boolean` | Type guard — valida que payload tem `sub`, `nome` e `role` válidos |

### Guards

| Guard | Quando bloqueia | Ação |
|---|---|---|
| `authGuard` | Token ausente ou expirado | toast + redirect `/login` |
| `authGuard` | `precisaTrocarSenha === true` | logout + toast + redirect `/login` |
| `roleGuard` | Role do usuário não está em `route.data.roles` | toast "Permissão Negada" + redirect `/admin/dashboard` |
| `descarteGuard` | Componente retorna `podeDescartar() === false` | Exibe diálogo de confirmação |

## Interfaces

```typescript
interface UserInfo {
  sub: string;          // ID do usuário (UUID)
  nome: string;         // Nome de exibição
  role: UsuarioRole;    // 'ADMIN' | 'SECRETARIA' | 'PROFESSOR' | 'COMUNICACAO'
  precisaTrocarSenha?: boolean;  // Flag de troca obrigatória
  sid?: string;         // Session ID (para invalidação de sessão no backend)
}

interface AuthTokens {
  access_token: string;
  refresh_token?: string;
}

interface PerfilUsuario {
  id: string;
  nome: string;
  username: string;
  email: string | null;
  role: UsuarioRole;
  fotoPerfil: string | null;
  statusAtivo: boolean;
  criadoEm: string;
}

interface ComponenteComDescarte {
  podeDescartar(): boolean | Promise<boolean>;
}
```

---

# 5. Serviços e Integrações

## Endpoints de Autenticação

| Método | Endpoint | Payload | Resposta | Quando |
|---|---|---|---|---|
| POST | `/api/auth/login` | `{ username, senha }` | `{ access_token, refresh_token }` | Login |
| POST | `/api/auth/refresh` | `{ userId, refreshToken }` | `{ access_token, refresh_token? }` | Token expirado |
| GET | `/api/auth/me` | — | `{ data: PerfilUsuario }` | Carregar perfil |
| PATCH | `/api/auth/trocar-senha` | `{ senhaAtual, novaSenha }` | `{ message }` | Troca de senha |
| PATCH | `/api/auth/foto-perfil` | `{ fotoPerfil: string \| null }` | `{ message }` | Atualizar foto |
| PATCH | `/api/auth/perfil` | `{ nome?, email? }` | `{ data: PerfilUsuario }` | Atualizar perfil |

---

# 6. Segurança e Qualidade

## Segurança

| Medida | Implementação |
|---|---|
| **Bearer token injetado centralmente** | `authInterceptor` — nenhum componente precisa gerenciar isso |
| **Refresh token com proteção de loop** | Verifica se a rota que falhou é `/auth/refresh` antes de tentar renovar |
| **Whitelist de rotas públicas** | `publicPaths` impede que token seja enviado em `POST /auth/login`, `/contatos`, `/inscricoes` |
| **Decodificação segura do JWT** | `decodeURIComponent + atob` com normalização Base64Url → previne crashes com caracteres UTF-8 |
| **Type guard `isUserInfo()`** | Valida campos obrigatórios antes de confiar no payload |
| **`precisaTrocarSenha` force-logout** | Impede acesso ao painel com senha padrão — fundamental para entrega institucional |

## Armazenamento (Risco Documentado)

O `access_token` e `refresh_token` são armazenados em **`localStorage`**.

| Risco | Mitigação implementada |
|---|---|
| XSS poderia roubar tokens | CSP rigorosa no `vercel.json` bloqueia scripts inline não autorizados |
| | DOMPurify sanitiza todo HTML do CMS antes de renderizar |
| | `SafeHtmlPipe` e `SafeUrlPipe` bloqueiam URLs maliciosas |

> **Alternativa (não implementada):** usar cookies `HttpOnly; Secure; SameSite=Strict` eliminaria
> o acesso via JavaScript. Requer mudança no backend para enviar/receber via cookie.

## Performance

- **Refresh concorrente com `BehaviorSubject`** — 1 refresh para N requests paralelas
- **Guards funcionais** — injeção de dependência sob demanda, sem overhead de classe
- **`isLoggedIn()` decodifica JWT localmente** — sem round-trip ao servidor para verificar autenticação

---

# 7. Regras de Negócio

1. **Usuário com `precisaTrocarSenha = true`** é impedido de acessar o painel — forçado a trocar a senha no login
2. **Role `PROFESSOR`** não aparece em nenhuma rota administrativa específica — acessa apenas dashboard e chamadas de turma
3. **Role `COMUNICACAO`** acessa conteúdo do site, comunicados e apoiadores
4. **Role `SECRETARIA`** acessa alunos, turmas, frequências, certificados e contatos
5. **Role `ADMIN`** acessa tudo — é o único com acesso a usuários e auditoria
6. **Sem roles definidos na rota** (`route.data.roles` vazio ou ausente) → todos os autenticados têm acesso
7. **Formulários com `descarteGuard`** exibem diálogo de confirmação antes de navegar para outra página

---

# 8. Pontos de Atenção

- `isRefreshing` e `refreshTokenSubject` são variáveis de **módulo** (fora da função do interceptor),
  não de instância. Isso significa que persistem durante toda a vida da aplicação — comportamento correto
  para coordenar concorrência, mas pode causar bug se o módulo for descarregado (improvável em SPA).
- O campo `username` **não existe no JWT** — o backend envia `nome`. Confundir os dois causava
  `getUser() === null` em todo login (bug corrigido, documentado em `isUserInfo()`).
- `trocarSenha()` usa `/auth/trocar-senha` (com traço) enquanto `getMe()` usa `/auth/me`.
  Confirmar sempre com o contrato da API do backend.

---

# 9. Relação com Outros Módulos

| Módulo | Relação |
|---|---|
| `AdminLayout` | Consome `AuthService.getUser()` e `getMe()` para exibir nome e foto |
| `HeaderComponent` | Dispara logout, troca de foto e troca de senha via `AuthService` |
| `BeneficiariosService`, todos os serviços | Dependem do token JWT injetado pelo `authInterceptor` |
| `ToastService` | Usado por guards e interceptors para feedback visual |
| `LiveAnnouncer` | Usado por guards e `authInterceptor` para anunciar mudanças para leitores de tela |

---

# 10. Resumo Técnico Final

| Item | Detalhe |
|---|---|
| **Função** | Autenticação, persistência de sessão, RBAC e renovação transparente de token |
| **Criticidade** | 🔴 Crítica — falha aqui desabilita todo o painel administrativo |
| **Complexidade** | Alta — concorrência no refresh, múltiplos guards, 3 interceptors encadeados |
| **Principais integrações** | Backend NestJS (`/api/auth/*`), Angular CDK (`LiveAnnouncer`) |
| **Risco principal** | Tokens em `localStorage` — mitigado por CSP e sanitização, mas risco residual de XSS |
| **Observação** | O campo `nome` no JWT (não `username`) é uma decisão do backend — nunca alterar `isUserInfo()` para validar `username` |

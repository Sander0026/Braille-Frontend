# Modulo: Autenticacao, Sessao e Autorizacao

---

# 1. Visao Geral

## Objetivo

Documentar o fluxo de login, persistencia de tokens, renovacao de sessao, leitura de usuario autenticado, protecao de rotas, autorizacao por papel e tratamento de erros HTTP relacionados a autenticacao.

## Responsabilidade

Este modulo e composto por `AuthService`, `authGuard`, `roleGuard`, `descarteGuard`, `authInterceptor`, `apiInterceptor`, `errorInterceptor`, `StorageService` e componentes de perfil/senha/foto do layout administrativo.

## Fluxo de Funcionamento

O usuario autentica em `/login`, o frontend chama `/api/auth/login`, armazena `access_token` e `refresh_token`, injeta o bearer token em chamadas protegidas, renova token em 401 e bloqueia rotas administrativas quando o token esta ausente, expirado, com troca de senha obrigatoria ou com papel incompatível.

---

# 2. Arquitetura e Metodologias

## Padroes Arquiteturais Identificados

* Service Layer para autenticacao.
* Functional guards do Angular.
* Interceptor pattern para JWT, refresh e erro global.
* RBAC no frontend por `route.data.roles`.
* DTO pattern para login, usuario, perfil e senha.
* Reactive pattern com RxJS `BehaviorSubject` no refresh token.
* Separation of concerns entre `apiInterceptor`, `authInterceptor` e `errorInterceptor`.

## Justificativa Tecnica

Separar guards de interceptadores evita misturar navegacao com transporte HTTP. O `authGuard` decide acesso a paginas, enquanto `authInterceptor` protege requisicoes. O `roleGuard` usa metadados de rota para RBAC declarativo. A renovacao coordenada com `BehaviorSubject` impede que varias chamadas 401 disparem refresh simultaneo.

---

# 3. Fluxo Interno do Codigo

## Fluxo de Execucao

1. Login recebe `username` e `senha`.
2. `AuthService.login` chama `POST /api/auth/login`.
3. Em sucesso, grava `token_braille` e `refresh_braille` em `localStorage`.
4. `authGuard` verifica `isLoggedIn()` por `exp` do JWT.
5. Se `precisaTrocarSenha` vier no token, faz logout, exibe toast, anuncia via `LiveAnnouncer` e redireciona para `/login`.
6. `roleGuard` le `route.data.roles`; se o papel do JWT nao estiver permitido, bloqueia e redireciona ao dashboard.
7. `apiInterceptor` converte URLs relativas iniciadas por `/api` para `environment.apiUrl`.
8. `authInterceptor` injeta `Authorization: Bearer <token>` nas chamadas nao publicas.
9. Em 401, se houver refresh token, chama `AuthService.renovarToken()`.
10. Durante refresh concorrente, chamadas aguardam `refreshTokenSubject`.
11. Se refresh falhar, faz logout, notifica e envia para `/login`.
12. `errorInterceptor` trata falhas 0, 403 e 5xx com mensagens globais.

## Dependencias Internas

* `AuthService`
* `StorageService`
* `ToastService`
* `ConfirmDialogService`
* `LiveAnnouncer`
* `Router`
* `ComponenteComDescarte`
* `BaseFormDescarte` e `injectFormDescarte`

## Dependencias Externas

* `@angular/common/http`
* `@angular/router`
* `@angular/core`
* `@angular/cdk/a11y`
* `rxjs`

---

# 4. Dicionario Tecnico

## Variaveis

* `apiUrl` em `AuthService`: `/api/auth`; raiz dos endpoints de autenticacao.
* `TOKEN_KEY`: `token_braille`; chave local do access token.
* `REFRESH_KEY`: `refresh_braille`; chave local do refresh token.
* `isRefreshing`: flag de modulo em `authInterceptor`; evita refresh paralelo.
* `refreshTokenSubject`: `BehaviorSubject<string | null>`; desbloqueia fila de requisicoes apos refresh.
* `publicPaths`: `['/auth/login', '/inscricoes', '/contatos']`; rotas HTTP POST que nao recebem token.
* `roles`: array em `route.data`; define autorizacao esperada por rota.

## Funcoes e Metodos

* `login(credenciais)`: autentica e persiste tokens.
* `logout()`: remove tokens.
* `getToken()`: retorna access token atual.
* `getRefreshToken()`: retorna refresh token atual.
* `renovarToken()`: envia `{ userId, refreshToken }` para `/refresh` e substitui access token.
* `isLoggedIn()`: decodifica JWT e compara `exp` com `Date.now()`.
* `getUser()`: decodifica payload do JWT em `UserInfo`.
* `trocarSenha(dto)`: troca senha do usuario autenticado.
* `getMe()`: busca perfil completo em `/me`.
* `atualizarFoto(url)`: atualiza foto do perfil.
* `atualizarPerfil(dto)`: atualiza dados cadastrais do perfil autenticado.
* `uploadFoto(file)`: delega upload ao `StorageService`.
* `authGuard(route,state)`: protege rotas autenticadas.
* `roleGuard(route,state)`: aplica RBAC por rota.
* `descarteGuard(component)`: chama `podeDescartar()` antes de sair de formularios.
* `addToken(req, token)`: clona request com header Authorization.

## Classes

* `AuthService`: fachada de sessao e perfil.
* `StorageService`: upload/delete de arquivos para API de upload.
* `BaseFormDescarte`: classe abstrata legada para protecao de formularios sujos.

## Interfaces e Tipagens

* `UserInfo`: `{ sub, username, nome?, role, precisaTrocarSenha? }`.
* `PerfilUsuario`: perfil completo do usuario logado.
* `ComponenteComDescarte`: contrato `podeDescartar(): boolean | Promise<boolean>`.
* DTOs de senha/perfil: objetos parciais enviados a `/me/senha`, `/me`, `/me/foto`.

---

# 5. Servicos e Integracoes

## APIs

* `POST /api/auth/login`: autentica usuario; payload `{ username, senha }`; resposta esperada `{ access_token, refresh_token }`.
* `POST /api/auth/refresh`: renova token; payload `{ userId, refreshToken }`.
* `PATCH /api/auth/me/senha`: troca senha.
* `GET /api/auth/me`: busca perfil autenticado.
* `PATCH /api/auth/me/foto`: atualiza URL de foto.
* `PATCH /api/auth/me`: atualiza perfil.
* `POST /api/upload`: upload global de imagem.
* `POST /api/upload/pdf?tipo=lgpd|atestado|laudo`: upload seguro de PDF.
* `DELETE /api/upload?url=<url>`: remove arquivo remoto.

## Banco de Dados

Nao acessa diretamente. O impacto no banco ocorre via backend de autenticacao, usuarios e upload.

## Servicos Externos

* Possivel Cloudinary ou storage remoto atras de `/api/upload`.
* Sentry captura erros globais quando configurado.

---

# 6. Seguranca e Qualidade

## Seguranca

* Bearer token e aplicado centralmente.
* Refresh token e usado apenas apos 401.
* Rotas admin exigem autenticacao e RBAC.
* Falha de permissao recebe feedback visual e audivel.
* `descarteGuard` evita perda acidental de dados sensiveis.
* `localStorage` simplifica persistencia, mas amplia risco em caso de XSS; sanitizacao e CSP sao essenciais.

## Qualidade

* Tratamento global de erros reduz duplicacao.
* `LiveAnnouncer` melhora comunicacao para leitores de tela.
* Interceptor de refresh reduz erros de corrida em expiracao simultanea.

## Performance

* Refresh concorrente compartilha resultado via `BehaviorSubject`.
* Guards funcionais usam injecao sob demanda.
* Interceptadores operam por clone imutavel de `HttpRequest`.

---

# 7. Regras de Negocio

* Usuario com token expirado nao acessa area admin.
* Usuario com `precisaTrocarSenha` e expulso da area admin para forcar fluxo de login/troca.
* Usuarios sem papel esperado nao acessam rotas restritas.
* Em tentativa negada dentro do dashboard/admin, o guard retorna `false` sem loop de navegacao.
* Chamadas publicas de contato/login nao devem receber Authorization.
* Formularios sujos pedem confirmacao antes de descarte.

---

# 8. Pontos de Atencao

* Tokens em `localStorage` sao vulneraveis a exfiltracao se XSS ocorrer.
* `AuthService.decodeToken` retorna `{}` em falha; consumidores devem tratar ausencia de campos.
* `publicPaths` foi revisado para reconhecer caminhos com e sem `/api`, reduzindo acoplamento com a ordem dos interceptadores.
* Mistura de roles `EDITOR` e `COMUNICACAO` foi corrigida na rota de apoiadores.
* `StorageService.deleteCloudFile` envia URL via query com `HttpParams`, preservando encoding de caracteres especiais.

---

# 9. Relacao com Outros Modulos

* `AdminLayout` consome `AuthService.getUser()` e `getMe()`.
* `HeaderComponent` emite acoes de perfil, foto, senha e sair.
* Modais de perfil/foto/senha chamam `AuthService`.
* Todas as paginas administrativas dependem de `authGuard` e, quando indicado, `roleGuard`.
* Formularios de alunos, turmas, usuarios e certificados usam `descarteGuard`.

---

# 10. Resumo Tecnico Final

O modulo de autenticacao e autorizacao e de criticidade alta. Ele controla acesso administrativo, sessao JWT, renovacao automatica, RBAC e feedback acessivel de erros. A complexidade e alta por concorrencia no refresh e pelo acoplamento com navegacao. Os riscos centrais sao persistencia em `localStorage`, divergencia de roles e necessidade de garantir sanitizacao forte em todo conteudo renderizado.

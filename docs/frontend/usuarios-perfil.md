# Modulo: Usuarios e Perfil Administrativo

---

# 1. Visao Geral

## Objetivo

Documentar a gestao de usuarios administrativos, cadastro assistido, papeis, CPF, reativacao, reset de senha, perfil logado, foto e troca de senha.

## Responsabilidade

Este modulo inclui `UsuariosService`, `UsuariosLista`, `CadastroUsuarioWizard`, modais de usuario, modais de perfil/foto/senha do `AdminLayout` e integracao com `AuthService`.

## Fluxo de Funcionamento

Administradores acessam `/admin/usuarios`, listam usuarios, filtram por nome/role/inativos, criam usuarios com CPF e cargo, recebem credenciais geradas pelo backend, reativam usuarios inativos, resetam senha, editam dados e gerenciam perfil/foto/senha do usuario logado.

---

# 2. Arquitetura e Metodologias

## Padroes Arquiteturais Identificados

* Service Layer para usuarios.
* Wizard pattern para cadastro.
* Modal pattern para formularios e perfil.
* RBAC por rota.
* Cache TTL em listagem.
* DTO pattern para criacao.
* Soft delete, restore e hard delete.
* Facade de upload via `StorageService`.

## Justificativa Tecnica

Usuarios impactam seguranca e autorizacao; separar servico e telas facilita auditoria. O backend gera credenciais, reduzindo regra sensivel no frontend. O wizard reduz erro de preenchimento em cadastro. Cache melhora listagem, mas e invalidado em mutacoes.

---

# 3. Fluxo Interno do Codigo

## Fluxo de Execucao

1. Usuario ADMIN acessa `/admin/usuarios`.
2. `UsuariosService.listar` consulta `/api/users` com filtros e cache.
3. Cadastro chama `verificarCpf` para detectar duplicidade.
4. `criar` envia `CreateUsuarioDto`.
5. Backend retorna usuario com `_credenciais` ou `_reativacao`.
6. Se reativacao for solicitada, `reativar(id)` gera nova senha padrao.
7. Edicao chama `atualizar`.
8. Inativacao/restauracao/exclusao definitiva limpam cache.
9. Reset de senha chama `resetarSenha`.
10. Perfil logado e manipulado por `AuthService.getMe`, `atualizarPerfil`, `atualizarFoto`, `trocarSenha`.

## Dependencias Internas

* `UsuariosService`
* `AuthService`
* `StorageService`
* `ConfirmDialogService`
* `ToastService`
* `senhaForteValidator`
* pipes/mascaras de CPF, telefone e CEP
* `descarteGuard`

## Dependencias Externas

* Angular Forms.
* Angular Router.
* Angular HttpClient.
* RxJS.

---

# 4. Dicionario Tecnico

## Variaveis

* `Usuario.id`: identificador.
* `nome`: nome exibido e oficial.
* `username`: login.
* `email`, `telefone`: contato.
* `cpf`: documento de deduplicacao.
* `matricula`: codigo interno.
* `role`: `ADMIN|SECRETARIA|PROFESSOR|COMUNICACAO`.
* `fotoPerfil`: imagem do usuario.
* `precisaTrocarSenha`: obriga troca no fluxo de autenticacao.
* `statusAtivo`: ativo/inativo.
* `CreateUsuarioDto`: payload de criacao.
* `_credenciais`: username, senha e instrucao gerados pelo backend.
* `_reativacao`: marcador de usuario inativo existente.
* `cache`: cache de listagem por chave.
* `cacheTimeMs`: 2 minutos.

## Funcoes e Metodos

* `verificarCpf(cpf)`: consulta duplicidade.
* `listar(page,limit,nome,inativos,role)`: lista usuarios.
* `criar(dados)`: cria ou retorna reativacao.
* `reativar(id)`: reativa e gera credenciais.
* `atualizar(id,dados)`: edita usuario.
* `excluir(id)`: inativa.
* `resetarSenha(id)`: redefine senha.
* `restaurar(id)`: restaura.
* `excluirDefinitivo(id)`: hard delete.
* `uploadFoto(file)`: envia foto.
* `AuthService.trocarSenha`: troca senha do usuario logado.
* `AuthService.getMe`: carrega perfil.

## Classes

* `UsuariosService`: API/cache de usuarios.
* `UsuariosLista`: listagem e acoes.
* `CadastroUsuarioWizard`: cadastro guiado.
* `UsuarioFormModalComponent`: formulario modal.
* `UsuarioPerfilModalComponent`: detalhe/perfil.
* `ModalPerfilComponent`: perfil do usuario logado.
* `ModalFotoComponent`: foto do usuario logado.
* `ModalSenhaComponent`: troca de senha.

## Interfaces e Tipagens

* `Usuario`
* `ReativacaoResponse`
* `CredenciaisGeradas`
* `CreateUsuarioResponse`
* `CreateUsuarioDto`
* `PerfilUsuario`
* `UserInfo`

---

# 5. Servicos e Integracoes

## APIs

* `GET /api/users/check-cpf`
* `GET /api/users`
* `POST /api/users`
* `POST /api/users/:id/reativar`
* `PATCH /api/users/:id`
* `DELETE /api/users/:id`
* `PATCH /api/users/:id/reset-password`
* `PATCH /api/users/:id/restore`
* `DELETE /api/users/:id/hard`
* `POST /api/upload`
* `GET /api/auth/me`
* `PATCH /api/auth/me`
* `PATCH /api/auth/me/foto`
* `PATCH /api/auth/me/senha`

## Banco de Dados

Entidade refletida: usuarios administrativos com papeis, status, credenciais, perfil, foto e endereco.

## Servicos Externos

* Storage remoto para foto de perfil via `/api/upload`.

---

# 6. Seguranca e Qualidade

## Seguranca

* Rota `/admin/usuarios` restrita a ADMIN.
* Backend gera credenciais e senha padrao.
* Reset de senha e reativacao sao acoes administrativas.
* `senhaForteValidator` protege troca de senha.
* `precisaTrocarSenha` e respeitado pelo `authGuard`.

## Qualidade

* Existe spec para listagem e formulario modal.
* Cache e invalidado em mutacoes.
* DTO reduz campos aceitos na criacao.
* Interfaces explicitam roles validas.

## Performance

* Listagem usa cache com `shareReplay(1)`.
* Upload de foto e delegado.
* Lazy loading evita custo antes do uso admin.

---

# 7. Regras de Negocio

* Somente ADMIN gerencia usuarios.
* CPF duplicado ativo impede novo cadastro.
* CPF duplicado inativo aciona fluxo de reativacao.
* Criacao gera credenciais automaticas.
* Reset de senha deve produzir novo estado de troca obrigatoria conforme backend.
* Usuarios possuem papeis que controlam menu e rotas.

---

# 8. Pontos de Atencao

* Credenciais geradas devem ser exibidas com cuidado para nao vazar em logs ou screenshots.
* Role `COMUNICACAO` deve estar sincronizada com rotas.
* Hard delete de usuarios pode afetar auditoria/historico se backend nao preservar referencias.
* `CreateUsuarioDto.role` usa union compartilhada `UsuarioRole`, reduzindo envio de papeis invalidos pelo frontend.

---

# 9. Relacao com Outros Modulos

* `AdminLayout` exibe perfil do usuario.
* `roleGuard` usa role do JWT.
* Turmas usam professores.
* Auditoria referencia `autorId`, `autorNome` e `autorRole`.
* Dashboard agrega membros da equipe.

---

# 10. Resumo Tecnico Final

Usuarios e perfil formam modulo de criticidade alta por controlar acesso e identidade. A complexidade e media-alta, com cache, wizard, credenciais, roles e perfil logado. A arquitetura e adequada, mas recomenda-se reforcar tipagem de roles e cuidado operacional com exibicao de credenciais.

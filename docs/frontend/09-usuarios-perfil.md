# Módulo: Usuários e Perfil Administrativo

---

# 1. Visão Geral

## Objetivo

Gerenciar os usuários do painel administrativo (funcionários e professores do Instituto)
e o perfil do usuário autenticado (foto, nome, senha).

## Responsabilidade

Dois sub-domínios: **Usuários** (gestão de contas pela ADMIN) e **Perfil** (auto-gerenciamento
pelo próprio usuário autenticado via header do AdminLayout).

---

# 2. Gestão de Usuários (`/admin/usuarios`)

**Acesso:** apenas `ADMIN`

## 2.1 `UsuariosLista` — Listagem

**Arquivo:** `src/app/pages/admin/usuarios/usuarios-lista/`

### Funcionalidades
- Lista paginada de funcionários com filtro por nome, role, status
- Ações: editar, inativar, restaurar, excluir definitivamente, resetar senha
- Visualização de role com badge colorido por tipo
- Alerta de reativação: quando CPF já existe como inativo

### Roles disponíveis

| Role | Descrição |
|---|---|
| `ADMIN` | Acesso total ao sistema |
| `SECRETARIA` | Alunos, turmas, frequências, documentos |
| `PROFESSOR` | Apenas lançamento de chamada |
| `COMUNICACAO` | Comunicados, apoiadores, conteúdo do site |

## 2.2 `CadastroUsuarioWizard` — Wizard de Cadastro

**Arquivo:** `src/app/pages/admin/usuarios/cadastro-usuario-wizard/`
**Rota:** `/admin/usuarios/cadastro`

### Passos do wizard

| Passo | Campos |
|---|---|
| 1. Dados | Nome, username, CPF, role, email |
| 2. Senha | Senha temporária (gerada ou manual) |
| 3. Confirmação | Revisão antes de salvar |

### Fluxo de Reativação

Idêntico ao de beneficiários: se CPF já existe como inativo, sistema oferece reativação.
`POST /api/users/:id/reativar` → gera nova senha temporária e define `precisaTrocarSenha: true`.

### Reset de Senha

`PATCH /api/users/:id/reset-password` → redefine para senha padrão do ambiente
e ativa `precisaTrocarSenha: true`. No próximo login, o usuário é forçado a trocar.

---

# 3. Perfil do Usuário Autenticado

Gerenciado diretamente pelo `AdminLayout` via modais no header — sem rota separada.

## 3.1 Modal de Perfil

- Campos: `nome`, `email`
- Chama `AuthService.atualizarPerfil({ nome, email })`
- `PATCH /api/auth/perfil`

## 3.2 Modal de Foto

- Upload de imagem via `AuthService.uploadFoto(file)` → `StorageService.uploadGlobalImage()`
- `POST /api/upload` → URL Cloudinary retornada
- `PATCH /api/auth/foto-perfil` → salva a nova URL no perfil
- Preview antes de confirmar

## 3.3 Modal de Troca de Senha

- Campos: `senhaAtual`, `novaSenha`, `confirmarNovaSenha`
- `senhaForteValidator` aplicado em `novaSenha`
- `PATCH /api/auth/trocar-senha`
- Obrigatório no primeiro login (`precisaTrocarSenha: true`)

---

# 4. Segurança e Qualidade

## Segurança

- **Apenas ADMIN** acessa `/admin/usuarios`
- **Qualquer usuário autenticado** pode editar seu próprio perfil/foto/senha
- **Reset de senha** sempre ativa `precisaTrocarSenha: true` — nunca expõe senha em texto claro
- **Senha padrão** vem do ambiente do backend (`SENHA_PADRAO`) — nunca hardcoded no frontend
- **CPF mascarado** no log de auditoria via `audit-diff.util`

## Qualidade

- `descarteGuard` no wizard de cadastro
- Validação de CPF antes de submeter → chama `/api/users/check-cpf`
- Feedback específico por erro do formulário (`senhaForteValidator`)

---

# 5. Pontos de Atenção

- **Usuário não pode se auto-excluir** — validação no backend, mas o botão deve ser desabilitado
  visualmente para o próprio usuário logado (UX).
- **`precisaTrocarSenha`** é lido do JWT — após resetar a senha de outro usuário,
  a sessão atual daquele usuário é encerrada no próximo request protegido.

---

# 6. Relação com Outros Módulos

| Módulo | Relação |
|---|---|
| `UsuariosService` | Toda comunicação com `/api/users` |
| `AuthService` | Perfil, foto e senha do usuário autenticado |
| `StorageService` | Upload de foto de perfil |
| `authGuard` | Detecta `precisaTrocarSenha` e força logout |
| `senhaForteValidator` | Validação de senha nos modais |
| `descarteGuard` | Proteção do wizard de cadastro |

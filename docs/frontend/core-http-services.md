# Módulo: Serviços HTTP e Integrações de API

---

# 1. Visão Geral

## Objetivo

Mapear todos os 19 serviços frontend que comunicam com a API REST, seus contratos TypeScript,
estratégias de cache, endpoints, regras de invalidação e padrões de upload.

## Responsabilidade

Os serviços em `src/app/core/services/` e em services locais de páginas funcionam como a
**camada de acesso a dados** do frontend. Eles isolam completamente os componentes de detalhes
de URL, DTOs, `HttpParams`, uploads, paginação e cache.

## Fluxo de Funcionamento

```
Componente injeta serviço
    ↓
Serviço monta params/payload
    ↓
Verifica cache (Map + TTL) — se válido, retorna Observable do cache
    ↓
Se não: HttpClient → apiInterceptor (base URL) → authInterceptor (JWT)
    ↓
API responde → serviço mapeia/normaliza → retorna Observable tipado
    ↓
Mutações chamam limparCache() → próxima leitura vai à API
```

---

# 2. Arquitetura e Metodologias

## Padrões Identificados

- **Service Layer** — componentes nunca chamam `HttpClient` diretamente
- **Cache Aside** — `Map` com TTL em ms; `shareReplay(1)` para Observables ativos
- **Facade Pattern** — `StorageService` abstrai upload/delete de qualquer provider
- **Adapter Pattern** — normaliza `{ success, data, message }` extraindo `data`
- **DTO Pattern** — interfaces tipadas para cada payload enviado e recebido
- **Repository-like** — métodos `listar`, `buscarPorId`, `criar`, `atualizar`, `excluir` padronizados

## Justificativa Técnica

Centralizar HTTP em serviços com `providedIn: 'root'` garante uma única instância por
serviço na aplicação, evitando cache duplicado. O cache com TTL reduz chamadas repetidas
em listagens administrativas sem introduzir estado global complexo como NgRx.

---

# 3. Catálogo Completo de Serviços

## 3.1 `AuthService` — Autenticação e Sessão

Ver documentação detalhada em [auth-session-guards.md](./auth-session-guards.md).

## 3.2 `StorageService` — Upload e Delete de Arquivos

Facade SRP focada exclusivamente em I/O de arquivos binários com a CDN/storage.

```typescript
// Upload de imagem global (fotos de perfil, logos de apoiadores, conteúdo)
uploadGlobalImage(file: File): Observable<{ url: string }>
  POST /api/upload   FormData{ file }

// Upload seguro de PDF com tipo explícito (controle de pasta no backend)
uploadSecurePdf(file: File, tipo: 'lgpd' | 'atestado' | 'laudo'): Observable<{ url: string }>
  POST /api/upload/pdf?tipo=lgpd|atestado|laudo   FormData{ file }

// Delete de arquivo remoto (Cloudinary ou S3)
deleteCloudFile(urlArquivo: string): Observable<void>
  DELETE /api/upload?url=<url>
```

## 3.3 `BeneficiariosService` — Alunos/Beneficiários

Serviço mais complexo do sistema. Suporta CRUD completo, paginação com filtros dinâmicos,
importação de planilha, exportação Excel, upload de documentos e validação de duplicidade.

**Cache:** `Map` com TTL de 2 minutos; invalidado em toda mutação.

| Método | Endpoint | Descrição |
|---|---|---|
| `listar(params)` | `GET /api/beneficiaries` | Paginação com filtros: `busca`, `inativos`, `deficiencias`, `status`, `turmaId` |
| `buscarPorId(id)` | `GET /api/beneficiaries/:id` | Detalhe completo |
| `verificarCpfRg(cpf?, rg?)` | `GET /api/beneficiaries/check-cpf-rg` | Retorna `livre`, `ativo` ou `inativo` |
| `criar(dto)` | `POST /api/beneficiaries` | Cria ou retorna sugestão de reativação |
| `atualizar(id, dto)` | `PATCH /api/beneficiaries/:id` | Atualização parcial |
| `inativar(id)` | `DELETE /api/beneficiaries/:id` | Exclusão lógica |
| `restaurar(id)` | `PATCH /api/beneficiaries/:id/restore` | Reativa aluno inativo |
| `excluirDefinitivamente(id)` | `DELETE /api/beneficiaries/:id/hard` | Exclusão física (ADMIN) |
| `reativar(id, dto)` | `POST /api/beneficiaries/:id/reactivate` | Reativa com nova matrícula |
| `exportarLista(params)` | `GET /api/beneficiaries/export` | Retorna `ArrayBuffer` (Excel) |
| `importar(file)` | `POST /api/beneficiaries/import` | Upload de planilha |
| `uploadDocumento(id, file, tipo)` | `POST /api/upload/pdf?tipo=lgpd` | PDF via StorageService |

**Interfaces principais:**
```typescript
interface Beneficiario { id, nomeCompleto, matricula, cpf, rg, dataNascimento,
  email, telefone, status, deficiencias, endereco, turmas, fotoPerfil, ... }
interface PaginatedResponse<T> { data: T[], total: number, page: number, limit: number }
```

## 3.4 `TurmasService` — Turmas e Matrículas

**Cache:** `Map` com TTL de 1 minuto.

| Método | Endpoint | Descrição |
|---|---|---|
| `listar(params)` | `GET /api/turmas` | Filtros: `status`, `professorId`, `incluirExcluidas`, `busca` |
| `buscarPorId(id)` | `GET /api/turmas/:id` | Detalhe com alunos e horários |
| `getProfessoresAtivos()` | `GET /api/turmas/professores-ativos` | Lista de professores para dropdown |
| `getAlunosDisponiveis(turmaId)` | `GET /api/turmas/:turmaId/alunos-disponiveis` | Alunos sem matrícula na turma |
| `criar(dto)` | `POST /api/turmas` | Nova turma com grade horária |
| `atualizar(id, dto)` | `PATCH /api/turmas/:id` | Atualiza dados da turma |
| `arquivar(id)` | `DELETE /api/turmas/:id` | Exclusão lógica |
| `restaurar(id)` | `PATCH /api/turmas/:id/restaurar` | Reativa turma arquivada |
| `ocultar(id)` | `PATCH /api/turmas/:id/ocultar` | Oculta da listagem |
| `matricular(turmaId, alunoId)` | `POST /api/turmas/:turmaId/alunos/:alunoId` | Adiciona aluno |
| `desmatricular(turmaId, alunoId)` | `DELETE /api/turmas/:turmaId/alunos/:alunoId` | Remove aluno |
| `mudarStatus(id, status)` | `PATCH /api/turmas/:id/status` | Muda para PREVISTA/ANDAMENTO/CONCLUIDA |
| `cancelar(id)` | `PATCH /api/turmas/:id/cancelar` | Status CANCELADA |
| `concluir(id)` | `PATCH /api/turmas/:id/concluir` | Status CONCLUIDA |

**Status possíveis:** `PREVISTA` → `ANDAMENTO` → `CONCLUIDA` ou `CANCELADA`

## 3.5 `FrequenciasService` — Chamadas e Frequências

**Cache:** `resumoCache` com TTL de 5 minutos para o endpoint de resumo.

| Método | Endpoint | Descrição |
|---|---|---|
| `listar(params)` | `GET /api/frequencias` | Registros individuais |
| `getResumo(turmaId, dataAula)` | `GET /api/frequencias/resumo` | Resumo de chamada do dia |
| `getRelatorioAluno(turmaId, alunoId)` | `GET /api/frequencias/relatorio/turma/:id/aluno/:id` | Relatório individual |
| `registrar(dto)` | `POST /api/frequencias` | Registro individual |
| `atualizar(id, dto)` | `PATCH /api/frequencias/:id` | Correção de presença |
| `salvarLote(registros)` | `POST /api/frequencias/lote` | Chamada completa em lote |
| `excluir(id)` | `DELETE /api/frequencias/:id` | Remove registro |
| `fecharDiario(turmaId, data)` | `POST /api/frequencias/diario/fechar/:turmaId/:data` | Fecha chamada |
| `reabrirDiario(turmaId, data)` | `POST /api/frequencias/diario/reabrir/:turmaId/:data` | Reabre chamada |

## 3.6 `UsuariosService` — Usuários Administrativos

**Cache:** `Map` com TTL de 2 minutos.

| Método | Endpoint | Descrição |
|---|---|---|
| `verificarCpf(cpf)` | `GET /api/users/check-cpf` | Verifica se CPF é `livre`, `ativo` ou `inativo` |
| `listar(params)` | `GET /api/users` | Lista paginada |
| `criar(dto)` | `POST /api/users` | Cria usuário ou retorna sugestão de reativação |
| `reativar(id)` | `POST /api/users/:id/reativar` | Reativa e gera nova senha temporária |
| `atualizar(id, dto)` | `PATCH /api/users/:id` | Atualização parcial |
| `inativar(id)` | `DELETE /api/users/:id` | Exclusão lógica |
| `resetarSenha(id)` | `PATCH /api/users/:id/reset-password` | Reseta senha para padrão |
| `restaurar(id)` | `PATCH /api/users/:id/restore` | Reativa usuário |
| `excluirDefinitivamente(id)` | `DELETE /api/users/:id/hard` | Exclusão física (ADMIN) |

## 3.7 `AtestadosService` — Atestados Médicos

| Método | Endpoint | Descrição |
|---|---|---|
| `criar(alunoId, dto)` | `POST /api/alunos/:alunoId/atestados` | Cria atestado |
| `listarPorAluno(alunoId)` | `GET /api/alunos/:alunoId/atestados` | Lista atestados do aluno |
| `getPreview(alunoId, dto)` | `GET /api/alunos/:alunoId/atestados/preview` | Preview de faltas justificáveis |
| `buscarPorId(id)` | `GET /api/atestados/:id` | Detalhe |
| `atualizar(id, dto)` | `PATCH /api/atestados/:id` | Atualiza |
| `excluir(id)` | `DELETE /api/atestados/:id` | Remove |

## 3.8 `LaudosService` — Laudos Médicos

| Método | Endpoint | Descrição |
|---|---|---|
| `listarPorAluno(alunoId)` | `GET /api/alunos/:alunoId/laudos` | Lista laudos |
| `criar(alunoId, formData)` | `POST /api/alunos/:alunoId/laudos` | Cria laudo (com PDF) |
| `atualizar(id, dto)` | `PATCH /api/laudos/:id` | Atualiza |
| `excluir(id)` | `DELETE /api/laudos/:id` | Remove |

## 3.9 `AuditLogService` — Auditoria

**Cache:** `listarCache` (1 min) e `statsCache` (5 min).

| Método | Endpoint | Descrição |
|---|---|---|
| `listar(params)` | `GET /api/audit-log` | Lista com filtros: acao, entidade, usuarioId |
| `getStats()` | `GET /api/audit-log/stats` | Estatísticas de auditoria |
| `getHistorico(entidade, registroId)` | `GET /api/audit-log/:entidade/:registroId` | Histórico de um registro |

## 3.10 `ComunicadosService` — Notícias e Comunicados

| Método | Endpoint | Descrição |
|---|---|---|
| `listar(params)` | `GET /api/comunicados` | Lista com `HttpParams` (encoding seguro) |
| `criar(dto)` | `POST /api/comunicados` | Cria comunicado |
| `buscarPorId(id)` | `GET /api/comunicados/:id` | Detalhe |
| `atualizar(id, dto)` | `PATCH /api/comunicados/:id` | Atualiza |
| `excluir(id)` | `DELETE /api/comunicados/:id` | Remove |

## 3.11 `ContatosService` — Fale Conosco (Admin)

| Método | Endpoint | Descrição |
|---|---|---|
| `listar(params)` | `GET /api/contatos` | Lista mensagens recebidas |
| `buscarPorId(id)` | `GET /api/contatos/:id` | Detalhe |
| `marcarComoLida(id)` | `PATCH /api/contatos/:id/lida` | Marca como lida |
| `excluir(id)` | `DELETE /api/contatos/:id` | Remove |

## 3.12 `DashboardService` — Estatísticas Gerais

**Cache:** TTL de 5 minutos. Invalidado quando `BeneficiariosService.limparCache()` é chamado.

```typescript
getStats(): Observable<DashboardStats>   GET /api/dashboard/stats
```

## 3.13 `ModelosCertificadosService` — Modelos e Emissão

| Método | Endpoint | Descrição |
|---|---|---|
| `listar()` | `GET /api/modelos-certificados` | Lista modelos |
| `criar(formData)` | `POST /api/modelos-certificados` | Cria com `FormData` (imagem de fundo) |
| `atualizar(id, dto)` | `PATCH /api/modelos-certificados/:id` | Atualiza modelo |
| `excluir(id)` | `DELETE /api/modelos-certificados/:id` | Remove |
| `validarAutenticidade(codigo)` | `GET /api/certificados/validar/:codigo` | Valida certificado público |
| `gerarTeste(id)` | `POST /api/modelos-certificados/teste` | Gera PDF de teste (Blob) |
| `emitirAcademico(dto)` | `POST /api/modelos-certificados/emitir-academico` | Emite certificado acadêmico |

## 3.14 `SiteConfigService` — CMS e Configurações

| Método | Endpoint | Descrição |
|---|---|---|
| `getConfig()` | `GET /api/site-config` | Configurações globais do site |
| `salvarConfig(dto)` | `PATCH /api/site-config` | Atualiza configurações |
| `getSecoes()` | `GET /api/site-config/secoes` | Seções públicas do site |
| `salvarSecao(secao, dto)` | `PATCH /api/site-config/secoes/:secao` | Atualiza seção |
| `aplicarCorPrimaria(cor)` | — | Aplica variável CSS `--cor-primaria` no documento |

## 3.15 `HotkeysService` — Atalhos de Teclado

Serviço `root` que gerencia atalhos globais de teclado com `Alt+Shift` como prefixo de segurança
(protege contra conflitos com atalhos nativos do browser).

**Atalhos registrados por padrão:**

| Combo | Ação |
|---|---|
| `Alt+Shift+N` | Navega para `/admin/alunos/cadastro` |
| `Alt+Shift+O` | Navega para `/admin/turmas` |
| `Alt+Shift+F` | Navega para `/admin/frequencias` |
| `Alt+Shift+H` | Emite `onHelpRequested$` (abre modal de ajuda) |
| `Alt+Shift+D` | Navega para `/admin/dashboard` |

**Eventos públicos:**
- `onHelpRequested$: Subject<void>` — ativado por `Alt+Shift+H`
- `onNovoAlunoRequested$: Subject<void>` — para abrir modal de novo aluno sem navegar

Desabilitado automaticamente quando o foco está em `input`, `textarea`, `select` ou elemento `contenteditable`.

## 3.16 `ToastService` — Notificações Visuais + Acessibilidade

Serviço de notificações baseado em **Angular Signals** com anúncio automático via `LiveAnnouncer`.

```typescript
sucesso(mensagem: string): void   // Toast verde, 6s, aria: 'polite'
erro(mensagem: string): void      // Toast vermelho, 8s, aria: 'assertive'
aviso(mensagem: string): void     // Toast amarelo, 6s, aria: 'polite'
info(mensagem: string): void      // Toast azul, 6s, aria: 'polite'
remover(id: number): void         // Remove manualmente por ID
```

O `mostrar()` usa `NgZone.runOutsideAngular()` para o `setTimeout` de auto-remoção —
evita ciclos desnecessários de Change Detection.

## 3.17 `AccessibilityService` — Preferências de Acessibilidade

Gerencia preferências persistidas em `localStorage`: alto contraste, tamanho de fonte, animações.

## 3.18 `ConfirmDialogService` — Diálogo de Confirmação

Signal-based. Exibe modal de confirmação com callbacks de sucesso/cancelamento.
Utilizado pelo `descarteGuard` e em todas as ações destrutivas (excluir, inativar).

## 3.19 `ContatoService` (público) — Envio de Formulário

Serviço local da página pública `contato`. **Rota pública** — não envia JWT.

```typescript
enviar(payload: ContatoPayload): Observable<void>
  POST /api/contatos   { nome, email, telefone, mensagem }
```

---

# 4. Padrões de Cache

| Tipo | Implementação | Invalidação |
|---|---|---|
| TTL com Map | `Map<string, { data, expiresAt }>` | `limparCache()` após mutações |
| shareReplay | `shareReplay(1)` | Encerramento do Observable |
| Cache único | Objeto simples `resumoCache` | Após salvar chamada em lote |

**Exemplo de padrão TTL:**
```typescript
private cache = new Map<string, { data: any; expiresAt: number }>();

listar(params): Observable<T> {
  const key = JSON.stringify(params);
  const cached = this.cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return of(cached.data);
  }
  return this.http.get<T>('/api/recurso', { params }).pipe(
    tap(data => this.cache.set(key, { data, expiresAt: Date.now() + 120_000 }))
  );
}
```

---

# 5. Segurança e Qualidade

## Segurança

- `HttpParams` em vez de concatenação de string → previne injeção em query strings
- `FormData` para uploads → nunca serializa conteúdo binário manualmente
- `StorageService` como única facade de upload → controle centralizado de tipos permitidos
- Rotas públicas de `POST` na whitelist do `authInterceptor` → não enviam JWT por engano

## Performance

- Cache com TTL evita re-fetching em navegação entre páginas
- `shareReplay(1)` compartilha resultado entre múltiplos assinantes no mesmo tick
- `exportarLista` usa `responseType: 'arraybuffer'` → download direto sem base64

## Débito Técnico

- `DashboardService.getStats()` tem apenas TTL — não é invalidado automaticamente quando
  `TurmasService` ou `UsuariosService` fazem mutações. Apenas `BeneficiariosService.limparCache()` o invalida.
- Alguns serviços (ex: `LaudosService`) não têm cache — aceitável dado o volume baixo de dados.

---

# 6. Regras de Negócio

1. **CPF/RG/CPF de usuário** podem retornar `livre` (pode criar), `ativo` (já existe) ou `inativo` (reativação)
2. **Alunos e usuários** suportam exclusão lógica → restauração → exclusão física (apenas ADMIN)
3. **Turmas** têm máquina de estados: `PREVISTA → ANDAMENTO → CONCLUIDA | CANCELADA`
4. **Diário de frequência** pode ser fechado (imutável) e reaberto (ADMIN)
5. **Atestados** justificam faltas dentro de um período — período definido no DTO
6. **Certificados** têm validação pública por código único — acessível sem autenticação
7. **Upload de PDF** exige `tipo` explícito → backend segrega por pasta (lgpd, atestado, laudo)

---

# 7. Relação com Outros Módulos

| Módulo | Relação |
|---|---|
| `apiInterceptor` | Resolve `/api/*` → URL absoluta da API |
| `authInterceptor` | Injeta JWT em todas as chamadas (exceto whitelist) |
| `errorInterceptor` | Trata erros 0, 403, 5xx globalmente |
| `StorageService` | Usado por `AuthService`, `BeneficiariosService`, `ApoiadoresService` |
| `DashboardService` | Invalidado por `BeneficiariosService.limparCache()` |
| Componentes de listagem | Consomem serviços via `inject()` e assinam Observables |

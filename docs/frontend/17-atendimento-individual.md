# Módulo: Atendimento Individual

---

# 1. Visão Geral

## Objetivo

Centralizar o registro, acompanhamento e rastreamento de atendimentos pedagógicos individuais entre professor e aluno, fora do contexto de turmas. O módulo permite criar acompanhamentos vinculados a um aluno, registrar atendimentos com tipo, modalidade, observações e evolução, além de finalizar, arquivar e gerar relatórios.

## Responsabilidade

O módulo `atendimentos-individuais` centraliza:

- criação e gestão de acompanhamentos individuais;
- registro de atendimentos (realizados, faltas justificadas, faltas não justificadas, cancelados);
- histórico/timeline por acompanhamento;
- ações de modificar assunto, finalizar, arquivar, desarquivar e reabrir;
- geração de relatório com exportação PDF;
- dashboard administrativo com indicadores consolidados;
- upload de arquivos vinculados a atendimentos.

## Fluxo de Funcionamento

```
Usuário acessa /admin/atendimentos-individuais
    ↓
[Home] exibe contadores (em andamento, finalizados, arquivados, alunos)
    ↓
[Botão "Novo acompanhamento"] → abre CriarAcompanhamentoModalComponent
    ↓
Passo 1: seleciona aluno (AlunoAutocompleteComponent)
Passo 2: informa assunto + seleciona professor (admin/secretaria)
Passo 3: revisão e confirmação (verificação de duplicidade)
    ↓
POST /api/atendimentos-individuais/acompanhamentos
    ↓
Retorna para home com contador atualizado localmente
    ↓
[Card do acompanhamento] → navega para /admin/atendimentos-individuais/:id
    ↓
[Detalhe] exibe resumo, status, timeline e ações disponíveis
    ↓
[Ações no detalhe]: Novo atendimento | Modificar assunto | Finalizar | Arquivar | Relatório
```

---

# 2. Arquitetura e Metodologias

- **Componentes standalone**: todas as páginas e componentes usam `standalone: true`.
- **Angular Signals**: estado reativo com `signal()` e `computed()` em vez de `BehaviorSubject`.
- **Service layer separado**: três services HTTP com responsabilidades distintas.
- **Modais reutilizáveis**: `CriarAcompanhamentoModalComponent` e `NovoAtendimentoModalComponent` são usados em múltiplas telas.
- **Formulários template-driven**: `FormsModule` com verificação manual de `dirty`/`touched`.
- **Validação de descarte**: `ConfirmDialogService` bloqueia fechamento de modal quando o formulário foi tocado e não foi salvo.
- **descarteGuard**: rota `:id` aplica `canDeactivate: [descarteGuard]` — o componente implementa `ComponenteComDescarte`.
- **Lazy loading**: feature carregada sob demanda via rota pai no `app.routes.ts`.
- **Guard de permissão**: `atendimentoIndividualPermissionGuard` bloqueia acesso por role.
- **Trap de foco**: todos os modais implementam `trapFocus()` manual via Tab e `@HostListener('document:keydown.escape')`.
- **Atualizações locais**: após criar/editar/arquivar, o estado é atualizado localmente sem recarregar a página.

---

# 3. Rotas e Navegação

Rota base registrada no `app.routes.ts`:

```
/admin/atendimentos-individuais
```

Rotas internas (`atendimentos-individuais.routes.ts`):

| Rota | Componente | Perfis |
|---|---|---|
| `` (index) | `AtendimentoIndividualHomeComponent` | ADMIN, SECRETARIA, PROFESSOR |
| `dashboard` | `DashboardAtendimentoComponent` | ADMIN, SECRETARIA |
| `em-andamento` | `AcompanhamentosEmAndamentoComponent` | ADMIN, SECRETARIA, PROFESSOR |
| `finalizados` | `AcompanhamentosFinalizadosComponent` | ADMIN, SECRETARIA, PROFESSOR |
| `arquivados` | `AcompanhamentosArquivadosComponent` | ADMIN, SECRETARIA |
| `:id` | `DetalheAcompanhamentoComponent` | ADMIN, SECRETARIA, PROFESSOR |

Todas as rotas aplicam `canActivate: [atendimentoIndividualPermissionGuard]`.

A rota `:id` aplica adicionalmente `canDeactivate: [descarteGuard]`.

Fluxos migrados para modal (não navegam mais para nova rota):

- Criar acompanhamento → `CriarAcompanhamentoModalComponent`
- Novo atendimento → `NovoAtendimentoModalComponent`
- Editar atendimento → modal inline em `DetalheAcompanhamentoComponent`
- Modificar assunto → modal inline em `DetalheAcompanhamentoComponent`
- Finalizar → modal inline em `DetalheAcompanhamentoComponent`
- Gerar relatório → modal inline em `DetalheAcompanhamentoComponent`
- Arquivar/Desarquivar → modal inline em `DetalheAcompanhamentoComponent`

---

# 4. Componentes Principais

## 4.1 Páginas

| Componente | Caminho | Função |
|---|---|---|
| `AtendimentoIndividualHomeComponent` | `pages/atendimento-individual-home/` | Home com contadores e cards de acompanhamentos em andamento |
| `DashboardAtendimentoComponent` | `pages/dashboard-atendimento/` | Dashboard admin com indicadores e rankings |
| `AcompanhamentosEmAndamentoComponent` | `pages/acompanhamentos-em-andamento/` | Lista paginada de acompanhamentos ativos |
| `AcompanhamentosFinalizadosComponent` | `pages/acompanhamentos-finalizados/` | Lista de acompanhamentos encerrados |
| `AcompanhamentosArquivadosComponent` | `pages/acompanhamentos-arquivados/` | Lista de acompanhamentos arquivados (ADMIN/SECRETARIA) |
| `DetalheAcompanhamentoComponent` | `pages/detalhe-acompanhamento/` | Detalhe com timeline, resumo e todos os modais de ação |

## 4.2 Componentes Reutilizáveis

| Componente | Função |
|---|---|
| `CriarAcompanhamentoModalComponent` | Modal em 3 passos para criar acompanhamento (aluno, assunto/professor, revisão) |
| `NovoAtendimentoModalComponent` | Modal para registrar novo atendimento em acompanhamento existente |
| `AtendimentoFormComponent` | Formulário compartilhado de atendimento (criação e edição) |
| `AlunoAutocompleteComponent` | Autocomplete com debounce para buscar alunos por nome/matrícula |
| `AcompanhamentoCardComponent` | Card responsivo de acompanhamento com ações |
| `TimelineAtendimentosComponent` | Timeline cronológica dos registros do acompanhamento |
| `ResumoAtendimentosComponent` | Painel quantitativo (totais por tipo de registro) |
| `StatusAcompanhamentoBadgeComponent` | Badge colorido de status (EM_ANDAMENTO, FINALIZADO, ARQUIVADO) |
| `TipoRegistroBadgeComponent` | Badge de tipo de registro (atendimento, falta justificada, etc.) |
| `FiltrosAtendimentosComponent` | Filtros de busca nas listas |
| `EmptyStateAtendimentosComponent` | Tela vazia estilizada |
| `UploadArquivosAtendimentoComponent` | Upload de arquivos vinculados a atendimento |
| `PaginationComponent` | Paginação das listas |

---

# 5. Serviços HTTP e Integração com API

## 5.1 AtendimentosIndividuaisApiService

`services/atendimentos-individuais-api.service.ts`

Base URL: `/api/atendimentos-individuais`

| Método | HTTP | Endpoint | Descrição |
|---|---|---|---|
| `listar(filtros)` | GET | `/acompanhamentos` | Lista paginada com filtros (status, busca, alunoId, professorId, datas) |
| `buscar(id)` | GET | `/acompanhamentos/:id` | Carrega acompanhamento com atendimentos |
| `dashboard()` | GET | `/acompanhamentos/dashboard` | Indicadores consolidados para admin |
| `criar(payload)` | POST | `/acompanhamentos` | Cria acompanhamento |
| `verificarDuplicidade(params)` | GET | `/acompanhamentos/duplicidade` | Verifica se já existe acompanhamento semelhante |
| `atualizarAssunto(id, payload)` | PATCH | `/acompanhamentos/:id/assunto` | Modifica assunto e registra motivo |
| `finalizar(id, payload)` | PATCH | `/acompanhamentos/:id/finalizar` | Finaliza acompanhamento com resultado |
| `reabrir(id)` | PATCH | `/acompanhamentos/:id/reabrir` | Reabre acompanhamento finalizado |
| `arquivar(id, motivo)` | PATCH | `/acompanhamentos/:id/arquivar` | Arquiva com motivo obrigatório |
| `desarquivar(id, motivo)` | PATCH | `/acompanhamentos/:id/desarquivar` | Desarquiva com motivo obrigatório |
| `criarAtendimento(acompId, payload)` | POST | `/acompanhamentos/:id/atendimentos` | Cria registro de atendimento |
| `listarAtendimentos(acompId)` | GET | `/acompanhamentos/:id/atendimentos` | Lista atendimentos do acompanhamento |
| `buscarAtendimento(atendId)` | GET | `/atendimentos/:id` | Carrega atendimento individual |
| `atualizarAtendimento(atendId, payload)` | PATCH | `/atendimentos/:id` | Edita atendimento existente |

## 5.2 RelatorioAtendimentoApiService

`services/relatorio-atendimento-api.service.ts`

Base URL: `/api/atendimentos-individuais/relatorios`

| Método | HTTP | Endpoint | Descrição |
|---|---|---|---|
| `gerar(filtros)` | GET | `/relatorios` | Gera relatório com totais e lista de acompanhamentos |
| `exportarPdf(filtros)` | POST | `/relatorios/pdf` | Exporta relatório em PDF (retorna Blob) |

## 5.3 ArquivosAtendimentoApiService

`services/arquivos-atendimento-api.service.ts`

Base URL: `/api/atendimentos-individuais`

| Método | HTTP | Endpoint | Descrição |
|---|---|---|---|
| `anexar(atendId, file, categoria)` | POST | `/atendimentos/:id/arquivos` | Faz upload de arquivo via FormData |
| `download(arquivoId)` | GET | `/arquivos/:id/download` | Faz download do arquivo (retorna Blob) |

---

# 6. Fluxos Principais

## 6.1 Criar Acompanhamento

1. Usuário clica em "Novo acompanhamento" (home ou tela em andamento).
2. `CriarAcompanhamentoModalComponent` é exibido via `*ngIf` com `criandoAcompanhamento()`.
3. **Passo 1** — seleção de aluno via `AlunoAutocompleteComponent` (debounce 300ms, mínimo 3 caracteres).
4. **Passo 2** — assunto obrigatório + professor (ADMIN/SECRETARIA selecionam; PROFESSOR é vinculado automaticamente).
5. **Passo 3** — revisão dos dados antes de salvar.
6. Ao salvar: `verificarDuplicidade()` é chamado; se duplicado, alerta e permite continuar mesmo assim.
7. `criar(payload)` é chamado; após sucesso, `salvo.emit(acompanhamento)`.
8. Home atualiza contador `emAndamento` e lista localmente sem recarregar.
9. Fechar com dados preenchidos aciona `ConfirmDialogService` para validar descarte.

## 6.2 Novo Atendimento

1. Usuário clica em "Novo atendimento" no detalhe do acompanhamento.
2. `NovoAtendimentoModalComponent` é exibido com o acompanhamento como `@Input`.
3. `AtendimentoFormComponent` renderiza os campos conforme tipo de registro selecionado.
4. `criarAtendimento(acompanhamentoId, payload)` é chamado.
5. Após sucesso, `salvo.emit(criado)` → `DetalheAcompanhamentoComponent.onCriacaoSalva()` insere o novo registro na timeline sem recarregar.
6. Fechar com formulário tocado aciona validação de descarte via `ConfirmDialogService`.

## 6.3 Editar Atendimento

1. Usuário clica em "Editar" em um item da timeline.
2. `abrirModalEdicao(atendimento, event)` carrega o atendimento em `atendimentoEmEdicao`.
3. Modal inline em `DetalheAcompanhamentoComponent` exibe `AtendimentoFormComponent` com `valoresIniciaisEdicao()`.
4. `atualizarAtendimento(atendimentoId, payload)` é chamado.
5. Após sucesso, a timeline é atualizada localmente: o item editado é substituído na lista `atendimentos`.
6. Fechar com alterações aciona validação de descarte.

## 6.4 Modificar Assunto

1. Usuário clica em "Modificar assunto" no detalhe.
2. `abrirModalAssunto(assuntoAtual, event)` preenche `novoAssunto` com valor atual.
3. Modal inline exige `novoAssunto` (obrigatório) e `motivoAlteracao` (obrigatório).
4. `atualizarAssunto(id, { assuntoAtual, motivoAlteracao })` é chamado.
5. Após sucesso, `acompanhamento` signal é atualizado; o card principal reflete o novo assunto.
6. `temAlteracoesAssunto()` detecta se houve mudança para acionar validação de descarte.

## 6.5 Finalizar Acompanhamento

1. Usuário clica em "Finalizar" no detalhe.
2. `abrirModalFinalizacao(event)` abre modal inline.
3. Campos: `resultadoFinal` (obrigatório) e `resumoFinal` (opcional).
4. `finalizar(id, { resultadoFinal, resumoFinal })` é chamado.
5. Após sucesso, status muda para `FINALIZADO`; ações de criação de atendimento são ocultadas.
6. Validação de descarte ativa se algum campo foi preenchido.

## 6.6 Gerar Relatório

1. Usuário clica em "Relatório" no detalhe.
2. `abrirModalRelatorio(event)` inicializa `filtrosRelatorio` zerados.
3. Filtros disponíveis: `alunoId` (via autocomplete), `professorId`, `dataInicio`, `dataFim`, `status`, `tipoRegistro`.
4. `exportarPdfRelatorio()` valida período (início ≤ fim) e chama `relatorioApi.exportarPdf(filtros)`.
5. Retorna Blob → cria link temporário → faz download com nome `relatorio-atendimento-YYYY-MM-DD.pdf`.
6. Após download, modal é fechado automaticamente.
7. Validação de descarte ativa se algum filtro foi preenchido.

## 6.7 Arquivar / Desarquivar

1. Usuário clica em "Arquivar" ou "Desarquivar" (somente ADMIN).
2. `solicitarConfirmacaoArquivo(acao, event)` abre modal de confirmação.
3. Campo `motivoArquivamentoTexto` é obrigatório.
4. `arquivar(id, motivo)` ou `desarquivar(id, motivo)` é chamado.
5. Após sucesso, `acompanhamento` signal é atualizado com o retorno da API.
6. Validação de descarte ativa se motivo foi digitado mas não confirmado.

---

# 7. Regras de Negócio

- Um acompanhamento deve estar vinculado a exatamente um aluno e um professor.
- PROFESSOR cria acompanhamentos apenas para si mesmo (vinculado via `authService.getUser()`).
- ADMIN e SECRETARIA podem selecionar qualquer professor.
- Apenas acompanhamentos com `status === 'EM_ANDAMENTO'` permitem criar atendimento, modificar assunto e finalizar (`canCreateAtendimento`, `canUpdateSubject`, `canFinish`).
- PROFESSOR só pode mutar acompanhamentos onde `professorId === user.sub` (`canMutate`).
- Apenas ADMIN pode arquivar e desarquivar (`canArchive`).
- Arquivamento requer motivo textual obrigatório.
- Finalização requer `resultadoFinal` obrigatório.
- Modificação de assunto requer `motivoAlteracao` obrigatório.
- A verificação de duplicidade ocorre antes de criar: se já existe acompanhamento com mesmo aluno, professor e assunto, o usuário é alertado mas pode continuar.
- Acompanhamento arquivado tem `status === 'ARQUIVADO'` (flag `arquivado: true` no backend).
- Contadores na home são carregados via três chamadas paralelas com `limit: 1` para obter apenas `meta.total`.
- A timeline é ordenada por `dataAtendimento` decrescente após cada inserção local.
- A categoria padrão de anexo é `ATESTADO` para `FALTA_JUSTIFICADA` e `OUTRO` para os demais tipos.

---

# 8. Models e Tipos

## AcompanhamentoIndividual

```ts
interface AcompanhamentoIndividual {
  id: string;
  alunoId: string;
  professorId: string;
  assuntoAtual: string;
  descricao?: string | null;
  status: 'EM_ANDAMENTO' | 'FINALIZADO' | 'ARQUIVADO';
  arquivado?: boolean;
  arquivadoEm?: string | null;
  motivoArquivamento?: string | null;
  motivoDesarquivamento?: string | null;
  dataInicio: string;
  dataFinalizacao?: string | null;
  resultadoFinal?: string | null;
  resumoFinal?: string | null;
  aluno?: { id: string; nomeCompleto: string; matricula?: string | null };
  professor?: { id: string; nome: string; matricula?: string | null; role?: string };
  atendimentos?: AtendimentoIndividual[];
  _count?: { atendimentos: number };
}
```

## AtendimentoIndividual

```ts
type TipoRegistro = 'ATENDIMENTO_REALIZADO' | 'FALTA_JUSTIFICADA' | 'FALTA_NAO_JUSTIFICADA' | 'CANCELADO';
type Modalidade   = 'PRESENCIAL' | 'REMOTO' | 'TELEFONE' | 'OUTRO';

interface AtendimentoIndividual {
  id: string;
  acompanhamentoId: string;
  alunoId: string;
  professorId: string;
  dataAtendimento: string;
  horaInicio?: string | null;
  horaFim?: string | null;
  duracaoMinutos?: number | null;
  modalidade?: Modalidade | null;
  localAtendimento?: string | null;
  tipoRegistro: TipoRegistro;
  assuntoDoDia?: string | null;
  observacao?: string | null;
  evolucao?: string | null;
  dificuldades?: string | null;
  pendencias?: string | null;
  recomendacoes?: string | null;
  arquivos?: ArquivoAtendimentoIndividual[];
  temComprovante?: boolean | null;
}
```

## DashboardAtendimentoIndividual

```ts
interface DashboardAtendimentoIndividual {
  periodo: { inicio: string; fim: string };
  indicadores: {
    emAndamento: number;
    finalizados: number;
    arquivados: number;
    atendimentosNoMes: number;
    faltasJustificadasComComprovante: number;
    faltasJustificadasSemComprovante: number;
    mediaAtendimentosPorAcompanhamento: number;
  };
  atendimentosPorProfessor: Array<{ professorId: string; nome: string; matricula?: string | null; total: number }>;
  alunosMaisAtendidos: Array<{ alunoId: string; nome: string; matricula?: string | null; total: number }>;
}
```

---

# 9. Formulários e Validações

## Modal Criar Acompanhamento (3 passos)

| Passo | Campos | Validação |
|---|---|---|
| 1 | Seleção de aluno | Obrigatório — bloqueia avanço se `alunoId` vazio |
| 2 | Assunto principal, professor (admin/sec) | `assuntoAtual` obrigatório; professor obrigatório para não-professor |
| 3 | Revisão | Confirma dados antes de salvar |

- Verificação de duplicidade antes de `criar()`.
- `isFormDirty()`: retorna `true` se `formTocado` ou `alunoId` ou `assuntoAtual` preenchidos e não foi salvo.
- Descarte confirmado via `ConfirmDialogService`.

## Modal Novo Atendimento / Editar Atendimento

- `AtendimentoFormComponent` adapta campos conforme `tipoRegistro`.
- `dataAtendimento` e `tipoRegistro` são sempre obrigatórios.
- `temAlteracoes()`: `formTocado && !salvoComSucesso`.
- Estados `formTocado` e `salvoComSucesso` controlam validação de descarte.

## Modais de Ação (Assunto, Finalizar, Arquivar, Relatório)

- Assunto: `novoAssunto` + `motivoAlteracao` obrigatórios.
- Finalizar: `resultadoFinal` obrigatório.
- Arquivar/Desarquivar: `motivoArquivamentoTexto` obrigatório.
- Relatório: validação de período (`dataInicio <= dataFim`).

---

# 10. Modais Reutilizáveis

| Modal | Componente | Usado em |
|---|---|---|
| Criar acompanhamento | `CriarAcompanhamentoModalComponent` | Home, Em andamento |
| Novo atendimento | `NovoAtendimentoModalComponent` | Detalhe do acompanhamento |
| Editar atendimento | Inline em `DetalheAcompanhamentoComponent` com `AtendimentoFormComponent` | Detalhe |
| Modificar assunto | Inline em `DetalheAcompanhamentoComponent` | Detalhe |
| Finalizar | Inline em `DetalheAcompanhamentoComponent` | Detalhe |
| Gerar relatório | Inline em `DetalheAcompanhamentoComponent` | Detalhe |
| Arquivar / Desarquivar | Inline em `DetalheAcompanhamentoComponent` | Detalhe |

Todos os modais compartilham o mesmo padrão:

- `@ViewChild` para foco inicial.
- `@HostListener('document:keydown.escape')` para fechar com Esc.
- `trapFocus()` para navegação por Tab dentro do modal.
- `ConfirmDialogService` para validação de descarte.
- Retorno de foco para o botão que abriu o modal após fechar.

---

# 11. Dashboard Administrativo

Rota: `/admin/atendimentos-individuais/dashboard`

Acesso: `ADMIN`, `SECRETARIA`

Indicadores exibidos:

- Em andamento
- Finalizados
- Arquivados
- Atendimentos no mês
- Faltas com comprovante
- Faltas sem comprovante
- Média de atendimentos por acompanhamento

Rankings:

- Atendimentos por professor (nome, matrícula, total)
- Alunos mais atendidos (nome, matrícula, total)

Endpoint: `GET /api/atendimentos-individuais/acompanhamentos/dashboard`

---

# 12. Acessibilidade

Implementações aplicadas em todo o módulo:

- `role="dialog"` e `aria-modal` nos modais inline.
- `@ViewChild` + `window.setTimeout(() => ref.focus())` para foco inicial no primeiro elemento interativo.
- `trapFocus()` manual via evento Tab para manter foco dentro do modal.
- `@HostListener('document:keydown.escape')` para fechar modais com Esc.
- Foco devolvido ao botão que abriu o modal após fechar (`ultimoBotaoXxx?.focus()`).
- `aria-live="polite"` no painel de carregamento do dashboard.
- `role="alert"` nos painéis de erro.
- Labels visíveis em todos os campos de formulário.
- `[disabled]` propagado nos botões durante operações assíncronas.
- Estados de carregamento explícitos ("Salvando...", "Atualizando...", "Exportando...").
- `EmptyStateAtendimentosComponent` para feedback claro de lista vazia.
- Botões com texto descritivo (não apenas ícones).
- Contraste de cores seguindo padrão do design system existente.
- `AlunoAutocompleteComponent` com busca acessível e feedback de "buscando" e "nenhum resultado".

---

# 13. Utilitários

`utils/calcular-resumo-atendimentos.util.ts` — calcula totais por tipo de registro a partir da lista de atendimentos.

`utils/formatar-status-acompanhamento.util.ts` — converte `StatusAcompanhamentoIndividual` para texto legível.

`utils/formatar-tipo-registro.util.ts` — converte `TipoRegistroAtendimentoIndividual` para texto legível.

---

# 14. Guard de Permissão

`guards/atendimento-individual-permission.guard.ts`

Lógica:

1. Se a rota tem `data.roles` definido, verifica se o role do usuário está incluído.
2. Se não tem `data.roles`, permite acesso para `ADMIN`, `SECRETARIA` e `PROFESSOR`.
3. Caso contrário, redireciona para `/admin/dashboard`.

Rotas restritas por `data.roles`:

- `dashboard` → `['ADMIN', 'SECRETARIA']`
- `arquivados` → `['ADMIN', 'SECRETARIA']`

---

# 15. Pontos de Atenção

- **Não reintroduzir rotas de página** para criar/editar — todos os fluxos de mutação usam modais.
- **Contadores da home** são carregados via três chamadas paralelas; após arquivar, o cache local não é atualizado automaticamente — é necessário recarregar `carregarTudo()` ou atualizar localmente.
- **Verificação de duplicidade** ocorre sempre antes de criar; nunca remover esse passo.
- **Validação de descarte** deve ser aplicada em qualquer novo formulário do módulo.
- **PROFESSOR não pode arquivar** — o botão de arquivamento só aparece para ADMIN; verificar `canArchive()` antes de expor ações.
- **Upload de arquivos** ainda não está integrado diretamente no fluxo de criar/editar atendimento via modal — `UploadArquivosAtendimentoComponent` existe mas deve ser conectado ao fluxo.
- **Reabertura de acompanhamento** (`reabrir()`) existe no service mas a interface ainda não expõe esse botão em todas as telas de finalizados.
- **Evitar duplicação de modais**: `CriarAcompanhamentoModalComponent` e `NovoAtendimentoModalComponent` devem ser os únicos pontos de entrada para essas ações.
- **descarteGuard** protege a rota `:id`; o componente deve manter `podeDescartar()` atualizado conforme novos modais forem adicionados.

---

# 16. Melhorias Futuras

- Integrar `UploadArquivosAtendimentoComponent` diretamente nos modais de criar e editar atendimento.
- Expor botão de reabertura de acompanhamento finalizado nas telas de finalizados.
- Adicionar testes unitários para `DetalheAcompanhamentoComponent` (modais, descarte, permissões).
- Adicionar testes E2E para os fluxos: criar acompanhamento, novo atendimento, finalizar, arquivar, gerar relatório.
- Melhorar `AlunoAutocompleteComponent` com navegação por setas e anúncio `aria-live` com contagem de resultados.
- Adicionar filtros avançados na timeline (por tipo de registro, data, professor).
- Melhorar performance da busca de alunos com cache local por termo.
- Adicionar log de auditoria visível no detalhe (histórico de modificações de assunto, finalizações e arquivamentos).
- Implementar exportação avançada de relatórios com seleção de colunas.
- Avaliar migração de `CriarAcompanhamentoModalComponent` para `@defer` para reduzir bundle inicial.
- Adicionar paginação na timeline para acompanhamentos com muitos registros.

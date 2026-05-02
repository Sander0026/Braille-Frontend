# Modulo: Turmas e Frequencias

---

# 1. Visao Geral

## Objetivo

Documentar a gestao de turmas/oficinas, matriculas, chamada de frequencia, fechamento/reabertura de diario, relatorios e componentes administrativos relacionados.

## Responsabilidade

Este modulo abrange `TurmasService`, `FrequenciasService`, `TurmasLista`, cards/modais de turma, filtros, alunos da turma, `FrequenciasLista`, chamada, historico, relatorio e diretiva de linha focavel.

## Fluxo de Funcionamento

Administradores, secretaria e professores acessam turmas/frequencias. Turmas sao criadas com grade, professor e status. Alunos sao matriculados/desmatriculados. Frequencias registram presenca por data, podem ser salvas em lote e o diario pode ser fechado ou reaberto.

---

# 2. Arquitetura e Metodologias

## Padroes Arquiteturais Identificados

* Feature/domain separation por turma e frequencia.
* Service Layer REST.
* Modal composition para formulario, alunos e filtros.
* DTO pattern para `CreateTurmaDto`.
* Cache TTL para resumo de frequencias.
* State-driven UI para chamada/historico/relatorio.
* Accessibility pattern com diretiva focavel em tabela.

## Justificativa Tecnica

Turmas e frequencias possuem fluxo operacional frequente. Dividir lista, card, filtro, formulario e alunos melhora manutencao. A chamada em lote reduz roundtrips, enquanto o fechamento de diario cria marco de consistencia pedagogica.

---

# 3. Fluxo Interno do Codigo

## Fluxo de Execucao

1. `/admin/turmas` carrega listagem.
2. `TurmasService.listar` aplica paginacao e filtros, incluindo `excluido`, `statusAtivo`, `professorId` e `status`.
3. Criacao/edicao usa `CreateTurmaDto`.
4. Matricula chama `POST /turmas/:turmaId/alunos/:alunoId`.
5. Status muda via endpoints especificos.
6. `/admin/frequencias` carrega resumo e/ou registros.
7. Chamada seleciona turma/data e salva lote.
8. Diario fechado impede alteracoes conforme regra backend.
9. Relatorio individual consulta presencas/faltas/taxa.

## Dependencias Internas

* `TurmasService`
* `FrequenciasService`
* `BeneficiariosService`
* `UsuariosService` para professores ativos via backend de turmas.
* `ConfirmDialogService`
* `ToastService`
* pipes de data e formatacao

## Dependencias Externas

* Angular Forms.
* Angular Router.
* Angular HttpClient.
* RxJS.

---

# 4. Dicionario Tecnico

## Variaveis

* `GradeHorariaDto.dia`: `SEG|TER|QUA|QUI|SEX|SAB|DOM`.
* `horaInicio`, `horaFim`: minutos desde meia-noite.
* `TurmaStatus`: `PREVISTA|ANDAMENTO|CONCLUIDA|CANCELADA`.
* `Turma.capacidadeMaxima`: limite de alunos.
* `cargaHoraria`: carga total.
* `professor`: usuario responsavel.
* `matriculasOficina`: alunos vinculados.
* `Frequencia.presente`: booleano da chamada.
* `dataAula`: data da aula.
* `fechado`, `fechadoEm`: estado de diario.
* `ResumoFrequencia.totalAlunos`, `presentes`, `faltas`, `diarioFechado`.
* `resumoCache`: cache de resumo padrao por 1 minuto.

## Funcoes e Metodos

* `TurmasService.listar`: lista turmas com filtros.
* `listarProfessoresAtivos`: carrega professores para selecao.
* `alunosDisponiveis`: busca alunos nao matriculados.
* `criar`, `atualizar`, `arquivar`, `restaurar`, `ocultarDaAba`.
* `matricularAluno`, `desmatricularAluno`.
* `mudarStatus`, `cancelar`, `concluir`.
* `FrequenciasService.listar`: registros detalhados.
* `listarResumo`: resumo cacheado para tela principal.
* `salvarLote`: persiste chamada.
* `fecharDiario`, `reabrirDiario`.
* `getRelatorioAluno`: estatisticas individuais.

## Classes

* `TurmasLista`: container de listagem e acoes.
* `TurmaCardComponent`: apresentacao de turma.
* `TurmaFormModalComponent`: cadastro/edicao.
* `TurmaAlunosModalComponent`: matriculas.
* `TurmaFiltroDrawerComponent`: filtros.
* `FrequenciasLista`: container.
* `FrequenciaChamadaComponent`: chamada.
* `FrequenciaHistoricoComponent`: historico.
* `FrequenciaRelatorioComponent`: relatorio.
* `TabelaTrFocavelDirective`: acessibilidade de linhas/tabela.

## Interfaces e Tipagens

* `GradeHorariaDto`
* `TurmaStatus`
* `Turma`
* `CreateTurmaDto`
* `Frequencia`
* `ResumoFrequencia`
* `FrequenciaRelatorioAluno`
* `FrequenciaRelatorioEstatisticas`
* `FrequenciaRelatorioHistoricoItem`
* `PaginatedResponse<T>`

---

# 5. Servicos e Integracoes

## APIs

* `GET /api/turmas`
* `GET /api/turmas/professores-ativos`
* `GET /api/turmas/:id`
* `GET /api/turmas/:turmaId/alunos-disponiveis`
* `POST /api/turmas`
* `PATCH /api/turmas/:id`
* `DELETE /api/turmas/:id`
* `PATCH /api/turmas/:id/restaurar`
* `PATCH /api/turmas/:id/ocultar`
* `POST /api/turmas/:turmaId/alunos/:alunoId`
* `DELETE /api/turmas/:turmaId/alunos/:alunoId`
* `PATCH /api/turmas/:id/status`
* `PATCH /api/turmas/:id/cancelar`
* `PATCH /api/turmas/:id/concluir`
* `GET /api/frequencias`
* `GET /api/frequencias/resumo`
* `POST /api/frequencias`
* `PATCH /api/frequencias/:id`
* `POST /api/frequencias/lote`
* `DELETE /api/frequencias/:id`
* `POST /api/frequencias/diario/fechar/:turmaId/:dataAula`
* `POST /api/frequencias/diario/reabrir/:turmaId/:dataAula`
* `GET /api/frequencias/relatorio/turma/:turmaId/aluno/:alunoId`

## Banco de Dados

Entidades refletidas: turmas, usuarios professores, matriculasOficina, beneficiarios/alunos e frequencias.

## Servicos Externos

Nao ha integracao externa direta.

---

# 6. Seguranca e Qualidade

## Seguranca

* Rotas exigem usuario admin autenticado; roles de turma/frequencia incluem `ADMIN`, `SECRETARIA` e `PROFESSOR`.
* Professores devem ver/operar dados conforme backend restringir por token.
* Fechamento de diario protege integridade da chamada.

## Qualidade

* Existem specs para servico de turmas e componentes de turma/frequencia.
* `HttpHeaders` anti-cache em turmas evita dados obsoletos em listagem operacional.
* Resumo de frequencia possui cache curto e invalidacao por mutacoes.

## Performance

* Chamada em lote reduz multiplas requisicoes.
* Resumo padrao usa `shareReplay(1)` por 1 minuto.
* Lazy loading das paginas evita custo antes do acesso.

---

# 7. Regras de Negocio

* Turma pode ser prevista, em andamento, concluida ou cancelada.
* Arquivamento e restauracao preservam historico.
* Aluno so deve ser matriculado se disponivel.
* Diario fechado sinaliza chamada validada.
* Diario pode ser reaberto quando permitido.
* Relatorio individual calcula total de aulas, presentes, faltas e taxa de presenca.

---

# 8. Relacao com Outros Modulos

* Beneficiarios fornece alunos.
* Usuarios fornece professores.
* Certificados academicos dependem de turma/aluno.
* Auditoria registra matricula, desmatricula, fechar/reabrir diario e mudar status.
* Dashboard agrega turmas ativas.

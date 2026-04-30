# Modulo: Auditoria, Ajuda e Qualidade

---

# 1. Visao Geral

## Objetivo

Documentar auditoria administrativa, visualizacao de logs, estatisticas, diff de alteracoes, central de ajuda, manuais, visualizadores de PDF, testes unitarios/E2E, acessibilidade automatizada e observabilidade.

## Responsabilidade

Este modulo inclui `AuditLogService`, `AuditLogLista`, componentes de stats/detalhe, pipes/utilitarios de auditoria, pagina `Ajuda`, cards/manuais/PDF, specs, Cypress, axe-core em desenvolvimento, Sentry e configuracoes de qualidade do projeto.

## Fluxo de Funcionamento

Admins acessam auditoria para consultar logs, filtrar eventos e ver detalhes/diffs. Ajuda fornece manuais acessiveis e PDFs. A qualidade e monitorada por testes Vitest, specs Angular, Cypress E2E, Cypress axe e auditoria axe-core em desenvolvimento.

---

# 2. Arquitetura e Metodologias

## Padroes Arquiteturais Identificados

* Audit log viewer pattern.
* Cache TTL para logs e stats.
* Adapter pattern para respostas `{ success, data }`.
* Pure pipe para frase amigavel.
* Utility diff para old/new JSON.
* Help center component composition.
* Automated accessibility testing.
* Observability com Sentry.

## Justificativa Tecnica

Auditoria precisa ser resiliente a formatos de resposta e dados antigos. Por isso o servico normaliza payloads e o diff ignora campos tecnicos. A central de ajuda combina conteudo HTML acessivel e PDF para atender leitores de tela e usuarios que preferem documento. Testes de acessibilidade sao essenciais no dominio do instituto.

---

# 3. Fluxo Interno do Codigo

## Fluxo de Execucao

1. `/admin/auditoria` exige role ADMIN.
2. `AuditLogService.listar` monta query com paginacao, entidade, registro, autor, acao e datas.
3. Resposta e normalizada para garantir `data` array.
4. `AuditLogService.stats` carrega agregados.
5. Lista renderiza logs com `AuditFriendlyPipe`.
6. Modal de detalhes usa `gerarDiferencas(oldValue,newValue)`.
7. `/admin/ajuda` renderiza manuais definidos em constantes.
8. Usuario abre card de manual, visualizador HTML ou PDF.
9. Visualizador de PDF prepara URL/Blob e trata erros.
10. Cypress roda fluxos e `cy.checkA11y` com axe.
11. Em desenvolvimento, `main.ts` roda `axe.run` automaticamente e expoe auditoria manual no console.

## Dependencias Internas

* `AuditLogService`
* `AuditFriendlyPipe`
* `gerarDiferencas`
* `DataBraillePipe`
* `Ajuda`
* `ManualCardComponent`
* `ManualViewerComponent`
* `PdfViewerComponent`
* `SafeUrlPipe`
* `ToastService`
* `ConfirmDialogService`

## Dependencias Externas

* Angular.
* RxJS.
* Angular CDK A11y.
* Cypress.
* cypress-axe.
* axe-core.
* Sentry.
* pdfjs-dist/browser PDF capabilities.

---

# 4. Dicionario Tecnico

## Variaveis

* `AuditAcao`: `CRIAR`, `ATUALIZAR`, `EXCLUIR`, `ARQUIVAR`, `RESTAURAR`, `LOGIN`, `LOGOUT`, `MATRICULAR`, `DESMATRICULAR`, `FECHAR_DIARIO`, `REABRIR_DIARIO`, `MUDAR_STATUS`.
* `AuditLog.entidade`: tipo de entidade auditada.
* `registroId`: ID do registro afetado.
* `autorId`, `autorNome`, `autorRole`: autor.
* `ip`, `userAgent`: metadados tecnicos.
* `oldValue`, `newValue`: snapshots para diff.
* `criadoEm`: data do evento.
* `AuditStats.totalLogs`, `logsHoje`, `topAcoes`.
* `QueryAuditDto`: filtros.
* `CACHE_TTL_MS`: 60 segundos.
* `listarCache`, `statsCache`: caches de auditoria.
* `AUDIT_FIELD_LABELS`: labels amigaveis.
* `AUDIT_IGNORED_FIELDS`: campos omitidos.
* constantes de ajuda: definem manuais, secoes, passos e PDFs.

## Funcoes e Metodos

* `defaultAuditStats`: fallback seguro.
* `AuditLogService.limparCache`: limpa caches.
* `listar(q)`: lista logs filtrados.
* `stats()`: estatisticas.
* `historicoPorRegistro(entidade,registroId)`: historico fresco.
* `AuditFriendlyPipe.transform`: frase humana por acao.
* `formatarEntidade`: mapeia entidades para labels.
* `gerarDiferencas`: gera diff.
* `formatarValorAmigavel`: converte boolean/data/null/string.
* metodos de `Ajuda`: selecionam manual, abrem/fecham PDF e controlam foco.
* `terminalLog` em Cypress: imprime violacoes axe no terminal.

## Classes

* `AuditLogService`
* `AuditLogLista`
* `AuditModalDetalhesComponent`
* `AuditStatsComponent`
* `AuditFriendlyPipe`
* `Ajuda`
* `ManualCardComponent`
* `ManualViewerComponent`
* `PdfViewerComponent`

## Interfaces e Tipagens

* `AuditLog`
* `AuditStats`
* `QueryAuditDto`
* `AuditDiff`
* estruturas de manuais em `ajuda.constants.ts`

---

# 5. Servicos e Integracoes

## APIs

* `GET /api/audit-log`
* `GET /api/audit-log/stats`
* `GET /api/audit-log/:entidade/:registroId`
* assets locais de manuais/PDF em `src/assets/manuais`

## Banco de Dados

Entidade refletida: `audit_log`, contendo snapshots antigos/novos, autor e metadados.

## Servicos Externos

* Sentry para captura global de erros quando DSN configurado.
* axe-core para auditoria local/dev.
* Cypress + cypress-axe para E2E/a11y.

---

# 6. Seguranca e Qualidade

## Seguranca

* Auditoria restrita a ADMIN.
* Diff ignora campos como `senhaHash`.
* Logs podem conter dados sensiveis; UI deve controlar exposicao.
* Ajuda/PDF usa pipe seguro de URL.

## Qualidade

* Specs cobrem varias telas e componentes.
* Cypress cobre login, alunos, fluxos e acessibilidade.
* `a11y.cy.ts` verifica tela de login com axe.
* `main.ts` roda axe em dev para problemas WCAG 2A/2AA.
* ESLint e Vitest configurados no projeto.

## Performance

* Auditoria usa cache TTL de 1 minuto para listagem e stats.
* Historico por registro nao e cacheado para manter frescor.
* Ajuda usa constantes locais para manuais, evitando API.

---

# 7. Regras de Negocio

* Auditoria deve exibir eventos por entidade, acao, autor e periodo.
* Stats de auditoria devem ter fallback para resposta parcial.
* Diffs nao devem exibir campos tecnicos/sensiveis.
* Ajuda deve oferecer manual acessivel e PDF complementar.
* Testes de acessibilidade devem falhar/registrar violacoes relevantes.

---

# 8. Pontos de Atencao

* DiferenÃ§as de auditoria mascaram campos sensiveis como CPF, RG, telefone, e-mail, documentos, senhas e tokens.
* `oldValue`/`newValue` como `unknown` passam por guards antes de gerar diferencas visiveis.
* Cobertura Cypress parece focada em alguns fluxos; ampliar para certificados, contatos, turmas e frequencias.
* Sentry esta desativado enquanto DSN estiver vazio.
* O output de axe em desenvolvimento nao substitui gating de CI.

---

# 9. Relacao com Outros Modulos

* Auditoria registra eventos de usuarios, beneficiarios, turmas, frequencias, contatos, comunicados, apoiadores e certificados.
* Ajuda apoia operacao de modulos administrativos.
* Qualidade automatizada valida login, alunos e acessibilidade.
* Sentry recebe erros globais do app.

---

# 10. Resumo Tecnico Final

Auditoria e qualidade possuem criticidade alta para governanca, seguranca e confiabilidade. Ajuda possui criticidade media por reduzir erro operacional. A complexidade e media-alta pela combinacao de logs, diffs, acessibilidade e testes. A implementacao e robusta em normalizacao e foco WCAG, mas deve evoluir em mascaramento de dados sensiveis, cobertura E2E e ativacao de observabilidade em producao.

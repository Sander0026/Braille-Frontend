# Modulo: Servicos HTTP e Integracoes de API

---

# 1. Visao Geral

## Objetivo

Mapear todos os servicos frontend que comunicam com API REST, seus contratos TypeScript, cache, payloads, endpoints, regras de invalidacao e impacto arquitetural.

## Responsabilidade

Os servicos em `src/app/core/services`, `src/app/pages/admin/apoiadores/apoiadores.service.ts` e `src/app/pages/public/contato/contato.service.ts` funcionam como camada de acesso a dados do frontend. Eles isolam componentes de detalhes de URL, DTO, `HttpParams`, uploads, paginacao e cache.

## Fluxo de Funcionamento

Componentes chamam metodos de servico, os servicos montam parametros/payloads, `HttpClient` envia requisicoes, interceptadores aplicam base URL/JWT/erros, e os Observables retornam dados tipados para renderizacao.

---

# 2. Arquitetura e Metodologias

## Padroes Arquiteturais Identificados

* Service Layer.
* DTO pattern.
* Repository-like frontend services.
* Cache aside com `Map`, objeto local, TTL e `shareReplay`.
* Facade pattern para uploads via `StorageService`.
* Adapter pattern para respostas `{ success, data, message }`.
* Observable-based async flow.

## Justificativa Tecnica

Centralizar HTTP em servicos reduz duplicacao nas telas, melhora testabilidade e preserva contratos de API. Caches curtos com TTL reduzem chamadas repetidas em listagens administrativas sem introduzir estado global complexo. `shareReplay(1)` evita multiplas requisicoes para a mesma assinatura enquanto preserva interface Observable.

---

# 3. Fluxo Interno do Codigo

## Fluxo de Execucao

1. O componente injeta um servico de dominio.
2. O metodo do servico valida parametros opcionais e cria `HttpParams` ou `FormData`.
3. Em listagens cacheadas, uma chave serializada e consultada.
4. Se cache valido existe, retorna Observable/objeto cacheado.
5. Se nao existe, executa `HttpClient`.
6. Respostas sao tipadas, mapeadas ou normalizadas quando necessario.
7. Mutacoes chamam `limparCache()` antes ou apos a chamada.
8. Interceptadores aplicam URL, Authorization e mensagens de erro.

## Dependencias Internas

* `PaginatedResponse<T>` de `BeneficiariosService`.
* `StorageService`.
* `DashboardService`.
* `environment`.
* `apiInterceptor`, `authInterceptor`, `errorInterceptor`.

## Dependencias Externas

* `HttpClient`
* `HttpParams`
* `HttpHeaders`
* `Observable`
* `shareReplay`
* `map`
* `tap`
* `of`

---

# 4. Dicionario Tecnico

## Variaveis

* `url`: raiz relativa do recurso, como `/api/beneficiaries`, `/api/turmas`, `/api/users`.
* `apiUrl`: raiz baseada em `environment.apiUrl`, usada em laudos, certificados, site-config e apoiadores.
* `cache`: `Map` de listagens paginadas com TTL.
* `cacheTimeMs`: duracao do cache, geralmente 1, 2 ou 5 minutos.
* `resumoCache`: cache unico de resumo de frequencias.
* `cacheLista` e `cachePublicos`: cache simples em `ApoiadoresService`.
* `listarCache` e `statsCache`: caches especificos de auditoria.

## Funcoes e Metodos

* `listar`: metodo recorrente para paginacao e filtros.
* `buscarPorId`/`obterPorId`/`findOne`: busca por identificador.
* `criar`: cria registro.
* `atualizar`: atualiza registro.
* `excluir`/`inativar`/`arquivar`: remove logicamente ou definitivamente conforme endpoint.
* `restaurar`/`reativar`: reativa registros inativos.
* `uploadImagem`, `uploadPdf`, `uploadFoto`, `uploadLogo`: enviam arquivos via `FormData`.
* `limparCache`: invalida dados locais apos mutacoes.
* `exportarLista`: baixa ArrayBuffer de exportacao.
* `importar`: envia planilha/arquivo de importacao.
* `validarAutenticidade`: valida certificado por codigo publico.
* `emitirAcademico` e `emitirCertificado`: disparam geracao de certificado.

## Classes

* `BeneficiariosService`: alunos/beneficiarios, importacao, exportacao, documentos e cache.
* `TurmasService`: turmas, professores, matriculas e status.
* `FrequenciasService`: chamadas, resumo, diario e relatorios.
* `UsuariosService`: usuarios administrativos, CPF, reativacao e reset de senha.
* `AtestadosService`: atestados medicos e justificativa de faltas.
* `LaudosService`: laudos medicos de alunos.
* `AuditLogService`: auditoria, estatisticas e historico.
* `ComunicadosService`: comunicados/noticias.
* `ContatosService`: mensagens recebidas.
* `DashboardService`: estatisticas gerais.
* `ModelosCertificadosService`: modelos e emissao/validacao de certificados.
* `SiteConfigService`: configuracoes, secoes e tema.
* `StorageService`: uploads e delecao de arquivos.
* `ApoiadoresService`: apoiadores, acoes e certificados de honraria.
* `ContatoService`: envio publico de formulario de contato.

## Interfaces e Tipagens

* `Beneficiario`, `PaginatedResponse<T>`, `ReativacaoAluno`, `ImportResult`.
* `Turma`, `CreateTurmaDto`, `GradeHorariaDto`, `TurmaStatus`.
* `Frequencia`, `ResumoFrequencia`.
* `Usuario`, `CreateUsuarioDto`, `CreateUsuarioResponse`, `ReativacaoResponse`.
* `Atestado`, `CriarAtestadoDto`, `ResultadoCriacaoAtestado`, `PreviewAtestado`.
* `LaudoMedico`, `CriarLaudoDto`.
* `AuditLog`, `AuditStats`, `QueryAuditDto`, `AuditAcao`.
* `Comunicado`, `ComunicadoResponse`.
* `Contato`, `ContatoPayload`.
* `DashboardStats`.
* `ModeloCertificado`.
* `SiteConfigMap`, `SecoesMap`.
* `Apoiador`, `AcaoApoiador`, `PaginatedResult<T>`.

---

# 5. Servicos e Integracoes

## APIs

### Beneficiarios

* `GET /api/beneficiaries`: lista com `page`, `limit`, `busca`, `inativos` e filtros dinamicos.
* `GET /api/beneficiaries/export`: exporta lista.
* `GET /api/beneficiaries/:id`: detalhe.
* `GET /api/beneficiaries/check-cpf-rg`: valida duplicidade.
* `POST /api/beneficiaries`: cria ou retorna reativacao.
* `PATCH /api/beneficiaries/:id`: atualiza.
* `DELETE /api/beneficiaries/:id`: inativa.
* `PATCH /api/beneficiaries/:id/restore`: restaura.
* `DELETE /api/beneficiaries/:id/hard`: exclui definitivamente.
* `POST /api/beneficiaries/:id/reactivate`: reativa aluno.
* `POST /api/beneficiaries/import`: importa arquivo.

### Turmas

* `GET /api/turmas`: lista com filtros de status, professor, exclusao e nome.
* `GET /api/turmas/professores-ativos`: professores ativos.
* `GET /api/turmas/:id`: detalhe.
* `GET /api/turmas/:turmaId/alunos-disponiveis`: alunos disponiveis.
* `POST /api/turmas`: cria.
* `PATCH /api/turmas/:id`: atualiza.
* `DELETE /api/turmas/:id`: arquiva.
* `PATCH /api/turmas/:id/restaurar`: restaura.
* `PATCH /api/turmas/:id/ocultar`: oculta da aba.
* `POST /api/turmas/:turmaId/alunos/:alunoId`: matricula.
* `DELETE /api/turmas/:turmaId/alunos/:alunoId`: desmatricula.
* `PATCH /api/turmas/:id/status`: muda status.
* `PATCH /api/turmas/:id/cancelar`: cancela.
* `PATCH /api/turmas/:id/concluir`: conclui.

### Frequencias

* `GET /api/frequencias`: lista registros.
* `GET /api/frequencias/resumo`: resumo por turma/data.
* `GET /api/frequencias/relatorio/turma/:turmaId/aluno/:alunoId`: relatorio individual.
* `POST /api/frequencias`: registra.
* `PATCH /api/frequencias/:id`: atualiza.
* `POST /api/frequencias/lote`: salva chamada em lote.
* `DELETE /api/frequencias/:id`: exclui.
* `POST /api/frequencias/diario/fechar/:turmaId/:dataAula`: fecha diario.
* `POST /api/frequencias/diario/reabrir/:turmaId/:dataAula`: reabre diario.

### Usuarios

* `GET /api/users/check-cpf`: valida CPF.
* `GET /api/users`: lista.
* `POST /api/users`: cria ou retorna reativacao.
* `POST /api/users/:id/reativar`: reativa e gera senha.
* `PATCH /api/users/:id`: atualiza.
* `DELETE /api/users/:id`: inativa.
* `PATCH /api/users/:id/reset-password`: reseta senha.
* `PATCH /api/users/:id/restore`: restaura.
* `DELETE /api/users/:id/hard`: exclui definitivamente.

### Conteudo e Comunicacao

* `GET /api/comunicados`: lista comunicados.
* `POST /api/comunicados`: cria.
* `GET /api/comunicados/:id`: detalhe.
* `PATCH /api/comunicados/:id`: atualiza.
* `DELETE /api/comunicados/:id`: exclui.
* `GET /api/contatos`: lista mensagens.
* `POST /api/contatos`: envia contato publico.
* `GET /api/contatos/:id`: detalhe.
* `PATCH /api/contatos/:id/lida`: marca como lida.
* `DELETE /api/contatos/:id`: exclui.
* `GET /api/site-config`: configurações.
* `PATCH /api/site-config`: salva configurações.
* `GET /api/site-config/secoes`: secoes publicas.
* `PATCH /api/site-config/secoes/:secao`: salva secao.

### Documentos, Auditoria e Certificados

* `POST /api/alunos/:alunoId/atestados`: cria atestado.
* `GET /api/alunos/:alunoId/atestados`: lista.
* `GET /api/alunos/:alunoId/atestados/preview`: preview de faltas justificaveis.
* `GET /api/atestados/:id`: detalhe.
* `PATCH /api/atestados/:id`: atualiza.
* `DELETE /api/atestados/:id`: remove.
* `GET /api/alunos/:alunoId/laudos`: lista laudos.
* `POST /api/alunos/:alunoId/laudos`: cria laudo.
* `PATCH /api/laudos/:id`: atualiza laudo.
* `DELETE /api/laudos/:id`: remove laudo.
* `GET /api/audit-log`: lista auditoria.
* `GET /api/audit-log/stats`: estatisticas.
* `GET /api/audit-log/:entidade/:registroId`: historico.
* `GET /api/modelos-certificados`: lista modelos.
* `POST /api/modelos-certificados`: cria modelo com `FormData`.
* `PATCH /api/modelos-certificados/:id`: atualiza.
* `DELETE /api/modelos-certificados/:id`: exclui.
* `GET /api/certificados/validar/:codigo`: valida autenticidade.
* `POST /api/modelos-certificados/teste`: gera teste em Blob.
* `POST /api/modelos-certificados/emitir-academico`: emite certificado academico.

### Apoiadores

* `GET /api/apoiadores`: lista.
* `GET /api/apoiadores/publicos`: lista publicos.
* `GET /api/apoiadores/:id`: detalhe.
* `POST /api/apoiadores`: cria.
* `PATCH /api/apoiadores/:id`: atualiza.
* `DELETE /api/apoiadores/:id`: exclui.
* `PATCH /api/apoiadores/:id/inativar`: inativa.
* `PATCH /api/apoiadores/:id/reativar`: reativa.
* `PATCH /api/apoiadores/:id/logo`: upload de logo.
* `GET /api/apoiadores/:id/acoes`: acoes.
* `POST /api/apoiadores/:id/acoes`: adiciona acao.
* `PATCH /api/apoiadores/:apoiadorId/acoes/:acaoId`: edita acao.
* `DELETE /api/apoiadores/:apoiadorId/acoes/:acaoId`: remove acao.
* `GET /api/apoiadores/:apoiadorId/certificados`: certificados.
* `POST /api/apoiadores/:apoiadorId/certificados`: emite certificado.
* `GET /api/apoiadores/:apoiadorId/certificados/:certId/pdf`: gera PDF.

## Banco de Dados

Sem acesso direto. As entidades refletidas indicam tabelas/recursos provaveis no backend: beneficiarios, turmas, matriculas, frequencias, usuarios, comunicados, contatos, site_config, atestados, laudos, modelos_certificados, certificados, apoiadores, acoes_apoiador e audit_log.

## Servicos Externos

* Storage/upload remoto atras de `/api/upload`.
* Render ou backend hospedado em `https://braille-api-oieq.onrender.com/api`.
* PDF generation no backend de certificados.

---

# 6. Seguranca e Qualidade

## Seguranca

* Interceptor injeta JWT automaticamente nas rotas protegidas.
* Uploads usam `FormData`, evitando serializacao manual.
* `SafeUrlPipe` bloqueia `javascript:`, `data:` e `vbscript:` antes de confiar recurso.
* DTOs reduzem payloads inesperados em formularios tipados.
* `HttpParams` evita concatenacao insegura na maioria dos servicos.

## Qualidade

* Interfaces documentam contratos recebidos do backend.
* `defaultAuditStats()` evita crash por resposta parcial.
* Normalizacao de respostas `{ success, data }` em auditoria e atestados aumenta resiliencia.
* Caches possuem invalidacao apos mutacao.

## Performance

* `BeneficiariosService`, `UsuariosService`, `ContatosService`, `DashboardService`, `FrequenciasService` e `AuditLogService` usam TTL.
* `shareReplay(1)` evita requisicoes duplicadas na mesma janela de cache.
* `ApoiadoresService` usa cache por chave e cache de publicos em memoria.

---

# 7. Regras de Negocio

* CPF/RG de beneficiario e CPF de usuario podem retornar status livre, ativo ou inativo para orientar criacao/reativacao.
* Alunos e usuarios suportam exclusao logica, restauracao e exclusao definitiva.
* Turmas possuem status `PREVISTA`, `ANDAMENTO`, `CONCLUIDA`, `CANCELADA`.
* Frequencias podem ser salvas em lote e diario pode ser fechado/reaberto.
* Atestados justificam faltas dentro de periodo.
* Certificados possuem modelos academicos e de honraria, com validacao por codigo.
* Site publico e alimentado por secoes configuraveis.
* Apoiadores podem ter acoes historicas e certificados de honraria.

---

# 8. Pontos de Atencao

* `ComunicadosService.listar` usa concatenacao manual para `categoria`; recomenda-se `HttpParams`.
* `LaudosService`, `ModelosCertificadosService`, `SiteConfigService` e `ApoiadoresService` usam `environment.apiUrl` direto; padronizar com `/api` facilitaria interceptacao uniforme.
* Caches em memoria nao sao compartilhados entre abas e podem mostrar dados defasados ate TTL.
* Alguns retornos usam `any`, especialmente certificados e relatorios; reforcar tipos reduziria bugs.
* Upload/delete dependem de comportamento do backend para autorizacao e sanitizacao de arquivo.

---

# 9. Relacao com Outros Modulos

* Paginas administrativas consomem estes servicos para CRUD.
* `DashboardService` e invalidado por `BeneficiariosService.limparCache`.
* `StorageService` e usado por beneficiarios, usuarios e auth.
* Interceptadores globais afetam todos os servicos.
* Pipes e utilitarios formatam dados vindos desses contratos.

---

# 10. Resumo Tecnico Final

Este modulo e de criticidade alta porque concentra toda comunicacao com backend. A complexidade e alta pela quantidade de recursos, cache, uploads e variacoes de resposta. A arquitetura e adequada para Angular, com servicos tipados e cache local, mas deve evoluir para padronizacao de URLs, eliminacao de `any` e consistencia de `HttpParams` em todos os endpoints.


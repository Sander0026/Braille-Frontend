# Modulo: Beneficiarios e Cadastro de Alunos

---

# 1. Visao Geral

## Objetivo

Documentar o dominio de beneficiarios/alunos, incluindo listagem, cadastro, detalhe, importacao, exportacao, uploads, validacao de CPF/RG, reativacao, inativacao, documentos LGPD, laudos e atestados.

## Responsabilidade

O modulo e composto por `BeneficiariosService`, componentes em `src/app/features/beneficiaries`, servicos `AtestadosService`, `LaudosService`, `StorageService`, pipes/mascaras compartilhadas e guard de descarte.

## Fluxo de Funcionamento

A lista busca alunos paginados e filtrados. O formulario cria/edita aluno, valida documentos, envia uploads e protege descarte. O detalhe exibe dados cadastrais, matriculas, laudos e atestados. Importacao envia arquivo e apresenta resultado com importados, ignorados e erros.

---

# 2. Arquitetura e Metodologias

## Padroes Arquiteturais Identificados

* Feature folder por dominio.
* Reactive Forms para cadastro.
* Service Layer para API.
* DTO pattern com `BeneficiarioPayload` para criacao e edicao.
* Cache TTL em listagem.
* Guard canDeactivate para formularios sujos.
* Facade de upload via `StorageService`.
* Soft delete, restore e hard delete.

## Justificativa Tecnica

Beneficiarios possuem alta densidade de campos e documentos; centralizar API no servico reduz duplicacao. O cache de listagem melhora performance de tabelas. O guard de descarte evita perda de dados em formularios longos. A reativacao evita duplicidade juridica de CPF/RG e preserva historico.

---

# 3. Fluxo Interno do Codigo

## Fluxo de Execucao

1. Usuario com role permitida acessa `/admin/alunos`.
2. `BeneficiaryList` chama `BeneficiariosService.listar`.
3. Filtros sao convertidos em `HttpParams`; resposta retorna `data` e `meta`.
4. Busca por CPF/RG chama `checkCpfRg`.
5. Cadastro envia payload para `criarBeneficiario`.
6. Se backend retorna `_reativacao: true`, UI deve solicitar reativacao.
7. Uploads de imagem/PDF sao delegados a `StorageService`.
8. Atualizacoes/inativacoes/restauracoes limpam cache.
9. Detalhe carrega aluno por ID e documentos associados.
10. Atestados podem prever faltas justificaveis antes de criar.
11. Importacao envia `FormData` para `/import`.

## Dependencias Internas

* `BeneficiariosService`
* `AtestadosService`
* `LaudosService`
* `StorageService`
* `TurmasService`
* `FrequenciasService`
* `ConfirmDialogService`
* `ToastService`
* `BaseFormDescarte`/`injectFormDescarte`
* pipes de CPF/RG, telefone, CEP e data

## Dependencias Externas

* Angular Forms.
* Angular Router.
* Angular HttpClient.
* RxJS.

---

# 4. Dicionario Tecnico

## Variaveis

* `Beneficiario.id`: identificador do aluno.
* `nomeCompleto`: nome civil/completo.
* `cpf`, `rg`: documentos usados para deduplicacao.
* `dataNascimento`, `genero`, `corRaca`, `estadoCivil`: dados pessoais.
* `telefoneContato`, `email`: contato.
* `fotoPerfil`: imagem do aluno.
* `cep`, `rua`, `numero`, `bairro`, `cidade`, `uf`: endereco.
* `tipoDeficiencia`, `causaDeficiencia`, `idadeOcorrencia`: dados da deficiencia.
* `laudoUrl`, `termoLgpdUrl`: documentos.
* `termoLgpdAceito`, `termoLgpdAceitoEm`: consentimento LGPD.
* `tecAssistivas`, `prefAcessibilidade`: necessidades de acessibilidade.
* `escolaridade`, `profissao`, `rendaFamiliar`, `beneficiosGov`: perfil socioeconomico.
* `precisaAcompanhante`, `acompOftalmologico`, `outrasComorbidades`: saude/acompanhamento.
* `statusAtivo`, `excluido`: ciclo de vida.
* `matricula`: codigo interno.
* `matriculasOficina`: vinculos com turmas.
* `cache`: cache de listagem.
* `cacheTimeMs`: 2 minutos.

## Funcoes e Metodos

* `listar(page,limit,busca,inativos,filtros)`: lista alunos.
* `exportarLista`: baixa planilha/arquivo.
* `buscarPorId`: carrega detalhe.
* `checkCpfRg`: verifica duplicidade.
* `criarBeneficiario`: cria aluno ou retorna reativacao.
* `atualizar`: edita aluno.
* `inativar`, `restaurar`, `excluirDefinitivo`, `reativar`: ciclo de vida.
* `uploadImagem`, `uploadPdf`, `excluirArquivo`: documentos.
* `importar`: importacao em massa.
* `AtestadosService.criar/listar/preview/findOne/remover/atualizar`: gestao de atestados.
* `LaudosService.listarPorAluno/criar/atualizar/remover`: gestao de laudos.

## Classes

* `BeneficiaryList`: listagem, filtros, paginacao, acoes e importacao.
* `BeneficiaryFormComponent`: cadastro/edicao com validacoes e descarte.
* `BeneficiaryDetails`: detalhe do aluno.
* `ImportModal`: fluxo de upload e resultado de importacao.
* `BeneficiariosService`: API e cache.
* `AtestadosService`: faltas justificadas.
* `LaudosService`: laudos medicos.

## Interfaces e Tipagens

* `Beneficiario`
* `PaginatedResponse<T>`
* `ReativacaoAluno`
* `ImportResult`
* `Atestado`
* `CriarAtestadoDto`
* `AtualizarAtestadoDto`
* `ResultadoCriacaoAtestado`
* `PreviewAtestado`
* `LaudoMedico`
* `CriarLaudoDto`

---

# 5. Servicos e Integracoes

## APIs

* `GET /api/beneficiaries`
* `GET /api/beneficiaries/export`
* `GET /api/beneficiaries/:id`
* `GET /api/beneficiaries/check-cpf-rg`
* `POST /api/beneficiaries`
* `PATCH /api/beneficiaries/:id`
* `DELETE /api/beneficiaries/:id`
* `PATCH /api/beneficiaries/:id/restore`
* `DELETE /api/beneficiaries/:id/hard`
* `POST /api/beneficiaries/:id/reactivate`
* `POST /api/beneficiaries/import`
* `POST /api/upload`
* `POST /api/upload/pdf?tipo=lgpd|atestado|laudo`
* `DELETE /api/upload`
* `GET/POST /api/alunos/:alunoId/atestados`
* `GET /api/alunos/:alunoId/atestados/preview`
* `GET/PATCH/DELETE /api/atestados/:id`
* `GET/POST /api/alunos/:alunoId/laudos`
* `PATCH/DELETE /api/laudos/:id`

## Banco de Dados

Entidades inferidas pelo contrato: beneficiarios/alunos, matriculasOficina, turmas, atestados, frequencias, laudos e arquivos associados.

## Servicos Externos

* Storage de imagem/PDF por `/api/upload`.
* Possivel geracao/exportacao de planilha no backend.

---

# 6. Seguranca e Qualidade

## Seguranca

* Rotas de alunos exigem roles `ADMIN` ou `SECRETARIA`.
* Documentos sensiveis usam upload PDF com tipo controlado.
* Validacao de CPF/RG evita duplicidade.
* Guard de descarte protege dados em formularios longos.
* LGPD e representada por termo URL e aceite.

## Qualidade

* Existe cobertura spec para lista, formulario e detalhes.
* `BeneficiarioPayload` deriva dos campos editaveis do aluno e evita payload generico no cadastro.
* Importacao retorna erros por linha/documento/motivo.
* Cache e limpo apos mutacoes.

## Performance

* Listagem usa cache TTL e `shareReplay(1)`.
* Filtros evitam enviar parametros vazios.
* Exportacao usa `arraybuffer`, adequada para arquivo binario.

---

# 7. Regras de Negocio

* CPF/RG ativo impede criacao duplicada.
* CPF/RG inativo deve permitir reativacao guiada.
* Aluno pode ser inativado, restaurado ou excluido definitivamente.
* Termo LGPD e laudos sao documentos associados ao aluno.
* Atestado justifica faltas dentro do periodo selecionado.
* Importacao contabiliza registros importados, ignorados e erros.
* Matriculas de oficina registram status `ATIVA`, `CONCLUIDA`, `EVADIDA` ou `CANCELADA`.

---

# 8. Relacao com Outros Modulos

* Turmas consomem alunos disponiveis e matriculas.
* Frequencias dependem de alunos matriculados.
* Certificados academicos dependem de aluno e turma.
* Dashboard agrega alunos ativos.
* Auditoria registra criacao, atualizacao, arquivamento e restauracao.

# Modulo: Apoiadores e Certificados

---

# 1. Visao Geral

## Objetivo

Documentar gestao de apoiadores, acoes de relacionamento, logos, exibicao publica, certificados de honraria, modelos de certificados, emissao academica e validacao publica.

## Responsabilidade

O modulo abrange `ApoiadoresService`, telas/admin de apoiadores, componentes de perfil, wizard, acoes e certificados, alem de `ModelosCertificadosService`, lista/formulario/preview de modelos e pagina publica de validacao.

## Fluxo de Funcionamento

Apoiadores sao cadastrados com tipo, dados de contato, logo e flag de exibicao publica. Acoes registram relacionamento/eventos. Certificados de honraria podem ser emitidos para apoiadores. Modelos de certificado sao cadastrados com artes/assinaturas e usados para emissao academica ou honraria. Validacao publica consulta codigo.

---

# 2. Arquitetura e Metodologias

## Padroes Arquiteturais Identificados

* Service Layer.
* Wizard form para apoiador.
* Component composition para perfil, acoes e certificados.
* FormData upload para logo/arte/assinaturas.
* Cache local em apoiadores.
* DTO pattern parcial para entidades.
* Public validation endpoint.

## Justificativa Tecnica

Apoiadores misturam CRM institucional e exibicao publica; separar componentes por perfil/acoes/certificados mantem cada fluxo pequeno. Certificados exigem arquivos e layout configuravel, por isso `FormData` e `layoutConfig` permitem flexibilidade sem recompilar frontend.

---

# 3. Fluxo Interno do Codigo

## Fluxo de Execucao

1. `/admin/apoiadores` carrega listagem.
2. `ApoiadoresService.listar` aplica `skip`, `take`, `tipo`, `search` e `ativo`.
3. Cadastro/edicao usa wizard/form e chama `criar` ou `atualizar`.
4. Logo e enviado por `uploadLogo`.
5. Acoes sao listadas/adicionadas/editadas/removidas por endpoints aninhados.
6. Certificados de apoiador sao listados e emitidos.
7. `/admin/modelos-certificados` lista modelos.
8. Formulario de modelo envia `FormData` com arte base, assinatura(s), texto e layout.
9. Preview/teste chama endpoint que retorna Blob.
10. Emissao academica usa turma/aluno.
11. Validacao publica chama `/api/certificados/validar/:codigo`.

## Dependencias Internas

* `ApoiadoresService`
* `ModelosCertificadosService`
* `TurmasService`
* `BeneficiariosService`
* `ToastService`
* `ConfirmDialogService`
* `StorageService` indiretamente para uploads gerais, quando aplicavel
* `SafeUrlPipe`

## Dependencias Externas

* Angular Forms.
* Angular Router.
* Angular HttpClient.
* RxJS.
* Browser Blob/PDF.

---

# 4. Dicionario Tecnico

## Variaveis

* `Apoiador.tipo`: `VOLUNTARIO|EMPRESA|IMPRENSA|PROFISSIONAL_LIBERAL|ONG|OUTRO`.
* `nomeRazaoSocial`, `nomeFantasia`: identidade do apoiador.
* `cpfCnpj`: documento.
* `contatoPessoa`, `telefone`, `email`: contato.
* `atividadeEspecialidade`: area de atuacao.
* `observacoes`: notas internas.
* `logoUrl`: imagem.
* `exibirNoSite`: controla publicacao.
* `ativo`: ciclo de vida.
* `AcaoApoiador.dataEvento`, `descricaoAcao`: historico CRM.
* `modeloCertificadoId`, `motivoPersonalizado`: dados para honraria.
* `ModeloCertificado.arteBaseUrl`: fundo do certificado.
* `assinaturaUrl`, `assinaturaUrl2`: assinaturas.
* `textoTemplate`: texto parametrizavel.
* `layoutConfig`: geometria/posicionamento.
* `tipo`: `ACADEMICO|HONRARIA`.
* `codigoValidacao`: codigo publico de autenticidade.

## Funcoes e Metodos

* `ApoiadoresService.listar`: lista com cache.
* `buscarPublicos`: apoiadores exibiveis no site.
* `obterPorId`, `criar`, `atualizar`, `excluir`, `inativar`, `reativar`.
* `uploadLogo`: envia logo via `FormData`.
* `buscarAcoes`, `adicionarAcao`, `editarAcao`, `removerAcao`.
* `listarCertificados`, `emitirCertificado`, `gerarPdfCertificado`.
* `ModelosCertificadosService.listar`, `buscarPorId`, `criar`, `atualizar`, `excluir`.
* `validarAutenticidade`: consulta codigo publico.
* `testarGeracaoGeometrica`: retorna Blob de teste.
* `emitirAcademico`: emite certificado para turma/aluno.

## Classes

* `ApoiadoresLista`
* `ApoiadorWizardFormComponent`
* `ApoiadorPerfilComponent`
* `ApoiadorAcoesComponent`
* `ApoiadorCertificadosComponent`
* `ApoiadoresService`
* `ModelosLista`
* `ModelosForm`
* `CertificadoPreviewComponent`
* `ModelosCertificadosService`
* `ValidarCertificado`

## Interfaces e Tipagens

* `Apoiador`
* `AcaoApoiador`
* `PaginatedResult<T>`
* `ModeloCertificado`
* payloads de emissao de certificado
* resposta de validacao `{ valido, nome, curso, data, tipo }`

---

# 5. Servicos e Integracoes

## APIs

* `GET /api/apoiadores`
* `GET /api/apoiadores/publicos`
* `GET /api/apoiadores/:id`
* `POST /api/apoiadores`
* `PATCH /api/apoiadores/:id`
* `DELETE /api/apoiadores/:id`
* `PATCH /api/apoiadores/:id/inativar`
* `PATCH /api/apoiadores/:id/reativar`
* `PATCH /api/apoiadores/:id/logo`
* `GET /api/apoiadores/:id/acoes`
* `POST /api/apoiadores/:id/acoes`
* `PATCH /api/apoiadores/:apoiadorId/acoes/:acaoId`
* `DELETE /api/apoiadores/:apoiadorId/acoes/:acaoId`
* `GET /api/apoiadores/:apoiadorId/certificados`
* `POST /api/apoiadores/:apoiadorId/certificados`
* `GET /api/apoiadores/:apoiadorId/certificados/:certId/pdf`
* `GET /api/modelos-certificados`
* `GET /api/modelos-certificados/:id`
* `POST /api/modelos-certificados`
* `PATCH /api/modelos-certificados/:id`
* `DELETE /api/modelos-certificados/:id`
* `POST /api/modelos-certificados/teste`
* `POST /api/modelos-certificados/emitir-academico`
* `GET /api/certificados/validar/:codigo`

## Banco de Dados

Entidades refletidas: apoiadores, acoes_apoiador, certificados, modelos_certificados, turmas, beneficiarios e arquivos de arte/assinatura.

## Servicos Externos

* Storage remoto para logos, artes e assinaturas.
* Gerador PDF no backend.

---

# 6. Seguranca e Qualidade

## Seguranca

* Rotas admin protegidas por RBAC.
* Validacao publica usa codigo e nao exige login.
* Uploads de arte/logo devem validar tipo/tamanho no backend.
* `SafeUrlPipe` deve proteger embeds/downloads.

## Qualidade

* Specs existem para apoiadores, componentes de certificados e modelos.
* Cache de apoiadores e limpo em mutacoes.
* Separacao por componentes reduz complexidade visual.

## Performance

* Cache local evita recarregamento repetido de apoiadores.
* `buscarPublicos` cacheia resultado publico.
* Preview por Blob evita salvar teste necessariamente.

---

# 7. Regras de Negocio

* Apoiador pode estar ativo/inativo.
* Somente apoiadores com `exibirNoSite` devem aparecer publicamente.
* Acoes registram historico de relacionamento.
* Certificado de honraria pode usar acao ou motivo personalizado.
* Modelo define tipo academico ou honraria.
* Certificado academico exige turma e aluno.
* Codigo de validacao confirma autenticidade publicamente.

---

# 8. Relacao com Outros Modulos

* Conteudo publico pode exibir apoiadores publicos.
* Certificados academicos dependem de turmas e beneficiarios.
* Usuarios/roles controlam acesso admin.
* Auditoria deve registrar acoes de CRUD/emissao se backend suportar.

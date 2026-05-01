# Modulo: Conteudo Publico, Comunicados e Contatos

---

# 1. Visao Geral

## Objetivo

Documentar paginas publicas, CMS administrativo de conteudo, comunicados/noticias, formulario Fale Conosco, mensagens recebidas e configuracoes dinamicas do site.

## Responsabilidade

O modulo abrange `PublicLayout`, paginas `Home`, `Sobre`, `Contato`, `NoticiasLista`, `NoticiaDetalhe`, `ValidarCertificado`, `NotFound`, `ConteudoSite`, componentes de configuracao de conteudo, `ComunicadosService`, `ContatoService`, `ContatosService` e `SiteConfigService`.

## Fluxo de Funcionamento

O publico navega por rotas abertas e consome secoes/configuracoes carregadas da API. Administradores/Comunicação editam conteudos, configuracoes, secoes e comunicados. Contatos enviados pelo site sao salvos via API e geridos na area admin.

---

# 2. Arquitetura e Metodologias

## Padroes Arquiteturais Identificados

* CMS lightweight via API.
* Reactive state com `BehaviorSubject` em `SiteConfigService`.
* Public/admin separation.
* Rich text editor via Quill.
* Service Layer para comunicados e contatos.
* Pure pipes para categoria e HTML preview.
* Lazy route loading.

## Justificativa Tecnica

Separar conteudo em secoes configuraveis permite atualizar textos/imagens sem deploy. `BehaviorSubject` sincroniza configuracao global e secoes entre componentes. Quill atende conteudo rico, enquanto sanitizacao/preview reduzem risco de HTML indesejado em listagens.

---

# 3. Fluxo Interno do Codigo

## Fluxo de Execucao

1. `App` carrega configs e secoes no bootstrap.
2. Paginas publicas assinam secoes via `SiteConfigService.getSecao(secao)`.
3. Home/Sobre exibem conteudo institucional dinamico e apoiadores publicos quando aplicavel.
4. Noticias listam comunicados via `ComunicadosService.listar`.
5. Detalhe de noticia usa `buscarPorId`.
6. Contato publico valida formulario e chama `ContatoService.enviarContato`.
7. Area admin `/admin/conteudo` carrega componentes de configuracao, contato, institucional, dinamico, sobre e comunicados.
8. Alteracoes chamam `salvarConfigs` ou `salvarSecao`; componente recarrega estado apos salvar.
9. `/admin/contatos` lista mensagens, marca como lida e exclui.

## Dependencias Internas

* `SiteConfigService`
* `ComunicadosService`
* `ContatoService`
* `ContatosService`
* `ApoiadoresService`
* `CategoryLabelPipe`
* `StripHtmlPipe`
* `generatePreview`
* `SafeHtmlPipe`
* `ToastService`

## Dependencias Externas

* Angular Forms.
* Angular Router.
* Angular HttpClient.
* RxJS.
* Quill/ngx-quill.
* DOMPurify conforme utilitarios/pipes de sanitizacao.

---

# 4. Dicionario Tecnico

## Variaveis

* `SiteConfigMap`: mapa chave/valor de configuracoes gerais.
* `SecoesMap`: mapa de secoes e campos.
* `configsSubject`: estado reativo de configs.
* `secoesSubject`: estado reativo de secoes.
* `corPrimaria`: chave que altera CSS root.
* `Comunicado.titulo`: titulo da noticia/comunicado.
* `Comunicado.conteudo`: HTML/conteudo rico.
* `Comunicado.categoria`: categoria editorial.
* `Comunicado.fixado`: destaque.
* `Comunicado.imagemCapa`: imagem.
* `ContatoPayload`: nome, email, telefone, assunto e mensagem.
* `Contato.lida`: status administrativo.

## Funcoes e Metodos

* `carregarConfigs`: busca configs e aplica cor.
* `getConfig`: leitura sincronica de config atual.
* `salvarConfigs`: envia patch de configuracoes.
* `carregarSecoes`: busca todas as secoes.
* `getSecao(secao)`: observable de uma secao.
* `salvarSecao(secao,conteudo)`: atualiza secao.
* `aplicarCorPrimaria`: altera `--color-primary` e `--color-primary-dark`.
* `ComunicadosService.listar/criar/buscarPorId/atualizar/excluir`.
* `ContatoService.enviarContato`.
* `ContatosService.listar/buscarPorId/marcarComoLida/excluir`.
* `generatePreview`: transforma HTML em resumo textual.

## Classes

* `Home`, `Sobre`, `Contato`, `NoticiasLista`, `NoticiaDetalhe`, `ValidarCertificado`, `NotFound`.
* `ConteudoSite`: container CMS admin.
* `ConteudoConfigComponent`: configuracoes globais.
* `ConteudoContatoComponent`: dados da pagina contato.
* `ConteudoDinamicoComponent`: secoes dinamicas.
* `ConteudoInstitucionalComponent`: dados institucionais.
* `ConteudoSobreComponent`: pagina sobre.
* `ComunicadosLista`: CRUD de comunicados.
* `ContatosLista`: administracao de mensagens.

## Interfaces e Tipagens

* `SiteConfigMap`
* `SecoesMap`
* `Comunicado`
* `ComunicadoResponse`
* `Contato`
* `ContatoPayload`

---

# 5. Servicos e Integracoes

## APIs

* `GET /api/site-config`
* `PATCH /api/site-config`
* `GET /api/site-config/secoes`
* `PATCH /api/site-config/secoes/:secao`
* `GET /api/comunicados`
* `POST /api/comunicados`
* `GET /api/comunicados/:id`
* `PATCH /api/comunicados/:id`
* `DELETE /api/comunicados/:id`
* `POST /api/contatos`
* `GET /api/contatos`
* `GET /api/contatos/:id`
* `PATCH /api/contatos/:id/lida`
* `DELETE /api/contatos/:id`

## Banco de Dados

Entidades refletidas: site_config, secoes_conteudo, comunicados/noticias e contatos.

## Servicos Externos

* Quill para edicao WYSIWYG.
* VLibras no HTML raiz beneficia paginas publicas.
* Google Fonts e assets publicos.

---

# 6. Seguranca e Qualidade

## Seguranca

* Admin de conteudo exige roles `ADMIN` ou `COMUNICACAO`.
* Contatos admin exigem roles `ADMIN`, `SECRETARIA` ou `COMUNICACAO`, alinhadas ao backend e ao menu lateral.
* Sanitizacao/strip de HTML reduz risco em previews.
* Conteudo rico deve ser sanitizado antes de renderizar.
* Formulario publico nao recebe token por regra de interceptor.

## Qualidade

* Specs existem para paginas publicas, componentes de conteudo, comunicados e contatos.
* `BehaviorSubject` permite estado compartilhado simples.
* Configuracoes sao salvas em batch chave/valor.

## Performance

* Configs/secoes carregadas uma vez no boot e reusadas por Observables.
* Lazy loading das paginas.
* Preview HTML evita renderizar conteudo rico em cards/listagens.

---

# 7. Regras de Negocio

* Conteudo publico pode ser alterado via admin sem redeploy.
* Comunicados possuem categoria e podem ser fixados.
* Mensagens de contato começam como nao lidas e podem ser marcadas como lidas.
* Cor primaria do site e configuravel por admin.
* Paginas publicas devem permanecer acessiveis sem login.

---

# 8. Pontos de Atencao

* `ComunicadosService.listar` usa `HttpParams` para pagina, limite, categoria e titulo.
* Renderizacao de HTML rico em paginas publicas usa `SafeHtmlPipe` para sanitizacao consistente.
* `aplicarCorPrimaria` normaliza hexadecimal, aplica guarda de documento e calcula canais RGB em ordem correta para escurecimento.
* Conteudo publico depende da disponibilidade da API; ideal ter fallback local.

---

# 9. Relacao com Outros Modulos

* `App` carrega config/secoes globais.
* Public layout hospeda paginas publicas.
* Apoiadores publicos podem aparecer no site.
* Certificados possuem pagina publica de validacao.
* Auditoria pode registrar edicoes de conteudo se backend implementar.

---

# 10. Resumo Tecnico Final

O modulo de conteudo publico e contatos tem criticidade media-alta por afetar imagem institucional, comunicacao externa e entrada de mensagens. A complexidade e media, com estado reativo e CMS leve. O principal risco e seguranca de HTML rico; manter sanitizacao, validacao backend e controle de roles e essencial.

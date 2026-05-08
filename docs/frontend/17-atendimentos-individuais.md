# Atendimentos Individuais

Modulo administrativo para criar e consultar acompanhamentos individuais entre professor e aluno.

## O que foi implementado

Foi criada uma feature Angular isolada para o modulo `atendimentos-individuais`, com:

- rotas proprias com lazy loading;
- guard de acesso por perfil;
- services HTTP separados por responsabilidade;
- models tipados para acompanhamento, atendimento, arquivo, filtros e relatorio;
- paginas para inicio, criacao, listagem, detalhe, novo atendimento, finalizados e relatorio;
- componentes reutilizaveis para cards, badges, timeline, autocomplete, formularios, upload, resumo e estado vazio;
- utils para formatacao e calculo de resumo;
- item no menu administrativo;
- integracao com o perfil do aluno;
- documentacao tecnica em `docs/frontend`.

## Por que foi feito assim

O modulo foi criado como feature separada porque atendimento individual nao pertence diretamente a turmas. A tela de alunos apenas consome o historico, mas a regra visual e a comunicacao com a API ficam concentradas em `src/app/features/atendimentos-individuais`.

Essa decisao evita espalhar regras de atendimento pelo modulo de alunos e deixa o fluxo pronto para evoluir com relatorios, anexos, permissao por professor e indicadores administrativos.

## Rotas

Rota principal:

- `/admin/atendimentos-individuais`

Perfis:

- `ADMIN`
- `SECRETARIA`
- `PROFESSOR`

Menu:

- Item `Atendimentos`, icone `clinical_notes`, visivel para os tres perfis.

Rotas internas:

- `/admin/atendimentos-individuais`
- `/admin/atendimentos-individuais/criar`
- `/admin/atendimentos-individuais/em-andamento`
- `/admin/atendimentos-individuais/finalizados`
- `/admin/atendimentos-individuais/relatorio`
- `/admin/atendimentos-individuais/:id`
- `/admin/atendimentos-individuais/:id/novo-atendimento`

## Estrutura da Feature

Base:

- `src/app/features/atendimentos-individuais/`

Pastas principais:

- `pages/`
- `components/`
- `services/`
- `models/`
- `guards/`
- `utils/`

Rotas:

- `atendimentos-individuais.routes.ts`

## Services HTTP

Arquivos:

- `services/atendimentos-individuais-api.service.ts`
- `services/relatorio-atendimento-api.service.ts`
- `services/arquivos-atendimento-api.service.ts`

Endpoints consumidos:

- `GET /api/atendimentos-individuais/acompanhamentos`
- `POST /api/atendimentos-individuais/acompanhamentos`
- `GET /api/atendimentos-individuais/acompanhamentos/:id`
- `PATCH /api/atendimentos-individuais/acompanhamentos/:id/assunto`
- `PATCH /api/atendimentos-individuais/acompanhamentos/:id/finalizar`
- `PATCH /api/atendimentos-individuais/acompanhamentos/:id/reabrir`
- `POST /api/atendimentos-individuais/acompanhamentos/:id/atendimentos`
- `GET /api/atendimentos-individuais/acompanhamentos/:id/atendimentos`
- `GET /api/atendimentos-individuais/relatorios`

## Paginas

Arquivos:

- `pages/atendimento-individual-home/`
- `pages/criar-acompanhamento/`
- `pages/acompanhamentos-em-andamento/`
- `pages/acompanhamentos-finalizados/`
- `pages/detalhe-acompanhamento/`
- `pages/novo-atendimento/`
- `pages/relatorio-atendimento/`

Funcionalidades iniciais:

- tela inicial do modulo;
- criar acompanhamento com primeiro atendimento opcional;
- listar em andamento;
- listar finalizados;
- detalhe com resumo e timeline;
- novo atendimento em acompanhamento existente;
- relatorio em tela com impressao;
- criar acompanhamento;
- selecionar aluno via autocomplete;
- selecionar professor para admin/secretaria;
- professor autenticado cria acompanhamento para si;
- registrar atendimento, falta justificada, falta nao justificada ou cancelamento;
- finalizar acompanhamento.

## Fluxos entregues

### Tela inicial

Mostra atalhos para criar acompanhamento, consultar acompanhamentos em andamento, consultar finalizados e acessar relatorio. Os cards usam links reais para manter navegacao por teclado e semantica adequada.

### Criar acompanhamento

Permite selecionar aluno, informar assunto principal e criar o acompanhamento. Admin e secretaria podem selecionar professor responsavel. Professor cria o acompanhamento vinculado a si mesmo. Tambem existe suporte para primeiro atendimento opcional no mesmo fluxo.

### Em andamento

Lista acompanhamentos ativos com busca por texto, cards responsivos, acoes para ver detalhe, criar novo atendimento e finalizar.

### Detalhe

Mostra aluno, professor, assunto, status, resumo quantitativo e timeline dos atendimentos. Tambem permite modificar assunto, finalizar e navegar para novo atendimento.

### Novo atendimento

Carrega o acompanhamento selecionado e reaproveita o formulario de atendimento. O formulario muda os campos conforme o tipo de registro: atendimento realizado, falta justificada, falta nao justificada ou cancelado.

### Finalizados

Mostra acompanhamentos encerrados em modo de consulta, preservando acesso ao detalhe e relatorio.

### Relatorio

Permite filtrar acompanhamentos por aluno, professor, periodo, status e tipo de registro. Exibe resumo em tela e botao para impressao.

## Componentes

- `aluno-autocomplete`
- `acompanhamento-card`
- `status-acompanhamento-badge`
- `tipo-registro-badge`
- `timeline-atendimentos`
- `atendimento-form`
- `filtros-atendimentos`
- `upload-arquivos-atendimento`
- `resumo-atendimentos`
- `empty-state-atendimentos`

## Acessibilidade e responsividade

O modulo foi montado seguindo o padrao visual existente do sistema, com atencao a:

- labels visiveis nos campos;
- botoes com texto claro;
- links reais nos cards navegaveis;
- estados de carregamento;
- estados vazios;
- mensagens de erro legiveis;
- foco preservado pelos componentes nativos;
- cards responsivos em vez de depender apenas de tabela grande.

O autocomplete de aluno foi preparado para busca por texto e feedback de carregamento ou nenhum resultado. A evolucao futura recomendada e adicionar navegacao por setas e anuncio `aria-live` com a quantidade de resultados.

## Perfil do Aluno

A tela de alunos passou a carregar o historico individual no modal de perfil.

Arquivo:

- `src/app/features/beneficiaries/beneficiary-list/beneficiary-list.ts`
- `src/app/features/beneficiaries/beneficiary-list/beneficiary-list.html`

Comportamento:

- ao abrir o perfil do aluno, o frontend chama `listar({ alunoId })`;
- exibe assunto, professor, data de inicio, total de registros e status.

## Decisoes

- O modulo fica separado de turmas.
- O historico aparece no perfil do aluno sem mover regras para o modulo de alunos.
- A regra de permissao principal fica no backend; o frontend apenas oculta ou simplifica campos.
- A rota e lazy-loaded para evitar aumentar o bundle inicial administrativo.
- O formulario de atendimento foi componentizado para ser usado tanto no primeiro atendimento quanto em novos registros.
- Os badges de status e tipo ficam isolados para padronizar cor, texto e acessibilidade.
- O perfil do aluno consome a API do modulo em vez de duplicar regra de negocio no modulo de alunos.

## Pontos futuros

- Integrar o upload de arquivo diretamente no fluxo de novo atendimento.
- Exportar relatorio em PDF pelo backend quando o endpoint estiver disponivel.
- Melhorar autocomplete com navegacao por setas e anuncio para leitor de tela.
- Criar filtros avancados compartilhados nas telas de listagem.
- Adicionar reabertura visual de acompanhamento finalizado para perfis autorizados.
- Adicionar testes de componentes e testes e2e dos fluxos principais.

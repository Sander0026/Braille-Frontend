# Relatorios Institucionais

---

# 1. Visao Geral

## Objetivo

A tela de relatorios ajuda a equipe administrativa a acompanhar alunos, turmas, evasoes,
atendimentos, impacto social e exportacoes institucionais.

Ela foi desenhada para nao carregar tudo de uma vez. Cada aba busca somente os dados necessarios
quando o usuario abre aquela aba.

## Rota

| Rota | Componente | Perfis |
|---|---|---|
| `/admin/relatorios` | `RelatoriosDashboard` | `ADMIN`, `SECRETARIA`, `COMUNICACAO` |

`COMUNICACAO` ve apenas a area de exportacoes e pode baixar somente o PDF institucional sem dados
sensiveis.

---

# 2. Onde Fica Cada Coisa

| Area | Arquivo/Pasta | Papel |
|---|---|---|
| Rota lazy | `src/app/app.routes.ts` | Carrega `RelatoriosDashboard` em `/admin/relatorios` |
| Menu lateral | `src/app/layouts/admin-layout/admin-layout.ts` | Exibe link Relatorios por role |
| Service HTTP | `src/app/core/services/relatorios.service.ts` | Interfaces TS, filtros e chamadas para `/api/relatorios` |
| Container da tela | `src/app/pages/admin/relatorios/relatorios-dashboard/` | Estado, cache por aba, filtros e exportacoes |
| Filtros | `components/relatorio-filtros/` | Drawer com filtros avancados e autocomplete |
| Cards gerais | `components/cards-indicadores/` | Indicadores da aba Visao Geral |
| Aba Alunos | `components/relatorio-alunos/` | Resumo, rankings e lista paginada sob demanda |
| Aba Turmas | `components/relatorio-turmas/` | Indicadores e tabela de turmas |
| Aba Evasoes | `components/relatorio-evasoes/` | Encerramentos e risco de evasao |
| Aba Atendimentos | `components/relatorio-atendimentos/` | Relatorio de atendimentos individuais |
| Aba Impacto Social | `components/relatorio-impacto-social/` | Indicadores agregados e comparativo |
| Aba Exportacoes | `components/relatorio-exportacoes/` | PDF publico e XLSX interno |
| Testes | `relatorios-dashboard/relatorios-dashboard.spec.ts` | Carregamento por aba, filtros, roles e exportacoes |

---

# 3. Service HTTP e Contratos

Arquivo: `src/app/core/services/relatorios.service.ts`

O service concentra:

- `RelatorioFiltro`;
- enums/tipos de status usados na tela;
- interfaces de resposta de cada endpoint;
- metodos HTTP;
- limpeza de filtros vazios antes de enviar para a API.

Principais metodos:

| Metodo | Endpoint |
|---|---|
| `resumo(filtro)` | `GET /api/relatorios/resumo` |
| `alunosResumo(filtro)` | `GET /api/relatorios/alunos/resumo` |
| `alunosDistribuicoes(filtro)` | `GET /api/relatorios/alunos/distribuicoes` |
| `alunosLista(filtro, page, limit)` | `GET /api/relatorios/alunos/lista` |
| `turmas(filtro)` | `GET /api/relatorios/turmas` |
| `evasoes(filtro)` | `GET /api/relatorios/evasoes` |
| `riscoEvasao(filtro)` | `GET /api/relatorios/risco-evasao` |
| `impactoSocial(filtro)` | `GET /api/relatorios/impacto-social` |
| `frequencias(filtro)` | `GET /api/relatorios/frequencias` |
| `buscarOpcoes*` | `GET /api/relatorios/opcoes/*` |
| `exportarPdf(filtro)` | `POST /api/relatorios/exportar/pdf` |
| `exportarXlsx(filtro)` | `POST /api/relatorios/exportar/xlsx` |

O metodo `alunos(filtro)` ainda existe no service apenas por compatibilidade com o endpoint legado
`GET /api/relatorios/alunos`. Nao use em novas telas; prefira `alunosResumo`,
`alunosDistribuicoes` e `alunosLista`.

O relatorio de atendimentos individuais usa outro service:

`src/app/features/atendimentos-individuais/services/relatorio-atendimento-api.service.ts`

Motivo: atendimentos tem um modulo proprio e um contrato especifico.

---

# 4. Estado e Carregamento por Aba

Arquivo principal: `relatorios-dashboard.ts`

O componente usa Angular Signals:

- `abaAtiva`
- `filtros`
- `abasCarregadas`
- `carregandoPorAba`
- `resumo`
- `alunosResumo`
- `alunosDistribuicoes`
- `alunosLista`
- `turmas`
- `evasoes`
- `riscoEvasao`
- `atendimentos`
- `impactoSocial`

## Regra central

Nao carregar relatorio que o usuario ainda nao abriu.

Fluxo:

```text
ngOnInit()
  -> configurarBuscaOpcoes()
  -> carregarAbaAtual()
       -> carregarAba(abaAtiva)
            -> chama apenas o endpoint daquela aba
```

## Mapa das abas

| Aba | Metodo chamado | Observacao |
|---|---|---|
| `visao-geral` | `carregarResumo()` | Carrega apenas `/resumo` |
| `alunos` | `carregarAlunos()` | Carrega resumo + distribuicoes; lista fica fechada |
| `turmas` | `carregarTurmas()` | Carrega `/turmas` |
| `evasoes` | `carregarEvasoes()` | Carrega `/evasoes` + `/risco-evasao` |
| `atendimentos` | `carregarAtendimentos()` | Usa service do modulo de atendimentos |
| `impacto-social` | `carregarImpactoSocial()` | Carrega `/impacto-social` |
| `exportacoes` | Nao carrega relatorio | Apenas botoes de download |

Quando filtros mudam:

```text
aplicarFiltros()
  -> normalizarFiltro()
  -> invalidarCacheRelatorios()
  -> carregarAbaAtual()
```

Isso limpa os dados antigos, mas recarrega somente a aba ativa.

---

# 5. Aba Alunos

Componente: `components/relatorio-alunos/`

A aba foi separada em partes para evitar travamentos:

1. Cards de resumo: `alunosResumo`.
2. Rankings Top 10: `alunosDistribuicoes`.
3. Lista detalhada: `alunosLista`, carregada apenas quando o usuario abre a secao.

Metodos no dashboard:

- `abrirListaAlunos()`
- `verMaisAlunos()`
- `carregarListaAlunos(page, acumular)`
- `resetarListaAlunos()`

Limite atual no frontend:

```ts
private readonly limiteAlunosLista = 20;
```

O backend tambem limita o maximo. Se mudar o limite visual, valide o limite no backend.

---

# 6. Aba Evasoes e Risco de Evasao

Componente: `components/relatorio-evasoes/`

A aba recebe dois blocos:

- `evasoes`: historico de encerramentos e indicadores de evasao;
- `risco`: alunos priorizados para busca ativa.

O risco de evasao mostra:

- total priorizado;
- contagem por nivel (`ALTO`, `MEDIO`, `BAIXO`);
- contagem por criterio;
- lista de alunos com turma, professor, taxa de presenca, faltas seguidas e criterios.

Criterios calculados no backend:

- 3 faltas seguidas;
- presenca abaixo de 60%;
- sem atendimento/frequencia ha mais de 30 dias;
- matricula ativa sem frequencia recente.

O frontend apenas apresenta o resultado. Nao replique essa regra na tela.

---

# 7. Aba Impacto Social

Componente: `components/relatorio-impacto-social/`

Mostra indicadores agregados para apoiadores, governo e comunicacao institucional:

- alunos atendidos;
- atendimentos individuais;
- turmas ofertadas;
- certificados emitidos;
- alunos com deficiencia visual atendidos;
- cidades alcancadas;
- bairros alcancados;
- taxa de permanencia;
- taxa de conclusao.

Cada metrica tem comparativo com periodo anterior:

- `SUBIU`
- `DESCEU`
- `ESTAVEL`

A decisao de comparar periodo atual com periodo anterior fica no backend. O frontend formata o texto
e a classe visual em:

- `textoComparativo(...)`
- `classeComparativo(...)`

---

# 8. Filtros Avancados e Autocomplete

Componente: `components/relatorio-filtros/`

O drawer emite:

- `aplicar`
- `limpar`
- `buscarTurmas`
- `buscarProfessores`
- `buscarAlunos`
- `buscarCidades`
- `buscarBairros`

O dashboard conecta os eventos a `Subject`s:

- `buscaTurmas$`
- `buscaProfessores$`
- `buscaAlunos$`
- `buscaCidades$`
- `buscaBairros$`

Pipeline:

```ts
debounceTime(300)
distinctUntilChanged()
switchMap(...)
catchError(() => of([]))
```

Regra: se o termo tiver menos de 2 caracteres, o frontend limpa as opcoes e nao chama a API.

Motivo: evitar carregar listas grandes de alunos, turmas ou professores ao abrir a tela.

## Cidade e bairro

Cidade e bairro tambem usam autocomplete. Quando uma cidade e selecionada, a busca de bairros pode
ser refinada por cidade.

Isso reduz variacoes como:

- `Serra`
- `serra`
- `SERRA`
- `Serra ES`

---

# 9. Exportacoes

Componente: `components/relatorio-exportacoes/`

## PDF publico/institucional

Metodo:

```ts
exportarPdf()
```

Permitido para:

- `ADMIN`
- `SECRETARIA`
- `COMUNICACAO`

Deve ser tratado como documento publico/agregado:

- sem CPF;
- sem RG;
- sem endereco completo;
- sem observacoes sensiveis;
- sem lista nominal detalhada.

## XLSX interno detalhado

Metodo:

```ts
exportarXlsx()
```

Permitido para:

- `ADMIN`
- `SECRETARIA`

O frontend bloqueia `COMUNICACAO` antes de chamar a API:

```ts
if (this.ehComunicacao) {
  this.toast.erro('Seu perfil pode exportar apenas o PDF institucional sem dados sensiveis.');
  return;
}
```

A API tambem valida permissao, entao esse bloqueio e apenas UX.

---

# 10. Papel do Perfil COMUNICACAO

Quando o usuario logado tem role `COMUNICACAO`:

- `tabs` contem somente `exportacoes`;
- `configurarBuscaOpcoes()` limpa opcoes e retorna;
- `carregarAba()` marca a aba como carregada sem buscar relatorios;
- `normalizarFiltro()` preserva apenas datas e fixa `statusAluno: 'TODOS'`;
- `exportarXlsx()` e bloqueado com toast.

Motivo: esse perfil pode emitir material institucional, mas nao deve navegar por dados internos.

---

# 11. Acessibilidade e Feedback

Pontos implementados:

- `ViewChild('anuncio')` para anunciar troca de aba;
- mensagens de erro por aba via `erro`;
- toasts para sucesso/erro de exportacao;
- estado `carregandoPorAba` separado por aba;
- labels de exportacao explicam diferenca entre PDF publico e XLSX interno.

Ao adicionar componentes, mantenha:

- estados vazios claros;
- botoes com texto compreensivel;
- `aria-label` quando a secao precisar de contexto;
- foco e leitura por tecnologias assistivas em erros importantes.

---

# 12. Como Evoluir

## Adicionar uma nova aba

1. Adicione o novo id no tipo `RelatorioAba`.
2. Inclua item em `tabs`.
3. Crie um signal para guardar a resposta.
4. Crie `carregarNovaAba()`.
5. Atualize `carregarAba(...)`.
6. Atualize `estadoAbas(...)`.
7. Adicione o `ngSwitchCase` no HTML.
8. Escreva teste garantindo que a aba nao carrega antes do clique.

## Adicionar novo filtro

1. Atualize `RelatorioFiltro`.
2. Atualize o componente `relatorio-filtros`.
3. Se o filtro deve ir para exportacoes, inclua em `RELATORIO_INSTITUCIONAL_KEYS`.
4. Atualize `filtrosAtivos`.
5. Atualize `normalizarFiltro` se houver regra por perfil.
6. Garanta suporte no backend.

## Adicionar metrica a Impacto Social

1. Atualize `RelatorioImpactoMetricas`.
2. Atualize o backend.
3. Inclua item em `metricas` no componente `RelatorioImpactoSocial`.
4. Atualize testes e valores esperados.

---

# 13. Testes

Teste principal da tela:

```bash
npx ng test --include=src/app/pages/admin/relatorios/relatorios-dashboard/relatorios-dashboard.spec.ts
```

Build:

```bash
npm run build
```

Cenarios que devem permanecer cobertos:

- carregamento inicial busca apenas o resumo;
- abas nao abertas nao chamam a API;
- filtros invalidam cache e recarregam somente a aba ativa;
- aba Evasoes carrega evasoes e risco de evasao juntos;
- aba Impacto Social carrega somente ao ser aberta;
- aba Alunos nao carrega lista detalhada automaticamente;
- `COMUNICACAO` nao chama relatorios internos;
- PDF e XLSX chamam endpoints corretos;
- `COMUNICACAO` nao exporta XLSX.

---

# 14. Pontos de Atencao

- Nao coloque `forkJoin` global para carregar todas as abas no `ngOnInit`.
- Nao transforme autocomplete em select populado automaticamente.
- Nao duplique regras de negocio do backend no frontend, especialmente risco de evasao.
- Nao mostre dados sensiveis no componente de exportacao publica.
- Nao carregue lista detalhada de alunos sem acao explicita do usuario.
- Ao mexer nos filtros, garanta que `limparFiltro` nao envie strings vazias para a API.

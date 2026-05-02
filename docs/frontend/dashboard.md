# Modulo: Dashboard Administrativo

---

# 1. Visao Geral

## Objetivo

Documentar o dashboard administrativo, seus cards estatisticos, acoes rapidas, servico de configuracao visual e integracao com estatisticas da API.

## Responsabilidade

O dashboard e a primeira tela interna apos login. Ele apresenta indicadores principais e atalhos para operacoes recorrentes, consumindo `DashboardService` e componentes em `src/app/features/dashboard`.

## Fluxo de Funcionamento

Ao acessar `/admin/dashboard`, o roteador carrega `Dashboard`. O componente consulta estatisticas, combina com configuracao visual de cards/acoes e renderiza `StatCardComponent` e `QuickActionComponent`.

---

# 2. Arquitetura e Metodologias

## Padroes Arquiteturais Identificados

* Feature module folder por dominio.
* Presentational components para cards e acoes.
* Service Layer para dados de estatisticas.
* Configuration service para metadados visuais.
* Lazy loading via rota standalone.

## Justificativa Tecnica

Separar componentes de cards/acoes da pagina principal deixa o dashboard extensivel. O servico de estatisticas possui cache de 5 minutos, adequado para indicadores agregados que nao precisam atualizar a cada navegacao.

---

# 3. Fluxo Interno do Codigo

## Fluxo de Execucao

1. Usuario autenticado acessa `/admin/dashboard`.
2. `Dashboard` injeta servicos necessarios.
3. `DashboardService.getEstatisticas()` consulta `/api/dashboard/estatisticas`.
4. `DashboardConfigService` fornece configuracao visual dos indicadores e atalhos.
5. Cards exibem numeros de alunos ativos, turmas ativas, membros da equipe e comunicados gerais.
6. Acoes rapidas navegam para rotas administrativas como alunos, turmas, frequencias e conteudo.
7. Em erro, a tela deve manter feedback visual por toast/interceptor ou estado local.

## Dependencias Internas

* `DashboardService`
* `DashboardConfigService`
* `StatCardComponent`
* `QuickActionComponent`
* `DashboardStats`
* rotas admin

## Dependencias Externas

* Angular core/common/router.
* RxJS.

---

# 4. Dicionario Tecnico

## Variaveis

* `alunosAtivos`: quantidade de beneficiarios ativos.
* `turmasAtivas`: quantidade de turmas ativas.
* `membrosEquipe`: quantidade de usuarios/equipe.
* `comunicadosGerais`: quantidade de comunicados.
* `cache`: objeto local em `DashboardService` com Observable e expiracao.
* `cacheTimeMs`: 5 minutos.

## Funcoes e Metodos

* `getEstatisticas()`: retorna estatisticas cacheadas ou busca da API.
* `limparCache()`: limpa indicadores; chamado por servicos que alteram dados relevantes.
* Metodos do componente `Dashboard`: carregam dados e expõem configuracao de render.

## Classes

* `DashboardService`: acesso HTTP e cache de estatisticas.
* `Dashboard`: container da tela.
* `StatCardComponent`: card de metrica.
* `QuickActionComponent`: acao de navegacao.
* `DashboardConfigService`: metadados de UI.

## Interfaces e Tipagens

* `DashboardStats`: `{ alunosAtivos, turmasAtivas, membrosEquipe, comunicadosGerais }`.
* Modelos em `dashboard.models.ts`: contratos visuais de card e acao.

---

# 5. Servicos e Integracoes

## APIs

* `GET /api/dashboard/estatisticas`: retorna indicadores agregados.

## Banco de Dados

Nao acessa diretamente. Indicadores refletem agregacoes do backend sobre alunos, turmas, usuarios e comunicados.

## Servicos Externos

Nao ha integracao externa direta.

---

# 6. Seguranca e Qualidade

## Seguranca

* Rota protegida por `authGuard` e `roleGuard` no pai `/admin`.
* JWT aplicado por interceptor.
* Dados exibidos sao agregados, reduzindo exposicao de dados pessoais.

## Qualidade

* Existe spec para dashboard.
* Componentizacao reduz duplicacao visual.
* Cache com `shareReplay(1)` evita chamadas repetidas.

## Performance

* Cache de 5 minutos para estatisticas.
* Lazy loading de rota.
* Componentes pequenos favorecem OnPush/isolamento.

---

# 7. Regras de Negocio

* Dashboard deve ser tela inicial do admin.
* Indicadores refletem somente contagens agregadas.
* Atualizacoes de beneficiarios, turmas, usuarios e comunicados limpam cache do dashboard para refletir dados relevantes.
* Acoes rapidas devem respeitar permissao real da rota, mesmo que aparecam visualmente.

---

# 8. Relacao com Outros Modulos

* Consome `DashboardService`.
* E alvo de redirecionamento do `roleGuard` quando acesso e negado.
* Recebe invalidacao indireta de `BeneficiariosService`, `TurmasService`, `UsuariosService` e `ComunicadosService`.
* Navega para dominios de alunos, turmas, frequencias, conteudo e usuarios.

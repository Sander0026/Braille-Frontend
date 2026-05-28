# Linha do Tempo do Aluno

---

# 1. Visao Geral

A linha do tempo do aluno possui tela propria em:

`/admin/alunos/:id/linha-tempo`

Ela consome eventos persistidos no backend, armazenados em `EventoLinhaTempoAluno`, e exibe um
historico institucional unico: cadastro, matriculas, frequencias, atendimentos, PDI, documentos,
certificados, risco/evasao, situacao do aluno e observacoes manuais.

O perfil/modal do aluno nao renderiza mais a timeline completa. Ele mostra um card de acesso para a
tela dedicada, mantendo o perfil mais limpo.

---

# 2. Onde Fica Cada Coisa

| Area | Arquivo | Papel |
|---|---|---|
| Rotas | `src/app/app.routes.ts` | Define `/admin/alunos/:id/linha-tempo` para `ADMIN`, `SECRETARIA` e `PROFESSOR` |
| Servico HTTP | `src/app/core/services/beneficiarios.service.ts` | Tipos e chamadas `linhaTempo`, `linhaTempoResumo`, `linhaTempoTurmas`, `criarEventoLinhaTempoManual` |
| Pagina dedicada | `src/app/features/beneficiaries/aluno-linha-tempo-page/` | Tela completa da timeline |
| Componente reutilizavel | `src/app/features/beneficiaries/components/aluno-linha-tempo/` | Lista, filtros, paginacao e estados |
| Perfil do aluno | `src/app/features/beneficiaries/beneficiary-list/` | Card com botao para abrir a timeline completa |

---

# 3. APIs Consumidas

## `GET /api/beneficiaries/:id/linha-tempo`

Usado pelo componente `app-aluno-linha-tempo`.

Parametros:

- `page`
- `limit`
- `tipo`
- `dataInicio`
- `dataFim`
- `turmaId`

O filtro visual por categoria transforma grupos em listas de tipos. Exemplo:

`PDI` envia `PDI_CRIADO,PDI_META_CRIADA,PDI_META_ATUALIZADA,PDI_EVOLUCAO`.

## `GET /api/beneficiaries/:id/linha-tempo/resumo`

Usado pela pagina dedicada para preencher cards de resumo sem carregar muitos eventos.

Contrato:

```ts
export interface LinhaTempoAlunoResumo {
  totalEventos: number;
  ultimaFrequencia?: string;
  ultimoAtendimento?: string;
  ultimoPdi?: string;
  ultimaAcaoRisco?: string;
}
```

## `GET /api/beneficiaries/:id/linha-tempo/turmas`

Usado pelo filtro avancado de turma na tela completa. A UI mostra nomes de turmas do aluno em vez
de exigir UUID manual.

Contrato:

```ts
export interface LinhaTempoTurmaResumo {
  id: string;
  nome: string;
}
```

## `POST /api/beneficiaries/:id/linha-tempo/manual`

Contrato ja exposto no service Angular para observacoes manuais:

```ts
export interface CriarEventoLinhaTempoManualPayload {
  tipo: 'OBSERVACAO_MANUAL';
  dataEvento?: string;
  titulo: string;
  descricao?: string;
  turmaId?: string;
  sensivel?: boolean;
}
```

A tela completa possui o botao "Adicionar observacao", com atalhos para reuniao com familia,
entrega de material, contato com responsavel, encaminhamento externo, orientacao da secretaria e
observacao administrativa.

---

# 4. Componente `app-aluno-linha-tempo`

Inputs:

| Input | Tipo | Uso |
|---|---|---|
| `alunoId` | `string` | ID do aluno |
| `modo` | `'compacto' | 'completo'` | Controla layout e filtros avancados |
| `refreshKey` | `number` | Forca recarregamento quando muda |

Modo `compacto`:

- pensado para encaixes menores;
- sem filtros avancados de data/turma.

Modo `completo`:

- usado na pagina propria;
- exibe filtros avancados de periodo e turma;
- mantem paginacao com "Ver mais".

---

# 5. Tela Dedicada

Arquivos:

- `aluno-linha-tempo-page.ts`
- `aluno-linha-tempo-page.html`
- `aluno-linha-tempo-page.scss`

Responsabilidades:

- ler `id` da rota;
- carregar dados basicos do aluno;
- carregar resumo via `/linha-tempo/resumo`;
- renderizar cards de ultimo atendimento, ultima frequencia, PDI e risco;
- renderizar `app-aluno-linha-tempo` em `modo="completo"`;
- permitir atualizacao manual da tela;
- registrar observacoes manuais institucionais;
- indicar que a exportacao PDF esta "Em breve".

---

# 6. Integracao no Perfil do Aluno

O perfil nao deve incluir a timeline completa:

```html
<app-aluno-linha-tempo [alunoId]="alunoSelecionado.id"></app-aluno-linha-tempo>
```

No lugar, usa card com botao:

```html
<button type="button" (click)="abrirLinhaTempoAluno(alunoSelecionado.id)">
  Abrir linha do tempo completa
</button>
```

Metodo:

```ts
abrirLinhaTempoAluno(alunoId: string): void {
  this.fecharModal();
  this.router.navigate(['/admin/alunos', alunoId, 'linha-tempo']);
}
```

---

# 7. Permissoes e LGPD

A regra principal fica no backend. O frontend apenas renderiza a resposta recebida.

Regras efetivas:

- `ADMIN`: ve tudo;
- `SECRETARIA`: ve tudo;
- `PROFESSOR`: acessa apenas alunos vinculados;
- `COMUNICACAO`: nao acessa linha do tempo individual.

Eventos sensiveis podem chegar mascarados para professor:

- `LAUDO`;
- `ATESTADO`;
- observacoes clinicas;
- dados medicos;
- observacoes manuais sensiveis.

O componente nao deve exibir diretamente URLs ou metadados clinicos. Se `metadata.sensivel` e
`metadata.restrito` vierem na resposta, a UI deve manter apenas o texto resumido enviado pela API.

---

# 8. Checklist de Manutencao

Ao evoluir a tela:

1. Reusar `BeneficiariosService` em vez de montar URLs manualmente.
2. Nao duplicar regra de permissao no frontend.
3. Nao renderizar campos medicos de `metadata`.
4. Manter `modo="completo"` apenas na tela dedicada.
5. Ao adicionar novo tipo de evento, atualizar labels e classes em `aluno-linha-tempo.ts`.

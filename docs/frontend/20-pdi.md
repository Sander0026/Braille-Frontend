# PDI / Plano Individual do Aluno

---

# 1. Visao Geral

O PDI fica integrado ao perfil do aluno na listagem de beneficiarios. Ele permite criar um plano
individual, definir metas, registrar evolucoes e concluir o acompanhamento mantendo historico.

Neste primeiro recorte, a funcionalidade fica dentro do modal de perfil do aluno para evitar criar
uma area administrativa separada antes de validar o fluxo com secretaria/professores.

---

# 2. Onde Fica Cada Coisa

| Area | Arquivo | Papel |
|---|---|---|
| Service HTTP | `src/app/core/services/pdi.service.ts` | Tipos TS e chamadas para `/api/pdi` |
| UI no perfil do aluno | `src/app/features/beneficiaries/beneficiary-list/beneficiary-list.html` | Secao PDI, tabelas de metas/evolucoes e modais |
| Estado e acoes | `src/app/features/beneficiaries/beneficiary-list/beneficiary-list.ts` | Carregamento, criacao, meta, evolucao e conclusao |
| Estilos | `src/app/features/beneficiaries/beneficiary-list/beneficiary-list.scss` | Card, formularios e status do PDI |

---

# 3. Service HTTP

Arquivo: `src/app/core/services/pdi.service.ts`

Principais metodos:

| Metodo | Endpoint |
|---|---|
| `listar(params)` | `GET /api/pdi` |
| `criar(payload)` | `POST /api/pdi` |
| `buscar(id)` | `GET /api/pdi/:id` |
| `atualizar(id, payload)` | `PATCH /api/pdi/:id` |
| `arquivar(id)` | `DELETE /api/pdi/:id` |
| `listarPorAluno(alunoId)` | `GET /api/pdi/aluno/:alunoId` |
| `buscarAtivoPorAluno(alunoId)` | `GET /api/pdi/aluno/:alunoId/ativo` |
| `criarMeta(pdiId, payload)` | `POST /api/pdi/:id/metas` |
| `atualizarMeta(pdiId, metaId, payload)` | `PATCH /api/pdi/:id/metas/:metaId` |
| `criarEvolucao(pdiId, payload)` | `POST /api/pdi/:id/evolucoes` |

O service limpa campos vazios antes de enviar payloads para a API.

---

# 4. Fluxo no Perfil do Aluno

Ao abrir o perfil:

```text
abrirModal(aluno)
  -> buscarPorId(aluno.id)
  -> carregarAcompanhamentosIndividuaisDoAluno(aluno.id)
  -> carregarPdisDoAluno(aluno.id)
```

`carregarPdisDoAluno` preenche:

- `pdisAluno`: historico completo;
- `pdiAtivoAluno`: primeiro PDI com status `ATIVO`.

A tela mostra:

- card do PDI ativo;
- objetivo geral;
- professor responsavel;
- metas;
- evolucoes;
- quantidade de PDIs preservados no historico quando nao ha PDI ativo.

---

# 5. Acoes Disponiveis

Quando nao ha PDI ativo:

- `Criar PDI`.

Quando ha PDI ativo:

- `Adicionar meta`;
- `Adicionar evolucao`;
- alterar status da meta pela tabela;
- `Concluir PDI`.

Concluir envia:

```ts
{
  status: 'CONCLUIDO',
  dataConclusao: hojeIso()
}
```

A API exige `dataConclusao`, entao a tela sempre envia a data atual.

---

# 6. Decisoes de UX

- O PDI foi integrado ao perfil do aluno, nao em uma nova rota.
- Professor responsavel aparece no card, mas a primeira tela nao carrega seletor de professor para
  reduzir complexidade.
- Metas usam select inline de status para acelerar acompanhamento.
- Evolucoes ficam em tabela historica simples.

---

# 7. Pontos de Atencao

- Nao duplique regra de permissao no frontend; a API valida professor/admin/secretaria.
- Nao remova o historico `pdisAluno`; ele sera importante para relatorios e linha do tempo.
- A integracao com atendimentos individuais ainda nao foi feita. Hoje o usuario registra evolucao
  manualmente dentro do PDI.
- Quando for criada uma tela dedicada em `/admin/pdi`, reaproveite `PdiService`.

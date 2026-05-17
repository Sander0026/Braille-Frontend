# Linha do Tempo do Aluno

---

# 1. Visao Geral

A linha do tempo fica dentro do perfil do aluno e mostra, em uma unica lista, eventos de cadastro,
matriculas, frequencias, atendimentos, PDI, documentos, certificados, risco/evasao e situacao
institucional.

O objetivo e reduzir a necessidade de abrir varias telas para entender a historia do aluno na
instituicao.

---

# 2. Onde Fica Cada Coisa

| Area | Arquivo | Papel |
|---|---|---|
| Tipos e chamada HTTP | `src/app/core/services/beneficiarios.service.ts` | `linhaTempo(id, query)` e interfaces da resposta |
| Componente | `src/app/features/beneficiaries/components/aluno-linha-tempo/aluno-linha-tempo.ts` | Estado, filtros, paginacao e carregamento |
| Template | `src/app/features/beneficiaries/components/aluno-linha-tempo/aluno-linha-tempo.html` | Lista visual da timeline e botao "Ver mais" |
| Estilos | `src/app/features/beneficiaries/components/aluno-linha-tempo/aluno-linha-tempo.scss` | Marcadores, grupos por ano e chips de filtro |
| Integracao no perfil | `src/app/features/beneficiaries/beneficiary-list/beneficiary-list.html` | Inclui `<app-aluno-linha-tempo>` no modal do aluno |

---

# 3. API Consumida

Endpoint:

`GET /api/beneficiaries/:id/linha-tempo`

Query usada pelo componente:

- `page`
- `limit`
- `tipo`

O filtro visual por categoria transforma grupos em listas de tipos. Exemplo:

`PDI` envia `PDI_CRIADO,PDI_META_ATUALIZADA,PDI_EVOLUCAO`.

---

# 4. Filtros da UI

O componente possui filtros:

- Todos
- Matriculas
- Frequencia
- Atendimentos
- PDI
- Documentos
- Certificados
- Risco/Evasao

Ao trocar o filtro, a lista e recarregada a partir da pagina 1. O botao "Ver mais" carrega a proxima
pagina mantendo os itens ja exibidos.

---

# 5. Permissoes e Dados Sensiveis

A permissao principal fica no backend. O frontend apenas renderiza a resposta recebida.

O backend bloqueia `COMUNICACAO`, restringe professor por vinculo com aluno e mascara detalhes
sensiveis de laudo para professor. Por isso, nao adicione no componente exibicao direta de URLs ou
campos clinicos vindos de `metadata` sem revisar a regra de permissao correspondente.

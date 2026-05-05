# Módulo: Turmas e Frequências

---

# 1. Visão Geral

## Objetivo

Gerenciar o ciclo completo das oficinas/turmas do Instituto (criação, matrícula, status)
e registrar a presença dos alunos por chamada diária com suporte a diário fechado/reaberto.

## Responsabilidade

Dois domínios intimamente relacionados: **Turmas** define quem estuda o quê e quando;
**Frequências** registra dia a dia se cada aluno esteve presente.

---

# 2. Turmas

## 2.1 `TurmasLista` — Listagem e Gerenciamento

**Arquivo:** `src/app/pages/admin/turmas/turmas-lista/`
**Rota:** `/admin/turmas`

### Funcionalidades
- Lista de turmas com filtros: nome, status, professor
- Criação e edição via `TurmaFormModal` (modal inline — sem navegar para nova rota)
- Arquivar, restaurar, ocultar turmas
- Gerenciar matrículas: adicionar/remover alunos
- Mudança de status: `PREVISTA → ANDAMENTO → CONCLUIDA | CANCELADA`
- `descarteGuard` ativo na rota

### Máquina de Estados das Turmas

```
PREVISTA ──────────► ANDAMENTO ──────────► CONCLUIDA
    │                    │
    └────────────────────┴────────────────► CANCELADA
```

### Grade Horária

Cada turma tem uma `GradeHorariaDto` com os dias e horários das aulas.
O backend valida **colisão de horários** por professor — o frontend exibe o erro retornado pela API.

```typescript
interface GradeHorariaDto {
  diaSemana: number;     // 0=Dom, 1=Seg, ..., 6=Sáb
  horaInicio: number;    // minutos desde meia-noite (ex: 480 = 08:00)
  horaFim: number;
}
```

> **Nota:** horários são armazenados em **minutos** (não string HH:MM) — decisão documentada
> em `docs/backend/11-decisoes-tecnicas.md` (ADR-006).

---

# 3. Frequências

## 3.1 `FrequenciasLista` — Chamada Diária

**Arquivo:** `src/app/pages/admin/frequencias/frequencias-lista/`
**Rota:** `/admin/frequencias`

### Fluxo de Chamada

```
Professor seleciona turma + data
    ↓
FrequenciasService.getResumo(turmaId, data)
    ↓
Exibe lista de alunos com toggle Presente/Ausente
    ↓
Usuário marca presença → salva em lote
    ↓
POST /api/frequencias/lote
    ↓
Opcional: fechar diário → imutável até reabrir (ADMIN)
```

### Diário de Classe

O diário pode ser **fechado** após a chamada do dia, tornando os registros imutáveis.
Apenas `ADMIN` pode reabrir um diário fechado.

```typescript
fecharDiario(turmaId: string, data: string): Observable<void>
  POST /api/frequencias/diario/fechar/:turmaId/:data

reabrirDiario(turmaId: string, data: string): Observable<void>
  POST /api/frequencias/diario/reabrir/:turmaId/:data
```

## 3.2 Histórico de Frequências

**Arquivos:** `src/app/pages/admin/frequencias/components/frequencia-historico/` e `frequencia-historico-modal/`

### Visualização Detalhada da Chamada

Ao consultar o histórico de chamadas de uma oficina, o sistema permite a visualização detalhada daquele dia específico por meio de um modal interativo.

- **Modal Centralizado:** A exibição ocorre em um modal padronizado, perfeitamente centralizado (vertical e horizontalmente) na tela, utilizando um fundo escurecido (overlay). Isso aprimora a usabilidade e mantém o foco visual nas informações da chamada.
- **Listagem Nominal de Presença:** O modal exibe a **lista completa e detalhada** de todos os alunos da chamada, complementando os totalizadores (presentes e faltas).
- **Status Individual:** Cada aluno é exibido com seu nome e um *badge* visual (com uso de cores semânticas e ícones) que indica claramente o status daquele dia (**Presente** ou **Falta**).

**Objetivo da Funcionalidade:** Esse detalhamento nominal garante maior **rastreabilidade e eficiência na auditoria**, permitindo que a administração consulte e comprove o status de um aluno específico de forma imediata.

### Impacto e Relação com Turmas

A exibição detalhada extrai e processa os dados vinculados de matrícula (nomes e avatares dos alunos) pertencentes à **Turma** no dia da chamada. Isso garante total consistência informacional entre os módulos, refletindo a base centralizada de beneficiários do sistema.

## 3.3 Outros Recursos

### Relatório Individual

Gera relatório de presença/ausência de um aluno em uma turma específica.
Usado para impressão e envio aos responsáveis.

```typescript
getRelatorioAluno(turmaId, alunoId): Observable<ResumoFrequencia>
  GET /api/frequencias/relatorio/turma/:turmaId/aluno/:alunoId
```

### Integração com Atestados

Quando um atestado médico é registrado para um aluno, o sistema
**justifica automaticamente** as faltas dentro do período do atestado.
O frontend exibe `preview` de faltas justificáveis antes de salvar o atestado.

---

# 4. Segurança e Acessibilidade

## Segurança

- **Turmas:** `descarteGuard` protege o `TurmaFormModal` contra fechamento acidental
- **Frequências:** diário fechado é imutável para não-ADMINs — proteção por regra de negócio no backend

## Acessibilidade

- Toggle de presença tem `aria-checked` e `aria-label="Marcar presença de [nome]"`
- Feedback de chamada salva anunciado via `LiveAnnouncer`
- `Alt+Shift+O` navega para turmas; `Alt+Shift+F` navega para frequências

---

# 5. Pontos de Atenção

- **Colisão de horários** é validada no backend — o frontend mostra a mensagem de erro da API.
  O UX poderia ser melhorado com validação prévia no formulário (débito técnico).
- **Chamada em lote** (`salvarLote`) é uma transação atômica no backend — se um registro falhar,
  nenhum é salvo. O frontend deve informar isso ao usuário.
- **Cache de resumo** (5 min) pode exibir dados desatualizados se outro professor
  lançar chamada simultaneamente.

---

# 6. Relação com Outros Módulos

| Módulo | Relação |
|---|---|
| `TurmasService` | Toda a comunicação com `/api/turmas` |
| `FrequenciasService` | Chamadas, resumo, diário e relatório |
| `AtestadosService` | Justificativa automática de faltas por atestado |
| `BeneficiariosService` | Lista alunos disponíveis para matrícula |
| `descarteGuard` | Proteção de formulários de turma |
| `HotkeysService` | `Alt+Shift+O` e `Alt+Shift+F` |

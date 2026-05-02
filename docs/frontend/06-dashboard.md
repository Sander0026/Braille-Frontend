# Módulo: Dashboard Administrativo

---

# 1. Visão Geral

## Objetivo

Exibir uma visão consolidada e em tempo real do estado operacional do Instituto:
total de alunos ativos, turmas em andamento, frequência da semana e ações rápidas.

## Responsabilidade

O Dashboard é a **primeira tela** que o usuário vê após login. Deve carregar rapidamente,
fornecer indicadores-chave (KPIs) e oferecer atalhos para as ações mais comuns.

## Fluxo de Funcionamento

```
AdminLayout inicializa → Router carrega Dashboard (lazy)
    ↓
DashboardComponent.ngOnInit()
    ↓
DashboardService.getStats() → verifica cache (TTL 5 min)
    ↓
Exibe cards de KPIs + atalhos rápidos + gráfico de frequência
```

---

# 2. Arquitetura e Metodologias

## Padrões Identificados

- **Signals** — estado de loading e dados dos KPIs reativos
- **Cache Aside** — `DashboardService` com TTL de 5 minutos
- **Smart Component** — Dashboard orquestra a carga dos dados
- **Lazy Loading** — carregado apenas quando o usuário acessa `/admin/dashboard`

---

# 3. Serviço e Endpoint

**`DashboardService`** — `src/app/core/services/dashboard.service.ts`

```typescript
getStats(): Observable<DashboardStats>
  GET /api/dashboard/stats
```

**Interface `DashboardStats`:**
```typescript
interface DashboardStats {
  totalAlunos: number;
  alunosAtivos: number;
  turmasEmAndamento: number;
  frequenciaMedia: number;   // percentual da semana
  comunicadosRecentes: number;
}
```

**Cache:** TTL de 5 minutos. Invalidado por `BeneficiariosService.limparCache()`.

---

# 4. Componente

**Arquivo:** `src/app/features/dashboard/dashboard.ts`

### Elementos visuais
- Cards de KPIs (Alunos Ativos, Turmas, Frequência, Comunicados)
- Atalhos rápidos: "Novo Aluno", "Nova Chamada", "Ver Relatórios"
- Gráfico de presença da semana (renderizado com dados da API)
- Mensagem de boas-vindas com nome do usuário autenticado

### Acessibilidade
- `aria-live="polite"` na região de KPIs (atualiza quando dados carregam)
- Ícones decorativos com `aria-hidden="true"`
- Atalhos de teclado globais (`Alt+Shift+D` retorna ao dashboard)

---

# 5. Segurança e Performance

- **Sem role específico** — todos os autenticados veem o dashboard
- **Cache de 5 min** — evita re-fetch a cada navegação interna
- **Invalidação coordenada** com `BeneficiariosService` — dados ficam consistentes após criar/inativar alunos

---

# 6. Pontos de Atenção

- `DashboardService` não é invalidado por mutações em `TurmasService` ou `UsuariosService` —
  os contadores podem estar defasados por até 5 minutos após essas operações.
- Se o backend estiver lento (Render cold start), o dashboard pode exibir skeleton por vários segundos.

---

# 7. Relação com Outros Módulos

| Módulo | Relação |
|---|---|
| `DashboardService` | Fonte de dados dos KPIs |
| `AuthService.getUser()` | Nome de boas-vindas |
| `BeneficiariosService` | Invalida cache do dashboard após mutações |
| `HotkeysService` | `Alt+Shift+D` retorna ao dashboard |

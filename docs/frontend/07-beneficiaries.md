# Módulo: Beneficiários e Cadastro de Alunos

---

# 1. Visão Geral

## Objetivo

Gerenciar o ciclo de vida completo de alunos/beneficiários do Instituto:
cadastro, listagem paginada com filtros, edição, inativação, restauração,
importação em lote via planilha e upload de documentos (LGPD, atestados, laudos).

## Responsabilidade

É o **módulo central** do sistema — onde a equipe administrativa passa a maior parte
do tempo. Suporta o fluxo completo de matrícula de um novo aluno até seu desligamento.

## Fluxo de Funcionamento

```
/admin/alunos → BeneficiaryList (listagem paginada + filtros)
    ↓ (clica "Novo Aluno" ou Alt+Shift+N)
/admin/alunos/cadastro → BeneficiaryFormComponent (wizard multi-step)
    ↓ (salva)
API cria aluno → limparCache() → lista atualizada
```

---

# 2. Arquitetura e Metodologias

## Padrões Identificados

- **Wizard Multi-Step** — formulário de cadastro dividido em seções
- **Cache Aside com invalidação** — `Map` com TTL de 2 minutos
- **Optimistic UI** — feedback imediato antes da confirmação da API
- **descarteGuard** — protege dados não salvos ao navegar
- **Reactive Forms** — `FormBuilder` com `senhaForteValidator` e validações LGPD

---

# 3. Componentes

## 3.1 `BeneficiaryList` — Listagem

**Arquivo:** `src/app/features/beneficiaries/beneficiary-list/`

### Funcionalidades
- Tabela paginada (page, limit configurável)
- Busca por nome, CPF, matrícula
- Filtros: status (ativo/inativo), deficiência, turma
- Ações por linha: editar, inativar, restaurar, excluir definitivamente, ver documentos
- Exportação Excel → `BeneficiariosService.exportarLista()`
- Importação via planilha → `BeneficiariosService.importar()`
- Alerta de reativação: quando CPF/RG já existe como inativo

### Acessibilidade
- Tabela com `scope="col"` nos cabeçalhos
- Botões de ação com `aria-label` descritivo (`"Inativar João Silva"`)
- Paginação com `aria-label="Navegação de páginas"`
- `LiveAnnouncer` anuncia resultado de busca e ações (ex: "Aluno inativado com sucesso")

## 3.2 `ImportModalComponent` — Importação em Lote via Planilha

**Arquivo:** `src/app/features/beneficiaries/import-modal/`

### Funcionalidades (Chunking Frontend)
- **Parse no Navegador:** Faz a extração do arquivo `.xlsx` instantaneamente no cliente usando a biblioteca `xlsx`, protegendo o servidor de pico de CPU/Memória.
- **Processamento em Lotes (Chunking):** Fila sequencial de envio que fatia milhares de alunos em pacotes limitados (ex: `TAMANHO_LOTE = 200`). Isso imuniza a aplicação de timeouts HTTP e limites no servidor (Render/Neon).
- **Progress Bar Inclusiva:** O modal mostra `aria-valuenow` de forma iterativa sem congelar a UI.
- **Acessibilidade Aprimorada:** O pacote `@angular/cdk/a11y` (`LiveAnnouncer`) reporta auditivamente aos leitores de tela a cada 20% importado, promovendo autonomia aos gestores cegos.

## 3.3 `BeneficiaryFormComponent` — Cadastro/Edição

**Arquivo:** `src/app/features/beneficiaries/beneficiary-form/`

### Seções do formulário

| Seção | Campos |
|---|---|
| Dados Pessoais | Nome, data de nascimento, CPF, RG, gênero |
| Contato | Email, telefone, endereço, CEP (auto-preenchido via ViaCEP) |
| Deficiências | Checkboxes de tipos de deficiência (múltipla seleção) |
| Documentos | Upload de LGPD (PDF obrigatório) |
| Responsável | Nome, CPF, grau de parentesco (se menor de idade) |

### Validações críticas
- CPF único: chama `/api/beneficiaries/check-cpf-rg` antes de salvar
- CEP: integração com `https://viacep.com.br` para auto-preenchimento de endereço
- LGPD: PDF obrigatório para criar aluno (até 10MB via `StorageService.uploadSecurePdf`)
- `descarteGuard` ativado: qualquer alteração não salva exige confirmação ao navegar

### Fluxo de Reativação
```
CPF informado → API retorna status 'inativo'
    ↓
Sistema exibe alerta: "Este aluno está inativo. Deseja reativá-lo?"
    ↓
Usuário confirma → POST /api/beneficiaries/:id/reactivate
    ↓
Nova matrícula gerada → aluno ativo
```

---

# 4. Endpoints e Interfaces

Ver seção completa em [core-http-services.md — BeneficiariosService](./core-http-services.md).

**Interfaces principais:**
```typescript
interface Beneficiario {
  id: string;
  nomeCompleto: string;
  matricula: string;           // gerada automaticamente pelo backend
  cpf: string | null;
  rg: string | null;
  dataNascimento: string;      // ISO date
  email: string | null;
  telefone: string | null;
  status: 'ATIVO' | 'INATIVO';
  deficiencias: string[];
  turmas: { id: string; nome: string }[];
  fotoPerfil: string | null;   // URL Cloudinary
  documentoLGPD: string | null; // URL do PDF
}
```

---

# 5. Segurança e Qualidade

## Segurança

- **Roles:** apenas `ADMIN` e `SECRETARIA` acessam este módulo
- **Upload LGPD:** vai para pasta separada no backend (`tipo=lgpd`) — controle de acesso no servidor
- **CPF mascarado** no log de auditoria via `audit-diff.util`
- **Exclusão definitiva** exige confirmação dupla via `ConfirmDialogService`

## Acessibilidade

- `PhoneMaskDirective` nos campos de telefone
- `formatarCpfCnpj()` formata CPF em tempo real
- Mensagens de erro granulares por campo
- Foco move automaticamente para o primeiro erro ao tentar submeter

---

# 6. Pontos de Atenção

- **ViaCEP** é um serviço externo — se ficar fora do ar, o preenchimento de endereço falha silenciosamente.
  O campo de endereço deve aceitar preenchimento manual como fallback.
- **Importação em Massa via Planilha:** Com a arquitetura de *Chunking*, a UI atualiza um Progress Bar dinâmico; os erros de processamento consolidados aparecem apenas ao fim de todos os lotes como um Relatório de Falhas.
- **`descarteGuard`** ativo: ao recarregar a página acidentalmente, o browser exibe o dialog nativo
  "Sair da página? Dados não salvos serão perdidos."

---

# 7. Relação com Outros Módulos

| Módulo | Relação |
|---|---|
| `BeneficiariosService` | Toda comunicação com a API |
| `StorageService` | Upload de LGPD e documentos |
| `descarteGuard` | Proteção de formulários com dados não salvos |
| `TurmasService` | Lista turmas disponíveis para associar no cadastro |
| `AtestadosService` / `LaudosService` | Documentos médicos do aluno |
| `DashboardService` | Invalida cache quando aluno é criado/inativado |
| `HotkeysService` | `Alt+Shift+N` abre tela de novo cadastro |

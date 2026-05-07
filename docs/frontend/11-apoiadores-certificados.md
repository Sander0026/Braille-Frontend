# Modulo: Apoiadores e Certificados

---

# 1. Visao Geral

## Objetivo

Gerenciar apoiadores/parceiros e operar o modulo administrativo de certificados: modelos, editor visual, emissao academica, honrarias, preview, PDF e validacao publica.

## Estado atual

O frontend tambem esta em estado hibrido:

- O editor visual novo trabalha com `layoutConfig.elements`.
- A compatibilidade com modelos antigos ainda usa `textoPronto`, `nomeAluno`, `assinatura1`, `assinatura2`, `qrCode` e `legacyField`.
- A listagem e emissao continuam usando o endpoint legado `/api/modelos-certificados`.
- O contrato visual de certificados de apoiadores ja aceita `modelo` e `acao`, que sao retornados pelo backend atual.

---

# 2. Rotas

| Rota | Acesso | Tela |
|---|---|---|
| `/admin/modelos-certificados` | `ADMIN`, `SECRETARIA`, `PROFESSOR`, `COMUNICACAO` conforme guards | Lista de modelos e emissao manual |
| `/admin/modelos-certificados/novo` | `ADMIN`, `SECRETARIA` | Criacao de modelo |
| `/admin/modelos-certificados/editar/:id` | `ADMIN`, `SECRETARIA` | Edicao de modelo |
| `/validar-certificado` | Publico | Validacao publica por codigo/QR Code |

---

# 3. Arquivos principais

| Arquivo | Responsabilidade |
|---|---|
| `src/app/core/interfaces/certificados.interface.ts` | Tipos compartilhados, layout, elementos e catalogo de fontes |
| `src/app/core/services/modelos-certificados.service.ts` | API de modelos, emissao, cancelamento, reemissao e validacao |
| `src/app/pages/modelos-certificados/modelos-lista/` | Listagem de modelos, preview e emissao manual |
| `src/app/pages/modelos-certificados/modelos-form/` | Wizard de criacao/edicao e editor visual |
| `src/app/pages/modelos-certificados/components/certificado-preview/` | Preview responsivo do certificado |
| `src/app/pages/public/validar-certificado/` | Validacao publica |
| `src/app/pages/admin/apoiadores/components/apoiador-certificados/` | Modal de certificados/honrarias do apoiador |

---

# 4. Servico HTTP de certificados

`ModelosCertificadosService` usa:

| Metodo | Endpoint | Uso |
|---|---|---|
| `listar()` | `GET /api/modelos-certificados` | Lista modelos |
| `buscarPorId(id)` | `GET /api/modelos-certificados/:id` | Carrega modelo para edicao |
| `criar(FormData)` | `POST /api/modelos-certificados` | Cria modelo com arte/assinaturas |
| `atualizar(id, FormData)` | `PATCH /api/modelos-certificados/:id` | Atualiza modelo e layout |
| `excluir(id)` | `DELETE /api/modelos-certificados/:id` | Remove modelo |
| `emitirAcademico(turmaId, alunoId)` | `POST /api/modelos-certificados/emitir-academico` | Emissao academica automatica |
| `emitirManualAcademico(payload)` | `POST /api/modelos-certificados/emitir-manual-academico` | Emissao manual por aluno/turma cadastrados |
| `emitirHonrariaManual(payload)` | `POST /api/modelos-certificados/emitir-honraria` | Honraria manual para apoiador cadastrado |
| `cancelarCertificado(id, motivo)` | `PATCH /api/modelos-certificados/certificados/:id/cancelar` | Cancela certificado |
| `reemitirCertificado(id)` | `POST /api/modelos-certificados/certificados/:id/reemitir` | Reemite certificado academico |
| `validarAutenticidade(codigo)` | `GET /api/certificados/validar/:codigo` | Validacao publica |

---

# 5. Catalogo de fontes

O catalogo unico fica em `CERTIFICADO_FONTES`.

Fontes disponiveis:

- `Helvetica`
- `TimesRoman`
- `Courier`
- `Roboto`
- `Open Sans`
- `Montserrat`
- `Merriweather`
- `Cinzel`
- `Playfair Display`
- `Great Vibes`
- `Parisienne`
- `Dancing Script`
- `Pacifico`

As fontes de certificado sao carregadas em `src/index.html` via Google Fonts para aproximar o preview do PDF gerado no backend.

Os selects de fonte do editor usam o mesmo catalogo:

- Elemento selecionado em `layoutConfig.elements`.
- Campo legado de texto principal.
- Campo legado de nome do participante.

---

# 6. Editor visual

## 6.1 Modelo de elementos

O editor novo usa:

```ts
type CertificadoLayoutElementType =
  | 'TEXT'
  | 'DYNAMIC_TEXT'
  | 'SIGNATURE_IMAGE'
  | 'SIGNATURE_BLOCK'
  | 'QR_CODE'
  | 'VALIDATION_CODE'
  | 'LINE';
```

Cada elemento pode conter:

- `id`
- `type`
- `label`
- `content`
- `x`, `y`, `width`, `height`
- `fontFamily`, `fontSize`, `fontWeight`
- `color`, `textAlign`, `lineHeight`
- `zIndex`
- `visible`
- `legacyField`

As coordenadas sao percentuais.

## 6.2 Compatibilidade legada

`normalizarCertificadoLayoutConfig()` cria elementos dinamicos a partir do layout antigo:

- `legacy-nome-aluno`
- `legacy-texto-principal`
- `legacy-assinatura-1`
- `legacy-assinatura-2`
- `legacy-qrcode`

Esses elementos mantem `legacyField` para sincronizar com:

- `layoutConfig.nomeAluno`
- `layoutConfig.textoPronto`
- `layoutConfig.assinatura1`
- `layoutConfig.assinatura2`
- `layoutConfig.qrCode`

Nao remover esses campos enquanto houver modelos antigos.

---

# 7. Preview do certificado

`CertificadoPreviewComponent`:

- Renderiza a imagem de fundo.
- Ordena `elements` por `zIndex`.
- Ignora elementos `visible === false`.
- Aplica escala responsiva.
- Renderiza texto, QR Code, assinatura, linha e campos legados.
- Substitui variaveis simuladas quando `applyMocks` esta ativo.

Variaveis simuladas no preview incluem:

- `{{ALUNO}}`, `{{NOME_ALUNO}}`
- `{{TURMA}}`, `{{CURSO}}`, `{{NOME_CURSO}}`
- `{{CARGA_HORARIA}}`
- `{{DATA_INICIO}}`, `{{DATA_FIM}}`, `{{DATA_EMISSAO}}`
- `{{PARCEIRO}}`, `{{MOTIVO}}`
- `{{CODIGO_CERTIFICADO}}`, `{{CODIGO_VALIDACAO}}`
- `{{NOME_INSTITUICAO}}`, `{{NOME_RESPONSAVEL}}`, `{{CARGO_RESPONSAVEL}}`
- `{{TEXTO_CERTIFICADO}}`

---

# 8. Tela de modelos

`ModelosLista` permite:

- Visualizar modelos.
- Abrir preview.
- Editar/excluir modelo.
- Gerar certificado manual.

## 8.1 Certificado academico manual

O modal academico:

- Exibe busca por aluno cadastrado.
- Filtra aluno por nome ou matricula.
- Exibe busca/selecao de turma/curso cadastrado.
- Nao pede data de inicio/fim, pois esses dados vem da turma.
- Envia `modeloId`, `alunoId`, `turmaId` e `dataEmissao`.

O certificado gerado fica vinculado ao aluno/turma e aparece no perfil do aluno como certificado de curso concluido.

## 8.2 Honraria manual

O modal de honraria:

- Exibe busca por apoiador cadastrado.
- Filtra apoiador por nome.
- Pede titulo da acao.
- Pede motivo complementar opcional.
- Pede data do evento.
- Envia `modeloId`, `apoiadorId`, `tituloAcao`, `motivo` e `dataEvento`.

---

# 9. Modal de certificados do apoiador

`ApoiadorCertificadosComponent` lista honrarias emitidas para um apoiador.

O contrato `CertificadoEmitido` aceita:

```ts
interface CertificadoEmitido {
  id: string;
  dataEmissao: string;
  codigoValidacao?: string;
  pdfUrl?: string | null;
  modelo?: { nome: string } | null;
  acao?: { descricaoAcao: string; dataEvento: string } | null;
  tituloCertificado?: string;
  emitidoPor?: {
    id?: string;
    nome?: string;
    nomeCompleto?: string;
  } | null;
}
```

O modal usa `modelo.nome` e `acao.descricaoAcao` quando disponiveis, mantendo fallback para `tituloCertificado` e `emitidoPor` de registros legados.

Tambem mostra `codigoValidacao` quando existir.

---

# 10. Validacao publica

Tela publica: `/validar-certificado`

Comportamento:

- Le `codigo` da query string.
- Preenche o formulario automaticamente.
- Executa a validacao ao abrir a pagina.
- Exibe status valido/invalido, dados do certificado, natureza e codigo.

Endpoint usado:

```text
GET /api/certificados/validar/:codigo
```

---

# 11. Acessibilidade e responsividade

Melhorias aplicadas:

- Modal de geracao manual centralizado.
- `role="dialog"` e `aria-modal`.
- `cdkTrapFocus`.
- Labels explicitos.
- Busca por aluno/apoiador com lista navegavel visualmente.
- Mensagem "nenhum encontrado" nao aparece quando um item ja esta selecionado.
- Botoes com estado `aria-busy` quando processando.

---

# 12. Pontos de atencao

Nao remover ainda:

- `legacyField`
- Campos fixos do `layoutConfig`
- Normalizacao de layout legado
- Controles legados de texto/nome

Riscos conhecidos:

- `fontWeight` no PDF preserva a familia, mas ainda nao usa variante bold real da fonte customizada.
- A equivalencia preview/PDF depende das fontes carregadas no `index.html` e do catalogo do backend.
- O fluxo V2 existe no banco, mas ainda nao substitui o CRUD/emissao legado.

---

# 13. Checklist de teste manual

1. Criar modelo academico com arte base e assinatura.
2. Usar fonte cursiva no nome do participante.
3. Adicionar elemento dinamico em `elements`.
4. Salvar modelo e reabrir editor.
5. Gerar certificado academico automatico.
6. Gerar certificado academico manual.
7. Gerar honraria manual para apoiador.
8. Abrir modal de certificados do apoiador e conferir modelo/acao/codigo.
9. Validar certificado via `/validar-certificado?codigo=...`.
10. Cancelar e reemitir certificado no fluxo administrativo.

# Módulo: Apoiadores e Certificados

---

# 1. Visão Geral

## Objetivo

Gerenciar os apoiadores/patrocinadores do Instituto exibidos no site público
e os modelos/emissão de certificados acadêmicos para alunos concluintes.

## Responsabilidade

**Apoiadores:** vitrine de parceiros e patrocinadores.
**Certificados:** fluxo de geração de certificados com modelo personalizado (imagem de fundo),
dados do aluno e validação pública por código único.

---

# 2. Apoiadores (`/admin/apoiadores`)

**Acesso:** `ADMIN`, `SECRETARIA`, `COMUNICACAO`

## 2.1 `ApoiadoresLista` — Gestão

**Arquivo:** `src/app/pages/admin/apoiadores/`

### Funcionalidades
- Lista de apoiadores com preview de logo
- Cadastro e edição com upload de logo (Cloudinary, máx. 10MB)
- Reordenação de exibição no site
- Desativar/ativar exibição no site público

### Interface de Apoiador

```typescript
interface Apoiador {
  id: string;
  nome: string;
  logo: string | null;       // URL Cloudinary
  website: string | null;
  descricao: string | null;
  ativo: boolean;
  ordem: number;
}
```

### Exibição no Site Público

Apoiadores ativos são exibidos na seção "Nossos Parceiros" da home pública,
com logo otimizada via `CloudinaryPipe`:

```html
<img [src]="apoiador.logo | cloudinary: { w: 200, c: 'fill' }" [alt]="apoiador.nome" />
```

---

# 3. Modelos de Certificados (`/admin/modelos-certificados`)

**Acesso:** `ADMIN`, `SECRETARIA`

## 3.1 `ModelosLista` — Listagem de Modelos

**Arquivo:** `src/app/pages/admin/modelos-certificados/modelos-lista/`

Exibe modelos de certificado disponíveis com preview de imagem de fundo.

## 3.2 `ModelosForm` — Criação e Edição

**Arquivo:** `src/app/pages/admin/modelos-certificados/modelos-form/`
**Rotas:** `/admin/modelos-certificados/novo` e `/admin/modelos-certificados/editar/:id`

### Funcionalidades

- Upload de imagem de fundo (o layout do certificado)
- Editor de texto para configurar posição e formato do nome, data e código
- Geração de PDF de teste (para validar o layout antes de emitir)
- `descarteGuard` ativo

### Fluxo de Criação de Modelo

```
Upload imagem de fundo → POST /api/modelos-certificados (FormData)
    ↓
Configurar campos: fonte, tamanho, posição de texto
    ↓
Gerar teste → POST /api/modelos-certificados/teste (retorna Blob PDF)
    ↓
Abrir PDF no PdfViewerComponent para revisão
    ↓
Salvar modelo
```

## 3.3 Emissão de Certificado Acadêmico

```typescript
emitirAcademico(dto: EmitirCertificadoDto): Observable<{ url: string }>
  POST /api/modelos-certificados/emitir-academico
```

```typescript
interface EmitirCertificadoDto {
  modeloId: string;
  alunoId: string;
  turmaId: string;
  dataEmissao: string;
}
```

O backend gera o PDF com dados do aluno e turma sobre a imagem de fundo,
sobe para o Cloudinary e retorna a URL. O frontend abre o PDF no `PdfViewerComponent`.

---

# 4. Validação Pública de Certificado

**Rota pública:** `/validar-certificado` (sem autenticação)

```typescript
validarAutenticidade(codigo: string): Observable<CertificadoInfo | null>
  GET /api/certificados/validar/:codigo
```

Qualquer pessoa pode verificar a autenticidade de um certificado informando o código
impresso no documento. A API retorna nome do aluno, turma, data e status.

---

# 5. Segurança e Qualidade

## Segurança

- **Upload de logo e imagem de fundo:** via `FormData` com limite de 10MB no frontend
  e validação de tipo MIME no backend
- **Código de validação:** UUID único gerado no backend — não sequencial (não previsível)
- **Rota de validação pública:** sem JWT — exposição mínima controlada

## Acessibilidade

- Logos de apoiadores sempre com `alt` descritivo (`[alt]="apoiador.nome"`)
- PDF gerado é texto selecionável (não imagem escaneada) para compatibilidade com leitores de tela
- `PdfViewerComponent` com controles de navegação de página acessíveis por teclado

---

# 6. Pontos de Atenção

- **Modelos de certificado** dependem de imagem de fundo no Cloudinary — se a imagem for excluída
  do Cloudinary externamente, a emissão falhará sem mensagem clara para o usuário.
- **PDF de teste** usa `Blob` — o browser pode bloquear o download dependendo de configuração de CSP.
  O `PdfViewerComponent` inline contorna isso usando `pdfjs-dist` em vez de download direto.

---

# 7. Relação com Outros Módulos

| Módulo | Relação |
|---|---|
| `ModelosCertificadosService` | CRUD de modelos e emissão |
| `StorageService` | Upload de imagens de fundo |
| `PdfViewerComponent` | Preview do certificado gerado |
| `CloudinaryPipe` | Otimiza logo de apoiadores no site público |
| `descarteGuard` | Proteção do formulário de modelo |

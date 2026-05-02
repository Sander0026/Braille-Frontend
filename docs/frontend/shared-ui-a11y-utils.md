# Módulo: Componentes Shared, UI, Acessibilidade e Utilitários

---

# 1. Visão Geral

## Objetivo

Documentar todos os elementos reutilizáveis da aplicação: componentes atômicos de UI,
diretivas, pipes, validators, utilitários puros e providers globais.

## Responsabilidade

A camada `shared/` fornece os **blocos de construção** usados por todas as features.
Cada elemento é standalone, testável de forma isolada e sem dependência de feature específica.

---

# 2. Componentes Atômicos (`shared/components/`)

## 2.1 `UiButtonComponent` — Botão Padronizado

**Arquivo:** `src/app/shared/components/ui-button/`

Componente de botão com variantes visuais e estado de loading.

```html
<!-- Uso típico -->
<ui-button variant="primary" [loading]="salvando" (clicked)="salvar()">
  Salvar
</ui-button>
```

**Variantes:** `primary`, `secondary`, `danger`, `ghost`
**Acessibilidade:** `aria-busy` quando loading, `disabled` nativo ao carregar

## 2.2 `UiCardComponent` — Container Visual

**Arquivo:** `src/app/shared/components/ui-card/`

Container com sombra, bordas arredondadas e padding padrão. Base visual de todas
as seções de formulário e listagem.

## 2.3 `UiInputComponent` — Campo de Formulário

**Arquivo:** `src/app/shared/components/ui-input/`

Input com label flutuante, mensagens de erro integradas e suporte a máscaras.

```html
<ui-input
  label="CPF"
  [control]="form.get('cpf')"
  mask="cpf"
  [errorMessages]="{ required: 'CPF obrigatório', pattern: 'CPF inválido' }"
/>
```

## 2.4 `UiModalComponent` — Modal Padronizado

**Arquivo:** `src/app/shared/components/ui-modal/`

Modal com `cdkTrapFocus`, fechamento por Esc, backdrop clicável e animação de entrada/saída.

```html
<ui-modal [aberto]="modalAberto" titulo="Editar Aluno" (fechou)="fecharModal()">
  <!-- conteúdo -->
</ui-modal>
```

**Acessibilidade:**
- `role="dialog"` + `aria-modal="true"`
- `aria-labelledby` aponta para o título
- `cdkTrapFocus` — foco não escapa enquanto aberto
- Fecha com `Esc`

## 2.5 `PdfViewerComponent` — Visualizador de PDF

**Arquivo:** `src/app/shared/components/pdf-viewer/`

Renderiza PDFs (atestados, laudos, certificados) usando `pdfjs-dist`.

```html
<pdf-viewer [url]="urlDoArquivo" />
```

**Funcionalidades:**
- Renderização canvas a partir de URL remota
- Navegação por páginas
- Fallback de loading e erro
- Não baixa o arquivo automaticamente — exibe inline

---

# 3. Diretivas (`shared/directives/`)

## 3.1 `TabEscapeDirective` — Acessibilidade em Textareas

**Arquivo:** `src/app/shared/directives/tab-escape.directive.ts`
**Seletor:** `textarea[tabEscape]`

Resolve a "armadilha de teclado" (WCAG 2.1 SC 2.1.1 e 2.1.2): por padrão, pressionar
`Tab` dentro de um `<textarea>` insere um caractere `\t` em vez de mover o foco.
Esta diretiva intercepta `Tab` e `Shift+Tab` e navega para o próximo/anterior elemento focável.

```html
<!-- Aplicar em qualquer textarea que possa prender o foco -->
<textarea tabEscape rows="5" formControlName="descricao"></textarea>
```

**Comportamento técnico:**
- Limita a busca de elementos focáveis ao `dialog`, `[cdkTrapFocus]` ou `form` mais próximo
- Filtra elementos com `aria-hidden="true"` e `offsetParent === null` (invisíveis)
- Navegação circular: do último elemento volta ao primeiro
- SSR-safe: verifica `isPlatformBrowser()` antes de acessar o DOM

## 3.2 `PhoneMaskDirective` — Máscara de Telefone

**Arquivo:** `src/app/shared/directives/phone-mask.directive.ts`
**Seletor:** `input[phoneMask]`

Aplica máscara de telefone brasileiro em tempo real durante a digitação.

```html
<input phoneMask type="tel" formControlName="telefone" />
<!-- Resultado: (27) 99999-9999 -->
```

Utiliza `formatarTelefone()` de `masks.util.ts` internamente.

## 3.3 `AnimateOnScrollDirective` — Animação de Entrada

**Arquivo:** `src/app/shared/directives/animate-on-scroll.directive.ts`
**Seletor:** `[animateOnScroll]`

Adiciona classe CSS de animação quando o elemento entra no viewport via `IntersectionObserver`.
Usado nas seções do site público (Home, Sobre, Apoiadores).

```html
<section animateOnScroll animationClass="fade-in-up">
  <!-- conteúdo animado ao entrar na tela -->
</section>
```

---

# 4. Pipes (`core/pipes/`)

## 4.1 `SafeHtmlPipe` — Sanitização HTML Anti-XSS

**Arquivo:** `src/app/core/pipes/safe-html.pipe.ts`
**Nome:** `safeHtml` | **Pure:** `true`

Pipeline de sanitização de HTML em dois estágios: DOMPurify → Angular DomSanitizer.

```html
<!-- Conteúdo do CMS (Quill editor) renderizado com segurança -->
<div [innerHTML]="comunicado.conteudo | safeHtml"></div>
```

**Pipeline interno:**
1. Verifica cache em memória (evita reprocessar o mesmo HTML)
2. DOMPurify sanitiza: permite lista branca de tags e atributos
3. DOMParser injeta `alt=""` em `<img>` sem alt (WCAG)
4. DOMParser injeta `aria-label` em `<a target="_blank">` (WCAG 3.2.5)
5. `DomSanitizer.bypassSecurityTrustHtml()` marca como confiável para o Angular
6. Armazena no cache (máx. 50 entradas — prevenção de memory leak)

**Tags permitidas:** `b, i, em, strong, a, p, h1-h6, ul, ol, li, br, span, div, img, s, u, blockquote, pre`

## 4.2 `SafeUrlPipe` — Validação de URLs

**Arquivo:** `src/app/core/pipes/safe-url.pipe.ts`
**Nome:** `safeUrl` | **Pure:** `true`

Bloqueia URLs com protocolos perigosos antes de confiar ao Angular.

```html
<a [href]="item.link | safeUrl">Ver mais</a>
```

**Protocolos bloqueados:** `javascript:`, `data:`, `vbscript:`

## 4.3 `CloudinaryPipe` — Otimização de Imagens

**Arquivo:** `src/app/core/pipes/cloudinary.pipe.ts`
**Nome:** `cloudinary` | **Pure:** `true`

Injeta parâmetros de transformação na URL do Cloudinary para otimização automática
de formato (WebP) e qualidade — sem precisar gerar múltiplas versões no upload.

```html
<!-- Imagem original → otimizada para 400px de largura em WebP -->
<img [src]="apoiador.logo | cloudinary: { w: 400, c: 'fill' }" [alt]="apoiador.nome" />
```

**Transformações aplicadas:**
- `f_auto` — formato automático (WebP em browsers modernos)
- `q_auto` — qualidade automática (Cloudinary otimiza)
- `w_N` — largura em pixels (opcional)
- `h_N` — altura em pixels (opcional)
- `c_fill|scale|crop` — modo de corte (opcional)

**Proteções:**
- Ignora URLs que não sejam do `res.cloudinary.com`
- Não duplica transformações já aplicadas

---

# 5. Validators (`shared/validators/`)

## 5.1 `senhaForteValidator` — Validador de Força de Senha

**Arquivo:** `src/app/shared/validators/password.validator.ts`

Validador Angular Reativo compatível com as diretrizes OWASP para senhas seguras.

```typescript
// Uso no FormBuilder
this.fb.group({
  senha: ['', [Validators.required, senhaForteValidator]]
});

// Template — feedback específico por regra
@if (form.get('senha')?.errors?.['senhaFraca']?.tooShort) {
  <span>Mínimo 8 caracteres</span>
}
@if (form.get('senha')?.errors?.['senhaFraca']?.missingUppercase) {
  <span>Precisa de uma letra maiúscula</span>
}
```

**Regras validadas:**
| Regra | Constante | Critério |
|---|---|---|
| Comprimento | `tooShort` | Mínimo `PASSWORD_MIN_LENGTH` (8) caracteres |
| Maiúsculas | `missingUppercase` | Ao menos 1 `[A-Z]` |
| Minúsculas | `missingLowercase` | Ao menos 1 `[a-z]` |
| Número | `missingNumber` | Ao menos 1 `[0-9]` |
| Especial | `missingSpecial` | Ao menos 1 `!@#$%^&*...` (ReDoS-safe) |

Retorna `null` se a senha estiver vazia (compatível com `Validators.required` sem conflito).

---

# 6. Utilitários (`shared/utils/`)

## 6.1 `masks.util.ts` — Funções de Formatação

Funções puras exportadas individualmente (tree-shakeable).

| Função | Entrada | Saída | Exemplo |
|---|---|---|---|
| `formatarCpfCnpj(valor)` | `'12345678900'` | `'123.456.789-00'` | CPF e CNPJ |
| `formatarTelefone(valor)` | `'27999999999'` | `'(27) 99999-9999'` | Celular/Fixo |
| `formatarCep(valor)` | `'29000000'` | `'29000-000'` | CEP |
| `formatarRg(valor)` | `'1234567'` | `'1.234.567'` | RG |
| `limparEmail(valor)` | `' User@EMAIL.com '` | `'user@email.com'` | Normalização |

> `MasksUtil` (objeto agrupador) está marcado como `@deprecated`. Usar as funções diretamente.

## 6.2 `audit-diff.util.ts` — Diff de Auditoria

Utilitário que compara dois objetos JSON (antes/depois de uma edição) e gera
uma lista legível de diferenças para exibição no log de auditoria.

```typescript
const diffs = gerarDiferencas(registroAntigo, registroNovo);
// Retorna: [{ campo: 'Nome', de: 'João', para: 'João Silva', alterado: true, sensivel: false }]
```

**Funcionalidades:**
- Ignora campos técnicos (`id`, `criadoEm`, `atualizadoEm`, `senhaHash`)
- Mascara campos sensíveis (CPF mostra `Final 1234`, email mostra `j***@gmail.com`)
- Formata datas ISO para PT-BR
- Traduz `boolean` para `Sim`/`Não`
- Usa `AUDIT_FIELD_LABELS` para nomes amigáveis dos campos

**Constantes:**
- `AUDIT_FIELD_LABELS` — mapa de chave técnica → label PT-BR
- `AUDIT_IGNORED_FIELDS` — campos ignorados no diff (Set imutável)

## 6.3 `html-sanitizer.util.ts` — Sanitizador de Texto Livre

Função pura para sanitizar texto antes de inserir em contextos HTML.
Complementa o `SafeHtmlPipe` para casos de sanitização sem pipe.

## 6.4 `safe-resource-url.util.ts` — URL Segura para Recursos

Helper para validar e retornar URLs seguras para uso em `src` de iframes e embeds,
bloqueando protocolos inseguros.

---

# 7. Providers (`shared/providers/`)

## 7.1 `provideTabEscapeForTextareas()`

**Arquivo:** `src/app/shared/providers/tab-escape.provider.ts`

Registra `TabEscapeDirective` globalmente para todos os `<textarea>` da aplicação,
sem precisar importar a diretiva em cada componente individualmente.

```typescript
// app.config.ts
...provideTabEscapeForTextareas()
```

---

# 8. Segurança

| Elemento | Proteção |
|---|---|
| `SafeHtmlPipe` | XSS via DOMPurify + lista branca de tags |
| `SafeUrlPipe` | Bloqueia `javascript:`, `data:`, `vbscript:` |
| `CloudinaryPipe` | Só transforma URLs do `res.cloudinary.com` |
| `senhaForteValidator` | ReDoS-safe, sem regex com back-tracking |
| `audit-diff.util` | Mascara CPF, RG, email, telefone, senha no log de auditoria |

---

# 9. Relação com Outros Módulos

| Módulo | Consome |
|---|---|
| Todas as páginas admin | `UiButton`, `UiCard`, `UiInput`, `UiModal` |
| CMS / Comunicados | `SafeHtmlPipe` |
| Fotos de perfil, logos | `CloudinaryPipe` |
| Links externos | `SafeUrlPipe` |
| Formulários de documentos | `PdfViewerComponent` |
| Formulários de usuário/aluno | `senhaForteValidator`, `PhoneMaskDirective` |
| Log de auditoria | `audit-diff.util` |
| Todo o app | `TabEscapeDirective` (via provider global) |

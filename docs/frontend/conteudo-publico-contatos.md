# Módulo: Conteúdo Público e Fale Conosco

---

# 1. Visão Geral

## Objetivo

Gerenciar o CMS do site público (comunicados, configurações visuais, seções da home)
e administrar as mensagens recebidas pelo formulário "Fale Conosco".

## Responsabilidade

Este módulo permite à equipe do ILBES atualizar o site institucional sem precisar
de um desenvolvedor: publicar comunicados, editar textos das seções e gerenciar mensagens.

---

# 2. Conteúdo do Site (`/admin/conteudo`)

**Acesso:** `ADMIN`, `COMUNICACAO`

## 2.1 `ConteudoSite` — Painel CMS

**Arquivo:** `src/app/pages/admin/conteudo/conteudo-site/`

### Funcionalidades

| Aba | O que gerencia |
|---|---|
| **Configurações Gerais** | Nome do instituto, logo, cor primária, redes sociais, endereço |
| **Seção Hero** | Título e subtítulo do banner principal da home |
| **Seção Sobre** | Texto da seção "Quem Somos" |
| **Seção Serviços** | Cards de serviços oferecidos pelo instituto |
| **Comunicados** | Lista e editor de notícias/avisos |

### Editor Rich Text (Quill)

Os campos de texto longo usam `ngx-quill` como editor WYSIWYG.
O conteúdo gerado pelo Quill é HTML — renderizado no site público via `SafeHtmlPipe`.

```typescript
// A SafeHtmlPipe sanitiza antes de renderizar — seguro contra XSS
<div [innerHTML]="comunicado.conteudo | safeHtml"></div>
```

### Cor Primária

`SiteConfigService.aplicarCorPrimaria(cor)` injeta a variável CSS `--cor-primaria`
diretamente no `document.documentElement.style` — atualiza as cores do admin em tempo real.

## 2.2 `ComunicadosService` — Gestão de Comunicados

Ver seção completa em [core-http-services.md](./core-http-services.md).

### Ciclo de vida de um comunicado

```
Criar (rascunho) → Publicar → [Exibido no site público]
                → Arquivar → [Oculto do site, visível no admin]
                → Excluir
```

---

# 3. Fale Conosco (`/admin/contatos`)

**Acesso:** `ADMIN`, `SECRETARIA`, `COMUNICACAO`

## 3.1 `ContatosLista` — Mensagens Recebidas

**Arquivo:** `src/app/pages/admin/contatos/`

### Funcionalidades
- Lista de mensagens enviadas pelo formulário público
- Filtro por status: lida/não lida
- Marcar como lida individual ou em lote
- Excluir mensagens

### Formulário Público (`/contato`)

Formulário sem autenticação — rota pública.

```typescript
enviar(payload: ContatoPayload): Observable<void>
  POST /api/contatos

interface ContatoPayload {
  nome: string;
  email: string;
  telefone?: string;
  mensagem: string;
}
```

**Proteções:**
- `ContatoService` está na whitelist do `authInterceptor` → não envia JWT
- Validação de email e comprimento mínimo de mensagem no formulário
- Rate limit implementado no backend (não no frontend)

---

# 4. Segurança e Qualidade

## Segurança

- **Conteúdo Quill** sempre passa por `SafeHtmlPipe` antes de renderizar — nunca `[innerHTML]` direto
- **URLs de imagem do CMS** passam por `SafeUrlPipe`
- **Formulário de Contato** não requer autenticação — exposição mínima (apenas nome, email, mensagem)

## Acessibilidade

- Editor Quill tem suporte a navegação por teclado
- Campos do formulário de contato com `aria-required` e `aria-describedby` apontando para erros
- Mensagens de erro com `role="alert"` para leitores de tela

---

# 5. Pontos de Atenção

- **ngx-quill** requer `provideAnimations()` (legado) — bloqueia migração para Angular sem animações
- **Cor primária** é aplicada no DOM diretamente via JS — pode gerar inconsistência
  se o usuário tiver preferência de tema (dark mode via media query)
- **Formulário de Contato** sem CAPTCHA — vulnerável a spam. Mitigação recomendada: reCAPTCHA v3

---

# 6. Relação com Outros Módulos

| Módulo | Relação |
|---|---|
| `ComunicadosService` | CRUD de comunicados |
| `SiteConfigService` | Configurações visuais e seções |
| `ContatosService` | Mensagens recebidas |
| `SafeHtmlPipe` | Renderiza HTML do editor Quill com segurança |
| `CloudinaryPipe` | Otimiza imagens do CMS |
| `StorageService` | Upload de imagens do CMS |

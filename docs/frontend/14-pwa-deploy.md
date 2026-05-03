# Módulo: PWA, Build e Deploy (Vercel)

---

# 1. Visão Geral

## Objetivo

Documentar o processo de build para produção, a configuração do Service Worker (PWA),
o deploy na Vercel e cada diretiva de segurança configurada nos headers HTTP.

---

# 2. Build de Produção

## 2.1 Comando

```bash
npm run build
# Equivale a: ng build --configuration=production
```

**Saída:** `dist/braille-frontend/browser/`

## 2.2 O que o Build Faz

| Otimização | Detalhe |
|---|---|
| **Tree-shaking** | Remove código não utilizado (ex: axe-core fica fora do bundle de prod) |
| **Minificação** | HTML, CSS e JS comprimidos |
| **Chunk splitting** | Cada rota lazy gera um chunk separado |
| **Substituição de ambiente** | `environment.ts` → `environment.prod.ts` |
| **Service Worker** | Gera `ngsw-worker.js` para PWA |
| **Budgets** | Avisa se bundle ultrapassar limite definido em `angular.json` |

## 2.3 Budget de Bundle (angular.json)

Configurado para alertar quando o bundle inicial ultrapassar limites definidos.
Verificar `angular.json` → `budgets` → `type: initial` para os valores atuais.

---

# 3. PWA — Progressive Web App

## 3.1 O que é PWA?

PWA permite que o sistema seja instalado como aplicativo nativo no dispositivo
(computador ou celular) e funcione offline para recursos cacheados.

**Para o ILBES:** usuários podem instalar o painel no desktop para acesso mais rápido,
e o site público permanece acessível mesmo com conexão intermitente.

## 3.2 Configuração do Service Worker

**Arquivo:** `ngsw-config.json`

```json
{
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",        // baixa imediatamente no primeiro acesso
      "resources": {
        "files": ["/favicon.ico", "/index.html", "/manifest.webmanifest",
                  "/*.css", "/*.js"]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",            // baixa sob demanda
      "updateMode": "prefetch",         // atualiza antecipadamente
      "resources": {
        "files": ["/assets/**", "/*.(svg|jpg|jpeg|png|webp|avif|gif|otf|ttf|woff|woff2)"]
      }
    }
  ]
}
```

| Grupo | Estratégia | Por quê |
|---|---|---|
| `app` | `prefetch` | HTML, CSS, JS devem estar sempre disponíveis offline |
| `assets` | `lazy` + `updateMode: prefetch` | Imagens/fontes são grandes — baixar só quando necessário, mas atualizar proativamente |

## 3.3 Service Worker em Desenvolvimento

O Service Worker está **desabilitado em desenvolvimento** (`enabled: !isDevMode()`).
Para testar o PWA localmente:

```bash
npm run build
npx http-server dist/braille-frontend/browser -p 8080
# Acesse http://localhost:8080
```

## 3.4 Resetar Cache do Service Worker

Se o SW estiver com comportamento inesperado (cache travado):

```
DevTools (F12) → Application → Service Workers → Unregister
DevTools → Application → Storage → Clear site data
```

---

# 4. Deploy na Vercel

## 4.1 Configuração

A Vercel detecta automaticamente que é um projeto Angular e configura o build.
O arquivo `vercel.json` adiciona headers de segurança e roteamento SPA.

## 4.2 Roteamento SPA

A Vercel precisa redirecionar todas as rotas para `index.html` (padrão de SPA).
Isso é configurado automaticamente para o Angular — não é necessário configuração manual.
Qualquer URL como `/admin/alunos` serve o `index.html`, e o Angular Router resolve a rota.

## 4.3 Variáveis de Ambiente

O frontend Angular **não usa variáveis de ambiente em runtime** — tudo é compilado no bundle.
O `environment.prod.ts` tem a `apiUrl` hardcoded:

```typescript
export const environment: Environment = {
  production: true,
  apiUrl: 'https://braille-api-oieq.onrender.com/api',
};
```

> Se a URL da API mudar, é necessário atualizar `environment.prod.ts` e fazer novo deploy.

## 4.4 Vercel Staged Deployments e Build Cache

> [!WARNING]
> **Atenção Crítica para Deploys na Vercel:**
> Dois comportamentos podem fazer com que **código antigo seja servido em produção** mesmo após um push bem-sucedido na branch `main`:
> 
> 1. **Staged Deployments:** O projeto pode estar configurado com *Deployment Protection*. Nesse estado, a build finaliza, mas fica marcada como `Production: Staged`. Ela **não** é publicada automaticamente no domínio oficial. É necessário promovê-la manualmente clicando em **Promote to Production** nos detalhes do deploy no painel da Vercel, ou desativar o recurso em *Settings > Git*.
> 2. **Build Cache Preso:** Para compilar mais rápido, a Vercel reutiliza artefatos antigos. Ocasionalmente, alterações estruturais no HTML podem não ser detectadas corretamente. Para forçar uma compilação do zero, acione o **Redeploy** desmarcando explicitamente a opção **"Use existing Build Cache"**.

---

# 5. Headers de Segurança (vercel.json)

Todos os headers são aplicados a **todas as rotas** (`source: "/(.*)"`) via `vercel.json`.

## 5.1 `X-Frame-Options: DENY`

**Proteção:** Clickjacking
**O que faz:** Impede que o site seja embutido em um `<iframe>` por outro site.
**Por que `DENY` e não `SAMEORIGIN`:** o ILBES não tem necessidade de embutir o sistema em outros sites seus.

## 5.2 `X-Content-Type-Options: nosniff`

**Proteção:** MIME type sniffing
**O que faz:** Impede que o browser interprete arquivos com tipo diferente do declarado.
Evita que um CSV malicioso seja executado como JavaScript.

## 5.3 `Referrer-Policy: strict-origin-when-cross-origin`

**O que faz:** Ao clicar em link externo, envia apenas a origem (não o path completo).
Evita vazar URLs internas (ex: `sistema.com/admin/alunos/123`) para sites de terceiros.

## 5.4 `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`

**Proteção:** Downgrade attacks (HTTPS → HTTP)
**O que faz:** Força HTTPS por 2 anos (63072000 segundos), incluindo subdomínios.
`preload` submete o domínio para a lista HSTS dos browsers.

## 5.5 `Permissions-Policy`

```
camera=(), microphone=(), geolocation=(), payment=()
```

**O que faz:** Desabilita APIs de câmera, microfone, geolocalização e pagamento.
O sistema não usa nenhuma dessas APIs — desabilitá-las reduz a superfície de ataque.

## 5.6 `Content-Security-Policy` — Detalhada

A CSP é a diretiva de segurança mais importante. Controla de onde o browser pode
carregar recursos.

```
default-src 'self';
```
Por padrão, tudo vem apenas do próprio domínio.

```
script-src 'self' 'unsafe-inline' https://vlibras.gov.br https://cdn.jsdelivr.net https://o0.ingest.sentry.io;
```
Scripts: domínio próprio + VLibras (acessibilidade gov.br) + jsDelivr (pdfjs-dist) + Sentry (legado — pode ser removido após limpeza).

> ⚠️ **Nota:** `https://o0.ingest.sentry.io` pode ser removido do CSP pois o Sentry foi desinstalado.
> Atualizar o `vercel.json` após este commit.

```
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
```
Estilos: permite inline (necessário para TailwindCSS via Angular) + Google Fonts.

```
img-src 'self' data: blob: https: https://*.cloudinary.com;
```
Imagens: domínio próprio + base64 (data URIs) + blob (PDFs) + Cloudinary.

```
connect-src 'self' https://braille-api-oieq.onrender.com https://viacep.com.br https://res.cloudinary.com https://*.cloudinary.com https://fonts.googleapis.com https://fonts.gstatic.com https://vlibras.gov.br https://cdn.jsdelivr.net;
```
Conexões HTTP: API do ILBES + ViaCEP (autopreenchimento de endereço) + Cloudinary + fontes.

```
frame-src 'self' blob: https://vlibras.gov.br https://res.cloudinary.com;
worker-src 'self';
object-src 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests;
```
- `frame-src`: iframes permitidos (VLibras, PDFs do Cloudinary)
- `worker-src 'self'`: Service Worker apenas do próprio domínio
- `object-src 'none'`: bloqueia Flash e plugins (obsoletos)
- `base-uri 'self'`: previne injeção de `<base>` tag
- `form-action 'self'`: formulários só submetem para o próprio domínio
- `upgrade-insecure-requests`: força HTTPS em recursos HTTP

---

# 6. Ação Necessária — CSP após remoção do Sentry

Com o Sentry removido, atualizar o `vercel.json` para remover as entradas:
- `https://o0.ingest.sentry.io` de `script-src`
- `https://o0.ingest.sentry.io` de `connect-src`

---

# 7. Pontos de Atenção

- **`unsafe-inline` em `script-src`** é necessário pelo Angular compilado — não é possível
  remover sem migrar para Strict CSP com nonces (complexidade alta, débito futuro)
- **VLibras** requer permissão explícita em `frame-src` e `connect-src` — widget obrigatório
  para sites gov.br; o ILBES usa por ser instituição pública federal

---

# 8. Relação com Outros Módulos

| Módulo | Relação |
|---|---|
| `ngsw-config.json` | Estratégia de cache do Service Worker |
| `environment.prod.ts` | URL da API em produção |
| `app.config.ts` | `provideServiceWorker()` (ativado em produção) |
| `angular.json` | Budget de bundle e configuração de build |

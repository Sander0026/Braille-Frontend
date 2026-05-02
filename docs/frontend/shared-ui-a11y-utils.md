# Modulo: Acessibilidade, UI Compartilhada e Utilitarios

---

# 1. Visao Geral

## Objetivo

Documentar componentes atomicos, pipes, diretivas, validadores, providers e servicos de acessibilidade/feedback usados transversalmente no frontend.

## Responsabilidade

Este modulo cobre `AccessibilityService`, `ToastService`, `ConfirmDialogService`, `HotkeysService`, `UiButtonComponent`, `UiInput`, `UiModal`, `PdfViewerComponent`, diretivas de scroll/mascara/Tab, pipes de formatacao/sanitizacao, utilitarios puros e validador de senha forte.

## Fluxo de Funcionamento

Paginas e layouts reutilizam componentes e utilitarios compartilhados para manter consistencia visual, feedback acessivel, formatacao de dados brasileiros, protecao de URLs, mascaras, modais com foco preso, escape de textarea/contenteditable e validacao de formularios.

---

# 2. Arquitetura e Metodologias

## Padroes Arquiteturais Identificados

* Design system leve por componentes standalone.
* ControlValueAccessor para input reutilizavel.
* Signals e computed para UI reativa.
* Focus trap com Angular CDK.
* Provider singleton para comportamento global de teclado.
* Pure pipes para formatacao performatica.
* Functional utilities para mascaras e diffs.
* Composition over inheritance com `injectFormDescarte`.

## Justificativa Tecnica

Componentes standalone reduzem dependencias e facilitam importacao pontual. Signals simplificam estado local sem subscriptions. Pipes puros evitam recalculos desnecessarios. Diretivas e providers encapsulam problemas de acessibilidade que seriam repetidos em telas diversas.

---

# 3. Fluxo Interno do Codigo

## Fluxo de Execucao

1. `AccessibilityService` restaura preferencias do `localStorage`.
2. Ao alternar contraste ou fonte, aplica classes/estilos no `document.documentElement`.
3. `ToastService` adiciona toast em signal e remove por timeout.
4. `ConfirmDialogService.confirmar` grava dados em signal e retorna Promise resolvida por confirmar/cancelar.
5. `HotkeysService` registra atalhos `Alt+Shift+N/O/F/H/D` e escuta `keydown`.
6. `UiInput` implementa `ControlValueAccessor` e sincroniza valor com Angular Forms.
7. `UiModal` renderiza `<dialog>`, backdrop, focus trap e emite `closed`.
8. `PdfViewerComponent` normaliza URL, gera Blob para assets locais e revoga ObjectURL no destroy.
9. Diretivas de mascara e Tab interceptam eventos de input/keydown.
10. Pipes formatam valores e sanitizam URLs/HTML conforme contexto.

## Dependencias Internas

* `ConfirmDialogService`
* `AccessibilityService`
* `ToastService`
* `SafeUrlPipe`
* `formatarCep`, `formatarTelefone`, `formatarCpfCnpj`, `formatarRg`
* `AuditLog`

## Dependencias Externas

* `@angular/core`
* `@angular/forms`
* `@angular/common`
* `@angular/platform-browser`
* `@angular/cdk/a11y`
* `rxjs`

---

# 4. Dicionario Tecnico

## Variaveis

* `LS_CONTRASTE`: chave `a11y_alto_contraste`.
* `LS_FONTE`: chave `a11y_tamanho_fonte`.
* `_altoContraste`: `BehaviorSubject<boolean>`.
* `_fonteSize`: `BehaviorSubject<FonteSize>`.
* `_toasts`: signal de lista de toasts.
* `nextId`: contador incremental de toasts.
* `dialogData`: signal com dados do dialogo atual.
* `hotkeys`: `Map<string, HotkeyAction>`.
* `onHelpRequested$`: `Subject<void>` para abrir ajuda de atalhos.
* `onNovoAlunoRequested$`: `Subject<void>` reservado para fluxo de novo aluno.
* `BLOCKED_PROTOCOLS`: lista `javascript:`, `data:`, `vbscript:`.
* `PASSWORD_MIN_LENGTH`: minimo 8.
* `AUDIT_FIELD_LABELS`: mapa de campos amigaveis de auditoria.
* `AUDIT_IGNORED_FIELDS`: campos tecnicos omitidos do diff.

## Funcoes e Metodos

* `toggleAltoContraste`: alterna contraste e persiste preferencia.
* `setFonte`: aplica fonte `padrao`, `grande` ou `extragrande`.
* `mostrar`, `sucesso`, `erro`, `aviso`, `info`, `remover`: ciclo de vida de toast.
* `confirmar`, `_confirmar`, `_cancelar`: ciclo de confirm dialog.
* `addHotkey`, `getRegisteredHotkeys`: registro/consulta de atalhos.
* `listenToKeyboard`: subscription global de teclado.
* `isInsideInputForm`: evita atalhos em inputs/editaveis.
* `writeValue`, `registerOnChange`, `registerOnTouched`, `setDisabledState`: CVA de `UiInput`.
* `closeOnBackdrop`, `onEscape`: fechamento de modal.
* `prepararPdf`, `normalizarUrl`, `deveRenderizarComoBlob`, `revogarObjectUrl`: fluxo PDF.
* `generatePreview`: remove HTML e trunca preview.
* `gerarDiferencas`: compara valores antigos/novos de auditoria.
* `senhaForteValidator`: valida comprimento, maiuscula, minuscula, numero e especial.

## Classes

* `AccessibilityService`: preferencias visuais globais.
* `ToastService`: feedback visual e audivel.
* `ConfirmDialogService`: promessas de confirmacao.
* `HotkeysService`: atalhos de teclado admin.
* `UiButtonComponent`: botao tipado com variantes.
* `UiInput`: input reutilizavel com CVA e ARIA.
* `UiModal`: modal com dialog e focus trap.
* `PdfViewerComponent`: visualizador seguro de PDF.
* `AnimateOnScrollDirective`: animacao por IntersectionObserver.
* `PhoneMaskDirective`: mascara de telefone.
* `TabEscapeDirective`: remove armadilha de Tab.
* Pipes: `AuditFriendlyPipe`, `CategoryLabelPipe`, `CepPipe`, `CpfRgPipe`, `DataBraillePipe`, `SafeUrlPipe`, `StripHtmlPipe`, `TelefonePipe`.

## Interfaces e Tipagens

* `FonteSize`: `padrao | grande | extragrande`.
* `ToastTipo`: `sucesso | erro | aviso | info`.
* `Toast`: `{ id, mensagem, tipo }`.
* `ConfirmDialogData`: titulo, mensagem, textos e tipo.
* `HotkeyAction`: combo, descricao e action.
* `AuditDiff`: campo, de, para e alterado.
* `PasswordStrengthErrors`: flags de regras de senha.

---

# 5. Servicos e Integracoes

## APIs

Nao ha endpoints diretos, exceto o `PdfViewerComponent`, que usa `fetch` para assets locais `/assets/...` com `credentials: 'same-origin'`.

## Banco de Dados

Nao acessa banco. Utilitarios formatam dados vindos da API.

## Servicos Externos

* Angular CDK A11y para `LiveAnnouncer` e `cdkTrapFocus`.
* Browser APIs: `localStorage`, `document`, `IntersectionObserver`, `URL.createObjectURL`, `AbortController`, `fetch`.

---

# 6. Seguranca e Qualidade

## Seguranca

* `SafeUrlPipe` bloqueia protocolos comuns de XSS antes de `bypassSecurityTrustResourceUrl`.
* `StripHtmlPipe` remove tags sem usar `innerHTML` ou `DOMParser`.
* `senhaForteValidator` aplica regras fortes e regex sem backtracking catastrofico.
* `TabEscapeDirective` e provider evitam armadilha de teclado.
* `PdfViewerComponent` revoga ObjectURLs para evitar vazamentos.

## Qualidade

* Componentes usam OnPush.
* Pipes sao puros.
* Utilitarios sao funcoes puras e testaveis.
* Existem specs para UI components, pipes e diretiva focavel.
* Comments indicam preocupacao com OWASP, WCAG e SSR guards.

## Performance

* `UiButton` usa `computed` em vez de `NgClass`.
* Toast roda fora da zona Angular para reduzir change detection.
* IntersectionObserver observa ate primeira visibilidade e desregistra.
* Provider global usa flag singleton para evitar listeners duplicados.

---

# 7. Regras de Negocio

* Preferencias de contraste/fonte persistem entre sessoes.
* Toast de erro dura 8s; demais usam 6s padrao.
* Atalhos so funcionam com `Alt+Shift` e fora de campos de formulario.
* Tab em textarea/contenteditable move foco, nao insere tabulacao.
* Senha forte exige ao menos 8 caracteres, maiuscula, minuscula, numero e especial.
* Datas ISO sao exibidas como `DD/MM/AAAA`.
* CPF, RG, telefone e CEP sao exibidos com mascara brasileira.

---

# 8. Relacao com Outros Modulos

* Layouts usam `AccessibilityService`, `ToastComponent`, `ConfirmDialog` e `HotkeysService`.
* Formularios usam `UiInput`, validadores, mascaras e `injectFormDescarte`.
* Auditoria usa `AuditFriendlyPipe` e `gerarDiferencas`.
* Ajuda e manuais usam visualizadores de PDF.
* Conteudo publico usa pipes de categoria, strip HTML e preview.

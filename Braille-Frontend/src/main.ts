import { bootstrapApplication } from '@angular/platform-browser';
import { isDevMode } from '@angular/core';
import * as Sentry from '@sentry/angular';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

// Inicializa o Sentry apenas se o DSN estiver configurado (evita erros em ambientes sem chave)
if (environment.sentryDsn) {
  Sentry.init({
    dsn: environment.sentryDsn,
    environment: environment.sentryEnv,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1,
    tracePropagationTargets: ['localhost', /^https:\/\/braille-api-oieq\.onrender\.com\/api/],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
  });
}

bootstrapApplication(App, appConfig)
  .then(() => {
    // Ferramentas de auditoria de acessibilidade ativas apenas em modo de desenvolvimento
    if (isDevMode()) {
      import('axe-core').then((axe) => {

        /** Exibe os detalhes de um nó de violação no console — extraído p/ reduzir nesting (SonarQube) */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const logViolationNode = (node: any): void => {
          const targetPath = node.target[0];
          const selectorString = Array.isArray(targetPath)
            ? targetPath.join(' ')
            : String(targetPath);

          let domElement: Element | null = null;
          try {
            domElement = document.querySelector(selectorString);
          } catch (selectorErr) {
            console.warn(`[A11Y Axe] Seletor inválido ignorado: "${selectorString}"`, selectorErr);
          }

          let angularComponent = 'N/A';
          let curr = domElement;
          while (curr) {
            if (curr.tagName?.toLowerCase().startsWith('app-')) {
              angularComponent = curr.tagName.toLowerCase();
              break;
            }
            curr = curr.parentElement;
          }

          console.log(`   📍 Componente: <%c${angularComponent}%c>`, 'color: #e65100; font-weight: bold;', 'color: inherit;');
          console.log(`   📝 Problema: ${node.failureSummary}`);
          console.log('   🔍 Elemento HTML afetado:', domElement ?? selectorString);
          console.log('   --------------------------------------------------');
        };

        /** Executa a auditoria Axe-Core e exibe violações formatadas no console DevTools */
        const rodarAuditoria = (): void => {
          console.log('%c⏳ Rodando auditoria do Axe-Core...', 'color: #1976d2;');

          axe.default.run().then((results) => {
            if (results.violations.length === 0) {
              console.log(
                '%c✅ [A11Y] Axe-core: Nenhuma violação nesta tela/modal!',
                'color: white; background: #2e7d32; font-weight: bold; padding: 4px 8px; border-radius: 4px;'
              );
              return;
            }

            console.log(
              `%c🚨 [A11Y] ${results.violations.length} REGRA(S) DE ACESSIBILIDADE VIOLADA(S)`,
              'color: white; background: #d32f2f; font-weight: bold; font-size: 14px; padding: 6px 12px; border-radius: 4px;'
            );

            results.violations.forEach((violation, index) => {
              console.log(
                `%c${index + 1}. ❌ ${violation.help} (${violation.id})`,
                'color: #d32f2f; font-weight: bold; font-size: 13px; margin-top: 10px;'
              );
              console.log(`📖 Como resolver: ${violation.helpUrl}`);

              violation.nodes.forEach(logViolationNode);
            });
          });
        };

        // Auditoria automática 2s após o boot — aguarda o Angular renderizar a tela inicial
        setTimeout(rodarAuditoria, 2000);

        // Expõe o comando global de forma segura (sem `as any`) para uso no DevTools.
        // `configurable: true` permite sobrescrever em testes sem erro.
        Object.defineProperty(globalThis, 'auditarAcessibilidade', {
          value: rodarAuditoria,
          configurable: true,
          writable: false,
        });

        console.log(
          '%c💡 DICA: Para testar modais, abra o modal e chame auditarAcessibilidade() no console.',
          'color: #e65100; font-style: italic; margin-top: 10px;'
        );
      });
    }
  })
  .catch((err) => console.error('[Bootstrap] Falha ao inicializar a aplicação:', err));
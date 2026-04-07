import { bootstrapApplication } from '@angular/platform-browser';
import { isDevMode } from '@angular/core';
import * as Sentry from '@sentry/angular';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

if (environment.sentryDsn) {
  Sentry.init({
    dsn: environment.sentryDsn,
    environment: environment.sentryEnv,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    tracePropagationTargets: ['localhost', /^https:\/\/braille-api-oieq\.onrender\.com\/api/],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

bootstrapApplication(App, appConfig)
  .then(() => {
    if (isDevMode()) {
      import('axe-core').then((axe) => {
        
        // Função central que faz a auditoria (Agora reutilizável)
        const rodarAuditoria = () => {
          console.log('%cRodando auditoria do Axe-Core...', 'color: #1976d2;');
          axe.default.run().then((results) => {
            if (results.violations.length > 0) {
              console.log(
                `%c[A11Y] ${results.violations.length} REGRA(S) DE ACESSIBILIDADE VIOLADA(S) NA TELA ATUAL`,
                'color: white; background: #d32f2f; font-weight: bold; font-size: 14px; padding: 6px 12px; border-radius: 4px;'
              );

              results.violations.forEach((violation, index) => {
                console.log(`%c${index + 1}. ❌ ${violation.help} (${violation.id})`, 'color: #d32f2f; font-weight: bold; font-size: 13px; margin-top: 10px;');
                console.log(`📖 Como resolver: ${violation.helpUrl}`);

                violation.nodes.forEach((node) => {
                  const targetPath = node.target[0];
                  const selectorString = Array.isArray(targetPath) ? targetPath.join(' ') : (targetPath as string);
                  
                  let domElement: Element | null = null;
                  try { domElement = document.querySelector(selectorString); } catch (e) {}

                  let angularComponent = 'N/A';
                  let curr = domElement;
                  while (curr) {
                    if (curr.tagName && curr.tagName.toLowerCase().startsWith('app-')) {
                      angularComponent = curr.tagName.toLowerCase();
                      break;
                    }
                    curr = curr.parentElement;
                  }

                  console.log(`   [Componente] <%c${angularComponent}%c>`, 'color: #e65100; font-weight: bold;', 'color: inherit;');
                  console.log(`   [Problema] ${node.failureSummary}`);
                  console.log('   [Elemento HTML afetado]:', domElement || selectorString);
                  console.log('   --------------------------------------------------');
                });
              });
            } else {
              console.log('%c[A11Y] Axe-core: Nenhuma violação nesta tela/modal!', 'color: white; background: #2e7d32; font-weight: bold; padding: 4px 8px; border-radius: 4px;');
            }
          });
        };

        // 1. Roda sozinho no início (igual antes)
        setTimeout(rodarAuditoria, 2000);

        // 2. A MÁGICA: Cria um comando global para você chamar a qualquer momento!
        (window as any).auditarAcessibilidade = rodarAuditoria;
        
        console.log('%c💡 DICA: Para testar modais, abra o modal e digite auditarAcessibilidade() no console.', 'color: #e65100; font-style: italic; margin-top: 10px;');
      });
    }
  })
  .catch((err) => console.error(err));
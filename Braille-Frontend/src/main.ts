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
        setTimeout(() => {
          axe.default.run().then((results) => {
            if (results.violations.length > 0) {
              
              // Título Principal
              console.log(
                `%c🚨 [A11Y] ${results.violations.length} REGRA(S) DE ACESSIBILIDADE VIOLADA(S)`,
                'color: white; background: #d32f2f; font-weight: bold; font-size: 14px; padding: 6px 12px; border-radius: 4px;'
              );

              results.violations.forEach((violation, index) => {
                // Nome do Erro
                console.log(
                  `%c${index + 1}. ❌ ${violation.help} (${violation.id})`,
                  'color: #d32f2f; font-weight: bold; font-size: 13px; margin-top: 10px;'
                );
                console.log(`📖 Como resolver: ${violation.helpUrl}`);

                violation.nodes.forEach((node) => {
                  const targetPath = node.target[0];
                  const selectorString = Array.isArray(targetPath) ? targetPath.join(' ') : (targetPath as string);
                  
                  // Blindagem: Tenta achar o elemento, se falhar, não quebra o log
                  let domElement: Element | null = null;
                  try {
                    domElement = document.querySelector(selectorString);
                  } catch (e) {
                    // Ignora erro de seletor complexo
                  }

                  // Descobre o componente Angular
                  let angularComponent = 'index.html / Raiz';
                  let curr = domElement;
                  while (curr) {
                    if (curr.tagName && curr.tagName.toLowerCase().startsWith('app-')) {
                      angularComponent = curr.tagName.toLowerCase();
                      break;
                    }
                    curr = curr.parentElement;
                  }

                  // Imprime os detalhes do elemento com erro
                  console.log(`   📍 Componente: <%c${angularComponent}%c>`, 'color: #e65100; font-weight: bold;', 'color: inherit;');
                  console.log(`   📝 Problema: ${node.failureSummary}`);
                  console.log('   🔍 Elemento HTML afetado:', domElement || selectorString);
                  console.log('   --------------------------------------------------');
                });
              });

            } else {
              console.log(
                '%c✅ [A11Y] Axe-core: Nenhuma violação de acessibilidade nesta tela!',
                'color: white; background: #2e7d32; font-weight: bold; padding: 4px 8px; border-radius: 4px;'
              );
            }
          });
        }, 2000); 
      });
    }
  })
  .catch((err) => console.error(err));
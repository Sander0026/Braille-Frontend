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
      // Injeta auditoria automática de Acessibilidade no devTools
      import('axe-core').then((axe) => {
        setTimeout(() => {
          axe.default.run().then((results) => {
            if (results.violations.length > 0) {
              console.groupCollapsed('%c[A11Y] ' + results.violations.length + ' Violações de Acessibilidade Encontradas', 'color: red; font-weight: bold;');
              console.table(results.violations);
              console.groupEnd();
            } else {
              console.log('%c[A11Y] Axe-core: Nenhuma violação na carga inicial.', 'color: green;');
            }
          });
        }, 2000); // aguarda animações
      });
    }
  })
  .catch((err) => console.error(err));

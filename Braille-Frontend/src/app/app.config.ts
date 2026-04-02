import {
  ApplicationConfig,
  ErrorHandler,
  isDevMode,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';
import { QuillModule } from 'ngx-quill';
import * as Sentry from '@sentry/angular';

import { routes } from './app.routes';
import { apiInterceptor } from './core/interceptors/api.interceptor';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { provideTabEscapeForTextareas } from './shared/providers/tab-escape.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    // ── Core ────────────────────────────────────────────────────────
    provideBrowserGlobalErrorListeners(),
    // TODO: migrar para CSS nativo + animate.enter/leave (Angular 21+) após ngx-quill suportar a nova API.
    // provideAnimations() está deprecated desde Angular 19, remoção prevista para v23.
    // Dependência bloqueante: ngx-quill ainda depende da DSL legada de animações.
    provideAnimations(),

    // ── Roteamento ──────────────────────────────────────────────────
    provideRouter(routes),

    // ── HTTP + Interceptors ─────────────────────────────────────────
    provideHttpClient(
      withFetch(),
      withInterceptors([apiInterceptor, authInterceptor, errorInterceptor])
    ),

    // ── UI / Plugins ────────────────────────────────────────────────
    importProvidersFrom(QuillModule.forRoot()),

    // ── Acessibilidade (A11y) ────────────────────────────────────────
    ...provideTabEscapeForTextareas(),

    // ── Service Worker (PWA) ─────────────────────────────────────────
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),

    // ── Monitoring / Observabilidade (Sentry) ────────────────────────
    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler({ showDialog: false }),
    },
  ],
};

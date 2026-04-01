import { ApplicationConfig, provideBrowserGlobalErrorListeners, ErrorHandler, isDevMode, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import * as Sentry from '@sentry/angular';
import { QuillModule } from 'ngx-quill';

import { routes } from './app.routes';
import { apiInterceptor } from './core/interceptors/api.interceptor';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { provideServiceWorker } from '@angular/service-worker';
import { provideTabEscapeForTextareas } from './shared/providers/tab-escape.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(QuillModule.forRoot()),
    {
        provide: ErrorHandler,
        useValue: Sentry.createErrorHandler({
            showDialog: false,
        }),
    },
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimationsAsync(),
    // Registry de Escudos da API (Ida + Volta + Quedas)
    provideHttpClient(withFetch(), withInterceptors([apiInterceptor, authInterceptor, errorInterceptor])),
    provideServiceWorker('ngsw-worker.js', {
        enabled: !isDevMode(),
        registrationStrategy: 'registerWhenStable:30000'
    }),
    ...provideTabEscapeForTextareas(),
]
};

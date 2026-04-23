import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ToastService } from '../services/toast.service';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Interceptor Global de Erros focado em Acessibilidade (Toast Service com ARIA nativo).
 * Captura códigos severos (5xx, 0) ou falhas de autorização explícitas (403)
 * para emitir feedback audível e visual ao usuário de forma centralizada.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 0: Internet Off, Backend Caído ou CORS Severo bloqueando a conexão.
      if (error.status === 0) {
        toast.erro('Oops... O Sistema está fora do ar ou sua Internet caiu.');
      } 
      // 403: Forbidden - Tentativa de ação sem acesso no Banco de Dados
      else if (error.status === 403) {
        toast.erro('Comando Proibido. Você não tem licença para executar esta ação.');
      } 
      // 500+: Catástrofes no Backend ou Banco de Dados (Prisma)
      else if (error.status >= 500) {
        toast.erro('O Servidor de Nuvem falhou internamente. Nossa equipe técnica foi acionada!');
      }

      // Os erros 400 (Formulário Ruim) ou 401 (Refresh Handler) seguem suas vidas
      // pois geralmente os próprios componentes ou auth.interceptor dão o feedback manual apropriado.
      return throwError(() => error);
    })
  );
};

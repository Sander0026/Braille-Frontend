import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * Interceptor que injeta o Bearer Token JWT nas requisições seguras da API
 * e captura erros 401 globais para deslogar forçadamente a aplicação.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);
  const token = authService.getToken();

  // Rotas públicas que NÃO precisam de token
  const publicUrls = ['/auth/login', '/inscricoes', '/contatos'];
  const isPublicPost = publicUrls.some(url => req.url.includes(url) && req.method === 'POST');

  let novoReq = req;

  // Injetar o Token de Acesso na viagem de ida a Vercel
  if (token && !isPublicPost) {
    novoReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  // Interceptar a viagem de volta do response avaliando se fomos derrubados
  return next(novoReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 Unauthorized indica Token Vencido ou Forjado/Inválido Backend
      if (error.status === 401) {
        authService.logout(); // Remove localStorage e signals
        toast.aviso('Sua sessão expirou por medida de segurança. Por favor, acesse novamente.');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';

/**
 * Interceptor que injeta o Bearer Token JWT nas requisições seguras da API
 * e captura erros 401 globais para deslogar forçadamente a aplicação.
 */
let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

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
      // 401 Unauthorized indica Token Vencido (Passaporte 15min Morto)
      if (error.status === 401 && !novoReq.url.includes('/auth/refresh') && authService.getRefreshToken()) {

        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null); // Trava o resto da fila de Imagens / Endpoints

          return authService.renovarToken().pipe(
            switchMap((tokenResponse: any) => {
              isRefreshing = false;
              refreshTokenSubject.next(tokenResponse.access_token);
              // Repete a batida que falhou usando o NOVO Token (Tudo escuro para o usuário)
              return next(novoReq.clone({ setHeaders: { Authorization: `Bearer ${tokenResponse.access_token}` } }));
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              authService.logout(); // Destroi todas as Cookies (Tentou hackear API de Refresh ou Visto de 7D Revogado)
              toast.aviso('Sua Sessão Segura foi invalidada perlo servidor. Faça o Login novamente.');
              router.navigate(['/login']);
              return throwError(() => refreshError);
            })
          );
        } else {
          // Se já está no meio do redemoinho pedindo 1 token novo, os outros componentes entram na Fila (BehaviorSubject)
          return refreshTokenSubject.pipe(
            filter(t => t != null),
            take(1),
            switchMap(jwt => {
              return next(novoReq.clone({ setHeaders: { Authorization: `Bearer ${jwt}` } }));
            })
          );
        }
      }

      // Caiu num 401 mas não tinha Refresh Token, ou já estava fora logado = Manda pro limbo convencional.
      if (error.status === 401 && !novoReq.url.includes('/auth/refresh')) {
        authService.logout();
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};

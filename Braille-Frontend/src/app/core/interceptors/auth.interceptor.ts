import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Router } from '@angular/router';
import { BehaviorSubject, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { LiveAnnouncer } from '@angular/cdk/a11y';

/**
 * Interceptor de Autenticação.
 * Escopo: Interceptar viagens de ida (Injetar JWT) e Voltas (Tratar Exclusivamente 401 - Token Vencido).
 * Respeita Single Responsibility delegando erros genéricos de API.
 */
// Variáveis persistentes no módulo para o ciclo de vida da Engine Concorrente do Refresh
let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);
  const announcer = inject(LiveAnnouncer);
  const token = authService.getToken();

  // Rotas públicas mapeadas rigorosamente que não admitem Tokens na Criação/Registro
  const publicPaths = ['/auth/login', '/inscricoes', '/contatos'];
  const isPublicUrl = publicPaths.some(path => req.url.endsWith(path) || req.url.includes(path));
  const isPublicPost = isPublicUrl && req.method === 'POST';

  let novoReq = req;

  // 1. Viagem de Ida: Injetar o Token de Acesso
  if (token && !isPublicPost) {
    novoReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  // 2. Viagem de Volta: Capturar somente os Gritos de Desautenticação (401)
  return next(novoReq).pipe(
    catchError((error: HttpErrorResponse) => {
      
      if (error.status === 401) {
          const isRefreshRoute = novoReq.url.includes('/auth/refresh');
          const hasRefreshToken = !!authService.getRefreshToken();

          // A) Rota de Refresh falhou? O Visto morreu permanentemente (Loop da Morte protegido).
          if (isRefreshRoute) {
             authService.logout();
             toast.aviso('Sua sessão expirou perfeitamente. Faça seu login novamente.');
             announcer.announce('Redirecionado para o login: A sessão expirou.', 'assertive');
             router.navigate(['/login']);
             return throwError(() => error);
          }

          // B) Tem Refresh Token? Reconstruir Sessão sob os panos via Subscrição Transparente
          if (hasRefreshToken) {
            if (isRefreshing) {
              // C) Uma renovação concorrente já está rolando. Me coloco na fila silenciosa.
              return refreshTokenSubject.pipe(
                filter(t => t != null),
                take(1),
                switchMap(jwt => {
                  return next(novoReq.clone({ setHeaders: { Authorization: `Bearer ${jwt}` } }));
                })
              );
            } else {
              isRefreshing = true;
              refreshTokenSubject.next(null); // Congela a fila (Image loading, Profile fetch)
              
              return authService.renovarToken().pipe(
                switchMap((tokenResponse: any) => {
                  isRefreshing = false;
                  refreshTokenSubject.next(tokenResponse.access_token);
                  // Refaz a request que tomou o primeiro Tiro 401 agora com Colete Prova-De-Balas
                  return next(novoReq.clone({ setHeaders: { Authorization: `Bearer ${tokenResponse.access_token}` } }));
                }),
                catchError((refreshError) => {
                  isRefreshing = false;
                  authService.logout();
                  toast.aviso('Falha grave na estabilização. Sua conta foi desconectada por segurança.');
                  announcer.announce('Redirecionado para o login: Falha de segurança na conexão.', 'assertive');
                  router.navigate(['/login']);
                  return throwError(() => refreshError);
                })
              );
            }
          } else {
            // D) Sem tokens sobreviventes. Direto pra degola.
            authService.logout();
            toast.aviso('Sessão expirada. Faça login novamente para acessar.');
            announcer.announce('Redirecionado para o login: Sem tokens de acesso.', 'assertive');
            router.navigate(['/login']);
          }
      }

      // Os erros não-401 escorrem livremente para quem é de direito (Nosso novo error.interceptor).
      return throwError(() => error);
    })
  );
};

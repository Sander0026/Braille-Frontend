import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor que injeta o Bearer Token JWT em todas as requisições
 * para a API do backend (localhost:3000).
 * Não injeta o token em rotas públicas (login, inscricoes POST, contatos POST).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Rotas públicas que NÃO precisam de token
  const publicUrls = ['/auth/login', '/inscricoes', '/contatos'];
  const isPublicPost = publicUrls.some(url =>
    req.url.includes(url) && req.method === 'POST'
  );

  if (token && !isPublicPost) {
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(authReq);
  }

  return next(req);
};

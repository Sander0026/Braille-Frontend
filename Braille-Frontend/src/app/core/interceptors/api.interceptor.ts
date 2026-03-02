import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
    // Ignora chamadas que já possuem o endereço HTTP/HTTPS inteiro
    if (req.url.startsWith('http')) {
        return next(req);
    }

    // Intercepta rotas relativas que dependem de /api
    if (req.url.startsWith('/api')) {
        const apiReq = req.clone({ url: `${environment.apiUrl}${req.url.replace('/api', '')}` });
        return next(apiReq);
    }

    return next(req);
};

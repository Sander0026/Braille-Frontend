import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard funcional que protege as rotas do painel admin.
 * Redireciona para /login se o usuário não estiver autenticado.
 */
export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isLoggedIn()) {
        const user = authService.getUser();

        // Se ainda precisa trocar a senha, o token existe mas o acesso é revogado até trocar
        if (user?.precisaTrocarSenha) {
            authService.logout(); // Opcional: desloga para forçar um login limpo, ou os envia pro login pra ver a view de troca
            router.navigate(['/login']);
            return false;
        }

        return true;
    }

    router.navigate(['/login']);
    return false;
};

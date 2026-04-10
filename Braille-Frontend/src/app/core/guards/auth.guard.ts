import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';

/**
 * Guard funcional que protege as rotas do painel admin.
 * Redireciona para /login se o usuário não estiver autenticado.
 */
export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const toast = inject(ToastService);
    const announcer = inject(LiveAnnouncer);

    if (authService.isLoggedIn()) {
        const user = authService.getUser();

        // Se ainda precisa trocar a senha, o token existe mas o acesso é revogado até trocar
        if (user?.precisaTrocarSenha) {
            authService.logout(); // Opcional: desloga para forçar um login limpo, ou os envia pro login pra ver a view de troca
            toast.aviso('É necessário atualizar sua senha antes de prosseguir.');
            announcer.announce('Redirecionado para o login: É necessário atualizar sua senha.', 'assertive');
            router.navigate(['/login']);
            return false;
        }

        return true;
    }

    toast.aviso('Sessão expirada ou não autenticada. Faça login para continuar.');
    announcer.announce('Redirecionado para o login: Sessão restrita ou expirada.', 'polite');
    router.navigate(['/login']);
    return false;
};

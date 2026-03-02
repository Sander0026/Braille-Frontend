import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard funcional que protege rotas específicas baseadas no perfil (role) do usuário.
 * Redireciona para o dashboard com mensagem de erro se não tiver permissão.
 */
export const roleGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // O auth.guard já deve ter garantido o login, mas checamos por segurança
    const user = authService.getUser();
    if (!user) {
        router.navigate(['/login']);
        return false;
    }

    // Lê os roles permitidos na rota (ex: data: { roles: ['ADMIN', 'SECRETARIA'] })
    const rolesPermitidos = route.data['roles'] as Array<string>;

    if (!rolesPermitidos || rolesPermitidos.length === 0) {
        return true; // Se a rota não especificou roles, libera acesso
    }

    if (rolesPermitidos.includes(user.role)) {
        return true; // Usuário tem um dos roles permitidos
    }

    // Acesso Negado: Redireciona para o painel inicial com um aviso
    // Se o usuário já estiver na rota raiz, evitamos loop
    if (state.url === '/admin/dashboard' || state.url === '/admin') {
        return false; // Evita loop infinito caso a dashboard também tenha restrição que não devia
    }
    
    router.navigate(['/admin/dashboard'], { queryParams: { acesso: 'negado' } });
    return false;
};

import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

export const atendimentoIndividualPermissionGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const role = auth.getUser()?.role;
  const allowedRoles = route.data?.['roles'] as string[] | undefined;

  if (role && allowedRoles?.length) {
    return allowedRoles.includes(role) ? true : router.createUrlTree(['/admin/dashboard']);
  }

  if (role === 'ADMIN' || role === 'SECRETARIA' || role === 'PROFESSOR') {
    return true;
  }

  return router.createUrlTree(['/admin/dashboard']);
};

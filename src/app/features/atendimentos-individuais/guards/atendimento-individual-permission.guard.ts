import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

export const atendimentoIndividualPermissionGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const role = auth.getUser()?.role;

  if (role === 'ADMIN' || role === 'SECRETARIA' || role === 'PROFESSOR') {
    return true;
  }

  return router.createUrlTree(['/admin/dashboard']);
};

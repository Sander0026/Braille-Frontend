import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // Verifica se o usuário tem o crachá (token) salvo no navegador
  const token = localStorage.getItem('token_braille');

  if (token) {
    // Se tem o token, a porta do /admin se abre!
    return true;
  } else {
    // Se não tem, manda ele para a página de login do site público
    router.navigate(['/login']);
    return false;
  }
};
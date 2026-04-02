import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Comprimento mínimo exigido para senhas. Exportado para uso em hints de UX e testes. */
export const PASSWORD_MIN_LENGTH = 8;

/**
 * Detalhe das regras de senha que falharam.
 * Permite que templates renderizem mensagens específicas por regra.
 */
export interface PasswordStrengthErrors {
  tooShort: boolean;
  missingUppercase: boolean;
  missingLowercase: boolean;
  missingNumber: boolean;
  missingSpecial: boolean;
}

/**
 * Validador Angular Reativo para força de senha.
 *
 * Aplica as regras OWASP para senhas seguras com feedback granular por regra.
 * Compatível com ReDoS (sem back-tracking catastrófico nos regex).
 *
 * @example
 * // FormBuilder
 * this.fb.group({ senha: ['', [Validators.required, senhaForteValidator]] });
 *
 * // Template — verificação de falha genérica (retrocompatível):
 * *ngIf="f.senha.errors?.['senhaFraca']"
 *
 * // Template — feedback específico por regra (padrão Enterprise):
 * *ngIf="f.senha.errors?.['senhaFraca']?.missingUppercase"
 * *ngIf="f.senha.errors?.['senhaFraca']?.missingNumber"
 */
export function senhaForteValidator(control: AbstractControl): ValidationErrors | null {
  const senha: string = control.value ?? '';

  // Retorno null permite encadeamento com Validators.required sem conflito
  if (!senha) return null;

  const erros: PasswordStrengthErrors = {
    tooShort:        senha.length < PASSWORD_MIN_LENGTH,
    missingUppercase: !/[A-Z]/.test(senha),
    missingLowercase: !/[a-z]/.test(senha),
    missingNumber:    !/[0-9]/.test(senha),
    // ReDoS-safe: classe de caracteres sem alternância nem quantificadores aninhados
    missingSpecial:   !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(senha),
  };

  const senhaValida = Object.values(erros).every(falhou => !falhou);
  if (senhaValida) return null;

  // O objeto `erros` é truthy — retrocompatível com `errors?.['senhaFraca']` existente
  return { senhaFraca: erros };
}

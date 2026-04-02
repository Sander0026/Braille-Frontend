import { AbstractControl, ValidationErrors } from '@angular/forms';

export function senhaForteValidator(control: AbstractControl): ValidationErrors | null {
  const s = control.value || '';
  if (!s) return null; // Retorno null permite validações conjuntas com required
  
  // OWASP Top 10 - regex base sem back-tracking de colapso extremo (ReDoS safe)
  const hasUpper = /[A-Z]/.test(s);
  const hasLower = /[a-z]/.test(s);
  const hasNumber = /[0-9]/.test(s);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(s);
  
  if (s.length >= 8 && hasUpper && hasLower && hasNumber && hasSpecial) {
    return null; /* Válido */
  }
  return { senhaFraca: true }; /* Erro mapeado */
}

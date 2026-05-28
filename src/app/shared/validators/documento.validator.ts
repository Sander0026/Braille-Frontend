import { AbstractControl, ValidationErrors } from '@angular/forms';

function apenasDigitos(valor: unknown): string {
  return String(valor ?? '').replace(/\D/g, '');
}

function todosIguais(valor: string): boolean {
  return valor.length > 0 && valor.split('').every((char) => char === valor[0]);
}

export function validarCpf(valor: unknown): boolean {
  const numeros = apenasDigitos(valor);
  if (numeros.length !== 11 || todosIguais(numeros)) return false;

  const digitos = numeros.split('').map(Number);
  const soma1 = digitos.slice(0, 9).reduce((acc, digito, index) => acc + digito * (10 - index), 0);
  const digito1 = soma1 % 11 < 2 ? 0 : 11 - (soma1 % 11);
  if (digitos[9] !== digito1) return false;

  const soma2 = digitos.slice(0, 10).reduce((acc, digito, index) => acc + digito * (11 - index), 0);
  const digito2 = soma2 % 11 < 2 ? 0 : 11 - (soma2 % 11);
  return digitos[10] === digito2;
}

export function validarCnpj(valor: unknown): boolean {
  const numeros = apenasDigitos(valor);
  if (numeros.length !== 14 || todosIguais(numeros)) return false;

  const digitos = numeros.split('').map(Number);
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const soma1 = digitos.slice(0, 12).reduce((acc, digito, index) => acc + digito * pesos1[index], 0);
  const digito1 = soma1 % 11 < 2 ? 0 : 11 - (soma1 % 11);
  if (digitos[12] !== digito1) return false;

  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const soma2 = digitos.slice(0, 13).reduce((acc, digito, index) => acc + digito * pesos2[index], 0);
  const digito2 = soma2 % 11 < 2 ? 0 : 11 - (soma2 % 11);
  return digitos[13] === digito2;
}

export function cpfValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined || value === '') return null;
  return validarCpf(value) ? null : { cpfInvalido: true };
}

export function cpfCnpjValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined || value === '') return null;
  return validarCpf(value) || validarCnpj(value) ? null : { cpfCnpjInvalido: true };
}

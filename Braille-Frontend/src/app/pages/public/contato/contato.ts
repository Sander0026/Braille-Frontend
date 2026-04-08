import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { SiteConfigService } from '../../../core/services/site-config';
import { TabEscapeDirective } from '../../../shared/directives/tab-escape.directive';
import { PhoneMaskDirective } from '../../../shared/directives/phone-mask.directive';
import { ContatoService, ContatoPayload } from './contato.service';
import { Observable } from 'rxjs';
import { map, shareReplay, finalize } from 'rxjs/operators';

// Validação customizada para exigência de contato (Email ou Telefone obrigatório)
function contatoObrigatorioValidator(control: AbstractControl): ValidationErrors | null {
  const email = control.get('email')?.value?.trim();
  const telefone = control.get('telefone')?.value?.trim();

  if (!email && !telefone) {
    return { contatoObrigatorio: true };
  }
  return null;
}

@Component({
  selector: 'app-contato',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TabEscapeDirective, PhoneMaskDirective],
  templateUrl: './contato.html',
  styleUrl: './contato.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contato {
  contatoForm: FormGroup;

  // Gerenciamento de Estado de UI focado em Single Source via Signals
  enviando = signal<boolean>(false);
  enviado = signal<boolean>(false);
  erroEnvio = signal<string>('');

  // Cache e Prevenção de Leak via ShareReplay
  contatoConfig$: Observable<any>;

  constructor(
    private fb: FormBuilder,
    private contatoService: ContatoService,
    private siteConfig: SiteConfigService
  ) {
    this.contatoForm = this.fb.group(
      {
        nome: ['', [Validators.required, Validators.minLength(2)]],
        // Validators.email nativo do Angular é muito permissivo e não exige TLD (ponto domínio).
        // Adicionado fallback de Regex para paridade exata com o class-validator do backend.
        email: ['', [Validators.email, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)]],
        telefone: ['', [Validators.maxLength(15)]],
        assunto: ['', [Validators.required, Validators.minLength(3)]],
        mensagem: ['', [Validators.required, Validators.minLength(10)]],
      },
      { validators: contatoObrigatorioValidator }
    );

    this.contatoConfig$ = this.siteConfig.secoes$.pipe(
      map(secoes => secoes['contato_global'] || {}),
      shareReplay(1)
    );
  }

  isCampoInvalido(campo: string): boolean {
    const control = this.contatoForm.get(campo);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  isContatoObrigatorioInvalido(): boolean {
    const isTouched = this.contatoForm.get('email')?.touched || this.contatoForm.get('telefone')?.touched;
    return !!(this.contatoForm.errors?.['contatoObrigatorio'] && isTouched);
  }

  enviar(): void {
    if (this.contatoForm.invalid) {
      this.contatoForm.markAllAsTouched();
      return;
    }

    if (this.enviando()) return;

    this.enviando.set(true);
    this.erroEnvio.set('');

    const rawForm = this.contatoForm.value;
    const payload: ContatoPayload = {
      nome: rawForm.nome.trim(),
      assunto: rawForm.assunto.trim(),
      mensagem: rawForm.mensagem.trim(),
    };

    if (rawForm.email?.trim()) payload.email = rawForm.email.trim();
    if (rawForm.telefone?.trim()) payload.telefone = rawForm.telefone.trim();

    this.contatoService
      .enviarContato(payload)
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: () => this.enviado.set(true),
        error: (err: HttpErrorResponse) => {
          let msgErro = 'Não foi possível processar sua mensagem neste momento. Tente novamente.';
          
          // Trata especificamente erros de validação da API (400) para feedback claro e não opaco
          if (err.status === 400 && err.error?.message) {
            msgErro = Array.isArray(err.error.message) ? err.error.message[0] : err.error.message;
          }
          
          this.erroEnvio.set(msgErro);
        },
      });
  }

  novoContato(): void {
    this.enviado.set(false);
    this.erroEnvio.set('');
    this.contatoForm.reset();
  }
}

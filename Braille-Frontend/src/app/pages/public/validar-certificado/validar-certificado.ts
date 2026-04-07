import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  signal,
  inject,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { ModelosCertificadosService } from '../../../core/services/modelos-certificados.service';

@Component({
  selector: 'app-validar-certificado',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './validar-certificado.html',
  styleUrls: ['./validar-certificado.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidarCertificado {

  // ── DI via inject() — campo-level = injection context válido ────────────────
  private readonly fb                  = inject(FormBuilder);
  private readonly route               = inject(ActivatedRoute);
  private readonly certificadosService = inject(ModelosCertificadosService);
  private readonly destroyRef          = inject(DestroyRef);

  // ── Estado reativo ───────────────────────────────────────────────────────────
  resultadoValidacao = signal<any>(null);
  erroValidacao      = signal<boolean>(false);
  buscando           = signal<boolean>(false);

  // ── Formulário ───────────────────────────────────────────────────────────────
  readonly form: FormGroup = this.fb.group({
    codigo: ['', [Validators.required, Validators.minLength(5)]],
  });

  constructor() {
    /**
     * takeUntilDestroyed() SEM argumento é válido aqui porque está dentro do
     * constructor = injection context ativo.
     * Alternativa equivalente: passar this.destroyRef explicitamente.
     */
    this.route.queryParams
      .pipe(takeUntilDestroyed())
      .subscribe(params => {
        const codigoParams = params['codigo'];
        if (codigoParams) {
          this.form.patchValue({ codigo: codigoParams });
          this.validar();
        }
      });
  }

  validar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.buscando.set(true);
    this.resultadoValidacao.set(null);
    this.erroValidacao.set(false);

    // Sanitização do código (sem XSS/Injection — apenas trim + uppercase)
    const codigoLimpo: string = (this.form.value.codigo as string).trim().toUpperCase();

    /**
     * CORREÇÃO NG0203: takeUntilDestroyed() dentro de um método normal requer
     * DestroyRef explícito — sem ele, o Angular não encontra o injection context.
     */
    this.certificadosService.validarAutenticidade(codigoLimpo)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.erroValidacao.set(true);
          this.resultadoValidacao.set(null);
          this.buscando.set(false);
          return of(null); // Aborto silencioso — sem stack traces expostos (OWASP)
        }),
      )
      .subscribe(result => {
        if (result) {
          this.resultadoValidacao.set(result);
          this.erroValidacao.set(false);
        }
        this.buscando.set(false);
      });
  }
}

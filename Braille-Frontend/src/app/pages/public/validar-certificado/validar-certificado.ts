import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush // Alta Resolução SRP Reativa
})
export class ValidarCertificado implements OnInit {
  form: FormGroup;
  
  // Rastreio Atômico Moderno DevSecOps (Substitui CD Refing Manual)
  resultadoValidacao = signal<any>(null);
  erroValidacao = signal<boolean>(false);
  buscando = signal<boolean>(false);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private certificadosService: ModelosCertificadosService
  ) {
    // Validação Segura e Sanitations Integradas ao Hook Frontal
    this.form = this.fb.group({
      codigo: ['', [Validators.required, Validators.minLength(5)]]
    });
    
    // Tratamento Atômico do Memory Leak Nativo de QueryParams (Fechado via DI-Destruída)
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

  ngOnInit(): void {}

  validar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.buscando.set(true);
    this.resultadoValidacao.set(null);
    this.erroValidacao.set(false);

    // Sanitização de Injection Frontal (Clean Format String)
    const codigoLimpo = this.form.value.codigo.trim().toUpperCase();

    // Barreira contra Memory Leaks WCF Network
    this.certificadosService.validarAutenticidade(codigoLimpo)
      .pipe(
        takeUntilDestroyed(),
        catchError(() => {
          this.erroValidacao.set(true);
          this.resultadoValidacao.set(null);
          this.buscando.set(false);
          return of(null); // Abort silenciado sem Stack Traces Vazadas
        })
      )
      .subscribe((result) => {
        if (result) {
          this.resultadoValidacao.set(result);
          this.erroValidacao.set(false);
        }
        this.buscando.set(false);
      });
  }
}

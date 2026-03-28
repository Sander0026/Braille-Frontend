import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ModelosCertificadosService } from '../../../core/services/modelos-certificados.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-validar-certificado',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './validar-certificado.html',
  styleUrls: ['./validar-certificado.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ValidarCertificado implements OnInit {
  form: FormGroup;
  resultadoValidacao: any = null;
  erroValidacao = false;
  buscando = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private certificadosService: ModelosCertificadosService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      codigo: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  ngOnInit(): void {
    // Escuta querystring para preencher automatizado via QR Code
    this.route.queryParams.subscribe(params => {
      const codigoParams = params['codigo'];
      if (codigoParams) {
        this.form.patchValue({ codigo: codigoParams });
        this.validar();
      }
    });
  }

  validar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.buscando = true;
    this.resultadoValidacao = null;
    this.erroValidacao = false;
    this.cdr.markForCheck();

    const codigoLimpo = this.form.value.codigo.trim().toUpperCase();

    this.certificadosService.validarAutenticidade(codigoLimpo).pipe(
      catchError(err => {
        this.erroValidacao = true;
        this.resultadoValidacao = null;
        this.buscando = false;
        this.cdr.markForCheck();
        return of(null);
      })
    ).subscribe(result => {
      if (result) {
        this.resultadoValidacao = result;
        this.erroValidacao = false;
      }
      this.buscando = false;
      this.cdr.markForCheck();
    });
  }
}

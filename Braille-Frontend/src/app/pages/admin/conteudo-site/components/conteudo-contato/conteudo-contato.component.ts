import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SiteConfigService } from '../../../../../core/services/site-config';
import { ToastService } from '../../../../../core/services/toast.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, take } from 'rxjs/operators';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-conteudo-contato',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuillModule],
  templateUrl: './conteudo-contato.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConteudoContatoComponent implements OnInit {

  formContato: FormGroup;
  carregando = signal(true);
  salvando = signal(false);

  private readonly fb = inject(FormBuilder);
  private readonly siteConfig = inject(SiteConfigService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);

  constructor() {
    this.formContato = this.fb.group({
      telefoneCentral: [''],
      emailOficial: ['', Validators.email],
      enderecoCompleto: [''],
      instagram: [''],
      facebook: [''],
      youtube: [''],
      linkedin: [''],
      heroDescricaoContato: [''],
      footerDireitos: ['']
    });
  }

  ngOnInit() {
    this.carregarDados();
  }

  carregarDados() {
    this.carregando.set(true);
    this.siteConfig.secoes$.pipe(
      filter(s => Object.keys(s).length > 0),
      take(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(secoes => {
      if (secoes['contato_global']) {
        this.formContato.patchValue(secoes['contato_global']);
      }
      this.carregando.set(false);
    });
  }

  salvarContato() {
    if (this.formContato.invalid) return;
    this.salvando.set(true);
    
    const valores = this.formContato.value;
    const array = Object.keys(valores).map(k => ({ chave: k, valor: String(valores[k] || '') }));

    this.siteConfig.salvarSecao('contato_global', array).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.salvando.set(false);
        this.toast.sucesso('Informações de contato e redes sociais salvas com sucesso!');
        this.siteConfig.carregarSecoes().pipe(take(1)).subscribe();
      },
      error: () => {
        this.salvando.set(false);
        this.toast.erro('Erro ao salvar as configurações de contato.');
      }
    });
  }
}

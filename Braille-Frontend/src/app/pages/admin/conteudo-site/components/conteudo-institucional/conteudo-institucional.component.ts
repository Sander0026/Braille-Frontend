import { Component, ChangeDetectionStrategy, inject, signal, OnInit, Input, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SiteConfigService } from '../../../../../core/services/site-config';
import { ToastService } from '../../../../../core/services/toast.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, take } from 'rxjs/operators';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-conteudo-institucional',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuillModule],
  templateUrl: './conteudo-institucional.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConteudoInstitucionalComponent implements OnInit {
  @Input({ required: true }) abaAtiva!: string;

  formHero: FormGroup;
  formMissao: FormGroup;
  
  carregando = signal(true);
  salvando = signal(false);

  private readonly fb = inject(FormBuilder);
  private readonly siteConfig = inject(SiteConfigService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);

  constructor() {
    this.formHero = this.fb.group({
      eyebrow: [''],
      tituloLinha1: ['', Validators.required],
      tituloDestaque: [''],
      descricao: [''],
      btnPrimario: [''],
      btnSecundario: [''],
      stat1Num: [''], stat1Desc: [''],
      stat2Num: [''], stat2Desc: [''],
      stat3Num: [''], stat3Desc: [''],
    });

    this.formMissao = this.fb.group({
      descricaoLinha1: ['', Validators.required],
      descricaoLinha2: [''],
      valor1Titulo: [''],
      valor2Titulo: [''],
      valor3Titulo: [''],
      valor4Titulo: [''],
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
      if (secoes['hero']) this.formHero.patchValue(secoes['hero']);
      if (secoes['missao']) this.formMissao.patchValue(secoes['missao']);
      this.carregando.set(false);
    });
  }

  salvarHero() {
    if (this.formHero.invalid) return;
    this.salvarSecao('hero', this.formHero.value, 'Apresentação salva com sucesso!');
  }

  salvarMissao() {
    if (this.formMissao.invalid) return;
    this.salvarSecao('missao', this.formMissao.value, 'Missão & Valores salvas com sucesso!');
  }

  private salvarSecao(secaoNome: string, valores: any, msgSucesso: string) {
    this.salvando.set(true);
    const array = Object.keys(valores).map(k => ({ chave: k, valor: String(valores[k] || '') }));

    this.siteConfig.salvarSecao(secaoNome, array).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.salvando.set(false);
        this.toast.sucesso(msgSucesso);
        this.siteConfig.carregarSecoes().pipe(take(1)).subscribe();
      },
      error: () => {
        this.salvando.set(false);
        this.toast.erro(`Erro ao salvar ${secaoNome}.`);
      }
    });
  }
}

import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { SiteConfigService } from '../../../../../core/services/site-config';
import { ToastService } from '../../../../../core/services/toast.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, take } from 'rxjs/operators';
import { QuillModule } from 'ngx-quill';
import { A11yModule } from '@angular/cdk/a11y';

@Component({
  selector: 'app-conteudo-sobre',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuillModule, A11yModule],
  templateUrl: './conteudo-sobre.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConteudoSobreComponent implements OnInit {

  formSobreHero: FormGroup;
  formSobreHistoria: FormGroup;
  formSobreTimeline: FormGroup;
  formSobreEquipe: FormGroup;
  formSobreCta: FormGroup;

  carregando = signal(true);
  
  // Controle de loading individual de salvamento
  salvandoHero = signal(false);
  salvandoHistoria = signal(false);
  salvandoTimeline = signal(false);
  salvandoEquipe = signal(false);
  salvandoCta = signal(false);

  itemParaExcluir = signal<{ index: number, tipo: 'timeline' | 'equipe' } | null>(null);
  private lastFocusBeforeModal: HTMLElement | null = null;

  iconesEquipe = [
    { valor: 'person', nome: 'Membro Padrão' },
    { valor: 'groups', nome: 'Equipe / Conselho' },
    { valor: 'psychology', nome: 'Psicologia' },
    { valor: 'local_hospital', nome: 'Saúde' },
    { valor: 'school', nome: 'Educação / Ensino' },
    { valor: 'volunteer_activism', nome: 'Voluntariado / Social' },
    { valor: 'admin_panel_settings', nome: 'Administração' }
  ];

  private readonly fb = inject(FormBuilder);
  private readonly siteConfig = inject(SiteConfigService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);

  constructor() {
    this.formSobreHero = this.fb.group({
      eyebrow: [''],
      titulo: ['', Validators.required],
      descricao: ['']
    });

    this.formSobreHistoria = this.fb.group({
      titulo: ['Nossa História', Validators.required],
      paragrafo1: ['', Validators.required],
      paragrafo2: [''],
      paragrafo3: ['']
    });

    this.formSobreTimeline = this.fb.group({
      lista: this.fb.array([])
    });

    this.formSobreEquipe = this.fb.group({
      lista: this.fb.array([])
    });

    this.formSobreCta = this.fb.group({
      titulo: ['', Validators.required],
      descricao: ['']
    });
  }

  ngOnInit() {
    this.carregarDados();
  }

  get timelineArray() { return this.formSobreTimeline.get('lista') as FormArray; }
  get equipeArray() { return this.formSobreEquipe.get('lista') as FormArray; }

  carregarDados() {
    this.carregando.set(true);
    this.siteConfig.secoes$.pipe(
      filter(s => Object.keys(s).length > 0),
      take(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(secoes => {
      if (secoes['sobre_hero']) this.formSobreHero.patchValue(secoes['sobre_hero']);
      if (secoes['sobre_historia']) this.formSobreHistoria.patchValue(secoes['sobre_historia']);
      if (secoes['sobre_cta']) this.formSobreCta.patchValue(secoes['sobre_cta']);
      
      if (secoes['sobre_timeline']?.['lista']) {
        const lista = JSON.parse(secoes['sobre_timeline']['lista']);
        this.timelineArray.clear();
        lista.forEach((t: any) => this.timelineArray.push(this.criarTimelineForm(t)));
      }
      
      if (secoes['sobre_equipe']?.['lista']) {
        const lista = JSON.parse(secoes['sobre_equipe']['lista']);
        this.equipeArray.clear();
        lista.forEach((eq: any) => this.equipeArray.push(this.criarEquipeForm(eq)));
      }
      
      this.carregando.set(false);
    });
  }

  // Helpers
  private criarTimelineForm(t: any = {}) {
    return this.fb.group({
      ano: [t.ano || '', Validators.required],
      titulo: [t.titulo || '', Validators.required],
      descricao: [t.descricao || '', Validators.required]
    });
  }

  private criarEquipeForm(eq: any = {}) {
    return this.fb.group({
      emoji: [eq.emoji || '', Validators.required],
      cargo: [eq.cargo || '', Validators.required],
      descricao: [eq.descricao || '']
    });
  }

  adicionarItemTimeline() { this.timelineArray.push(this.criarTimelineForm()); }
  adicionarMembroEquipe() { this.equipeArray.push(this.criarEquipeForm()); }

  pedirExclusao(index: number, tipo: 'timeline' | 'equipe') {
    this.lastFocusBeforeModal = document.activeElement as HTMLElement;
    this.itemParaExcluir.set({ index, tipo });
  }

  cancelarExclusao() {
    this.itemParaExcluir.set(null);
    setTimeout(() => this.lastFocusBeforeModal?.focus(), 0);
  }

  confirmarExclusao() {
    const item = this.itemParaExcluir();
    if (!item) return;

    if (item.tipo === 'timeline') this.timelineArray.removeAt(item.index);
    if (item.tipo === 'equipe') this.equipeArray.removeAt(item.index);

    this.cancelarExclusao();
  }

  // Salvamentos
  salvarSobreHero() {
    if (this.formSobreHero.invalid) return;
    this.salvarSecao('sobre_hero', this.formSobreHero.value, 'Apresentação Sobre salva!', this.salvandoHero);
  }

  salvarSobreHistoria() {
    if (this.formSobreHistoria.invalid) return;
    this.salvarSecao('sobre_historia', this.formSobreHistoria.value, 'Nossa História salva!', this.salvandoHistoria);
  }

  salvarSobreTimeline() {
    if (this.formSobreTimeline.invalid) return;
    this.salvarSecao('sobre_timeline', { lista: JSON.stringify(this.formSobreTimeline.value.lista) }, 'Linha do Tempo salva!', this.salvandoTimeline);
  }

  salvarSobreEquipe() {
    if (this.formSobreEquipe.invalid) return;
    this.salvarSecao('sobre_equipe', { lista: JSON.stringify(this.formSobreEquipe.value.lista) }, 'Equipe salva!', this.salvandoEquipe);
  }

  salvarSobreCta() {
    if (this.formSobreCta.invalid) return;
    this.salvarSecao('sobre_cta', this.formSobreCta.value, 'CTA salvo!', this.salvandoCta);
  }

  private salvarSecao(secaoNome: string, valores: any, msgSucesso: string, loadingSignal: any) {
    loadingSignal.set(true);
    const array = Object.keys(valores).map(k => ({ chave: k, valor: String(valores[k] || '') }));

    this.siteConfig.salvarSecao(secaoNome, array).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        loadingSignal.set(false);
        this.toast.sucesso(msgSucesso);
        this.siteConfig.carregarSecoes().pipe(take(1)).subscribe();
      },
      error: () => {
        loadingSignal.set(false);
        this.toast.erro(`Erro ao salvar ${secaoNome}.`);
      }
    });
  }
}

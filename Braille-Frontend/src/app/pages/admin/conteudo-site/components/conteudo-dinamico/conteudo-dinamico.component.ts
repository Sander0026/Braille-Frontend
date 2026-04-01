import { Component, ChangeDetectionStrategy, inject, signal, OnInit, Input, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { SiteConfigService } from '../../../../../core/services/site-config';
import { ToastService } from '../../../../../core/services/toast.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, take } from 'rxjs/operators';
import { QuillModule } from 'ngx-quill';
import { A11yModule } from '@angular/cdk/a11y';

@Component({
  selector: 'app-conteudo-dinamico',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuillModule, A11yModule],
  templateUrl: './conteudo-dinamico.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConteudoDinamicoComponent implements OnInit {
  @Input({ required: true }) abaAtiva!: string;

  formOficinas: FormGroup;
  formDepoimentos: FormGroup;
  formFaq: FormGroup;

  carregando = signal(true);
  salvando = signal(false);

  // Controle de Modal de Exclusão Genérico
  itemParaExcluir = signal<{ index: number, tipo: 'oficina' | 'depoimento' | 'faq' } | null>(null);
  private lastFocusBeforeModal: HTMLElement | null = null;

  iconesDisponiveis = [
    { valor: 'braille', nome: 'Braille' },
    { valor: 'computer', nome: 'Computador / Digitação' },
    { valor: 'music_note', nome: 'Música / Violão' },
    { valor: 'library_books', nome: 'Leitura / Escrita' },
    { valor: 'psychology', nome: 'Psicologia / Terapia' },
    { valor: 'school', nome: 'Oficina Genérica' }
  ];

  private readonly fb = inject(FormBuilder);
  private readonly siteConfig = inject(SiteConfigService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);

  constructor() {
    this.formOficinas = this.fb.group({ lista: this.fb.array([]) });
    this.formDepoimentos = this.fb.group({ lista: this.fb.array([]) });
    this.formFaq = this.fb.group({ lista: this.fb.array([]) });
  }

  ngOnInit() {
    this.carregarDados();
  }

  // --- Form Arrays Getters ---
  get oficinasArray() { return this.formOficinas.get('lista') as FormArray; }
  get depoimentosArray() { return this.formDepoimentos.get('lista') as FormArray; }
  get faqArray() { return this.formFaq.get('lista') as FormArray; }

  // --- Carregamento ---
  carregarDados() {
    this.carregando.set(true);
    this.siteConfig.secoes$.pipe(
      filter(s => Object.keys(s).length > 0),
      take(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(secoes => {
      if (secoes['oficinas']?.['lista']) {
        const lista = JSON.parse(secoes['oficinas']['lista']);
        this.oficinasArray.clear();
        lista.forEach((o: any) => this.oficinasArray.push(this.criarOficinaForm(o)));
      }
      if (secoes['depoimentos']?.['lista']) {
        const lista = JSON.parse(secoes['depoimentos']['lista']);
        this.depoimentosArray.clear();
        lista.forEach((d: any) => this.depoimentosArray.push(this.criarDepoimentoForm(d)));
      }
      if (secoes['faq']?.['lista']) {
        const lista = JSON.parse(secoes['faq']['lista']);
        this.faqArray.clear();
        lista.forEach((f: any) => this.faqArray.push(this.criarFaqForm(f)));
      }
      this.carregando.set(false);
    });
  }

  // --- Helpers de Criação de FormGroups ---
  private criarOficinaForm(o: any = {}) {
    return this.fb.group({
      icon: [o.icon || '', Validators.required],
      titulo: [o.titulo || '', Validators.required],
      descricao: [o.descricao || '', Validators.required]
    });
  }

  private criarDepoimentoForm(d: any = {}) {
    return this.fb.group({
      texto: [d.texto || '', Validators.required],
      nome: [d.nome || '', Validators.required],
      idade: [d.idade || '']
    });
  }

  private criarFaqForm(f: any = {}) {
    return this.fb.group({
      pergunta: [f.pergunta || '', Validators.required],
      resposta: [f.resposta || '', Validators.required]
    });
  }

  // --- Handlers de Adição ---
  adicionarOficina() { this.oficinasArray.push(this.criarOficinaForm()); }
  adicionarDepoimento() { this.depoimentosArray.push(this.criarDepoimentoForm()); }
  adicionarFaq() { this.faqArray.push(this.criarFaqForm()); }

  // --- Handlers de Exclusão UI ---
  pedirExclusao(index: number, tipo: 'oficina' | 'depoimento' | 'faq') {
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

    if (item.tipo === 'oficina') this.oficinasArray.removeAt(item.index);
    if (item.tipo === 'depoimento') this.depoimentosArray.removeAt(item.index);
    if (item.tipo === 'faq') this.faqArray.removeAt(item.index);

    this.cancelarExclusao();
  }

  // --- Salvamento ---
  salvarOficinas() {
    if (this.formOficinas.invalid) return;
    this.salvarSecao('oficinas', { lista: JSON.stringify(this.formOficinas.value.lista) }, 'Oficinas salvas com sucesso!');
  }

  salvarDepoimentos() {
    if (this.formDepoimentos.invalid) return;
    this.salvarSecao('depoimentos', { lista: JSON.stringify(this.formDepoimentos.value.lista) }, 'Depoimentos salvos com sucesso!');
  }

  salvarFaq() {
    if (this.formFaq.invalid) return;
    this.salvarSecao('faq', { lista: JSON.stringify(this.formFaq.value.lista) }, 'Perguntas frequentes salvas com sucesso!');
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

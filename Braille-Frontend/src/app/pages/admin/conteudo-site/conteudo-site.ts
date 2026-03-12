import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormArray, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { SiteConfigService } from '../../../core/services/site-config';
import { environment } from '../../../../environments/environment';
import { ComunicadosLista } from '../comunicados/comunicados-lista/comunicados-lista';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-conteudo-site',
  imports: [CommonModule, ReactiveFormsModule, ComunicadosLista, QuillModule],
  templateUrl: './conteudo-site.html',
  styleUrl: './conteudo-site.scss',
})
export class ConteudoSite implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  abaAtiva = 'config';

  // ── Forms existentes ──────────────────────────────────────
  formConfig!: FormGroup;
  formHero!: FormGroup;
  formMissao!: FormGroup;
  formOficinas!: FormGroup;
  formDepoimentos!: FormGroup;

  // ── Forms da aba Sobre ────────────────────────────────────
  formSobreHero!: FormGroup;
  formSobreHistoria!: FormGroup;
  formSobreTimeline!: FormGroup;
  formSobreEquipe!: FormGroup;
  formSobreCta!: FormGroup;

  // ── Estado ────────────────────────────────────────────────
  carregando = false;
  salvando = false;
  uploadandoLogo = false;
  mensagemSucesso = '';
  mensagemErro = '';

  // Logo
  logoPreview: string | null = null;
  private apiUrl = environment.apiUrl;

  // Modais de Exclusão — existentes
  oficinaParaExcluir: number | null = null;
  depoimentoParaExcluir: number | null = null;
  logoParaExcluir: boolean = false;

  // Modais de Exclusão — Sobre
  timelineItemParaExcluir: number | null = null;
  equipeMemberParaExcluir: number | null = null;

  constructor(
    private fb: FormBuilder,
    private siteConfig: SiteConfigService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.initForms();
    this.carregarDados();

    this.route.queryParams.pipe(take(1)).subscribe(params => {
      if (params['aba']) {
        this.setAba(params['aba']);
      }
    });
  }

  setAba(aba: string) {
    this.abaAtiva = aba;
    this.limparMensagens();
  }

  private limparMensagens() {
    this.mensagemSucesso = '';
    this.mensagemErro = '';
  }

  private initForms() {
    this.formConfig = this.fb.group({
      corPrimaria: ['#f5c800'],
      logoUrl: [''],
    });

    this.formHero = this.fb.group({
      eyebrow: [''],
      tituloLinha1: [''],
      tituloDestaque: [''],
      descricao: [''],
      btnPrimario: [''],
      btnSecundario: [''],
      stat1Num: [''],
      stat1Desc: [''],
      stat2Num: [''],
      stat2Desc: [''],
      stat3Num: [''],
      stat3Desc: [''],
    });

    this.formMissao = this.fb.group({
      titulo: [''],
      descricaoLinha1: [''],
      descricaoLinha2: [''],
      btnSaberMais: [''],
      valor1Icone: [''],
      valor1Titulo: [''],
      valor1Desc: [''],
      valor2Icone: [''],
      valor2Titulo: [''],
      valor2Desc: [''],
      valor3Icone: [''],
      valor3Titulo: [''],
      valor3Desc: [''],
      valor4Icone: [''],
      valor4Titulo: [''],
      valor4Desc: [''],
    });

    this.formOficinas = this.fb.group({ lista: this.fb.array([]) });
    this.formDepoimentos = this.fb.group({ lista: this.fb.array([]) });

    // ── Sobre ─────────────────────────────────────────────────
    this.formSobreHero = this.fb.group({
      eyebrow: [''],
      titulo: [''],
      descricao: [''],
    });

    this.formSobreHistoria = this.fb.group({
      titulo: [''],
      paragrafo1: [''],
      paragrafo2: [''],
      paragrafo3: [''],
    });

    this.formSobreTimeline = this.fb.group({ lista: this.fb.array([]) });
    this.formSobreEquipe = this.fb.group({ lista: this.fb.array([]) });

    this.formSobreCta = this.fb.group({
      titulo: [''],
      descricao: [''],
    });
  }

  // ── Getters FormArray ─────────────────────────────────────
  get oficinasArray(): FormArray { return this.formOficinas.get('lista') as FormArray; }
  get depoimentosArray(): FormArray { return this.formDepoimentos.get('lista') as FormArray; }
  get timelineArray(): FormArray { return this.formSobreTimeline.get('lista') as FormArray; }
  get equipeArray(): FormArray { return this.formSobreEquipe.get('lista') as FormArray; }

  // ── Oficinas ──────────────────────────────────────────────
  adicionarOficina(icon = '', titulo = '', descricao = '') {
    this.oficinasArray.push(this.fb.group({
      icon: [icon, Validators.required],
      titulo: [titulo, Validators.required],
      descricao: [descricao, Validators.required],
    }));
  }

  removerOficina(index: number) { this.oficinaParaExcluir = index; }
  cancelarExclusaoOficina() { this.oficinaParaExcluir = null; }
  confirmarExclusaoOficina() {
    if (this.oficinaParaExcluir !== null) {
      this.oficinasArray.removeAt(this.oficinaParaExcluir);
      this.oficinaParaExcluir = null;
    }
  }

  // ── Depoimentos ───────────────────────────────────────────
  adicionarDepoimento(texto = '', nome = '', idade: number | '' = '') {
    this.depoimentosArray.push(this.fb.group({
      texto: [texto, Validators.required],
      nome: [nome, Validators.required],
      idade: [idade],
    }));
  }

  removerDepoimento(index: number) { this.depoimentoParaExcluir = index; }
  cancelarExclusaoDepoimento() { this.depoimentoParaExcluir = null; }
  confirmarExclusaoDepoimento() {
    if (this.depoimentoParaExcluir !== null) {
      this.depoimentosArray.removeAt(this.depoimentoParaExcluir);
      this.depoimentoParaExcluir = null;
    }
  }

  // ── Timeline (Sobre) ──────────────────────────────────────
  adicionarItemTimeline(ano = '', titulo = '', descricao = '') {
    this.timelineArray.push(this.fb.group({
      ano: [ano, Validators.required],
      titulo: [titulo, Validators.required],
      descricao: [descricao, Validators.required],
    }));
  }

  removerItemTimeline(index: number) { this.timelineItemParaExcluir = index; }
  cancelarExclusaoTimeline() { this.timelineItemParaExcluir = null; }
  confirmarExclusaoTimeline() {
    if (this.timelineItemParaExcluir !== null) {
      this.timelineArray.removeAt(this.timelineItemParaExcluir);
      this.timelineItemParaExcluir = null;
    }
  }

  // ── Equipe (Sobre) ────────────────────────────────────────
  adicionarMembroEquipe(emoji = '', cargo = '', descricao = '') {
    this.equipeArray.push(this.fb.group({
      emoji: [emoji, Validators.required],
      cargo: [cargo, Validators.required],
      descricao: [descricao, Validators.required],
    }));
  }

  removerMembroEquipe(index: number) { this.equipeMemberParaExcluir = index; }
  cancelarExclusaoEquipe() { this.equipeMemberParaExcluir = null; }
  confirmarExclusaoEquipe() {
    if (this.equipeMemberParaExcluir !== null) {
      this.equipeArray.removeAt(this.equipeMemberParaExcluir);
      this.equipeMemberParaExcluir = null;
    }
  }

  // ── Carregamento ──────────────────────────────────────────
  private carregarDados() {
    this.carregando = true;

    this.siteConfig.configs$.pipe(
      filter(c => Object.keys(c).length > 0),
      take(1)
    ).subscribe(configs => {
      const logoUrl = configs['logoUrl'] || '';
      this.formConfig.patchValue({
        corPrimaria: configs['corPrimaria'] || '#f5c800',
        logoUrl,
      });
      if (logoUrl) this.logoPreview = logoUrl;
      this.carregando = false;
    });

    this.siteConfig.secoes$.pipe(
      filter(s => Object.keys(s).length > 0),
      take(1)
    ).subscribe(secoes => {
      // Hero
      const hero = secoes['hero'];
      if (hero && Object.keys(hero).length > 0) this.formHero.patchValue(hero);

      // Missão
      const missao = secoes['missao'];
      if (missao && Object.keys(missao).length > 0) this.formMissao.patchValue(missao);

      // Oficinas
      const oficinas = secoes['oficinas'];
      if (oficinas?.['lista']) {
        try {
          const lista = JSON.parse(oficinas['lista']);
          lista.length > 0
            ? lista.forEach((item: any) => this.adicionarOficina(item.icon, item.titulo, item.descricao))
            : this.adicionarOficina();
        } catch { this.adicionarOficina(); }
      } else { this.adicionarOficina(); }

      // Depoimentos
      const depoimentos = secoes['depoimentos'];
      if (depoimentos?.['lista']) {
        try {
          const lista = JSON.parse(depoimentos['lista']);
          lista.length > 0
            ? lista.forEach((item: any) => this.adicionarDepoimento(item.texto, item.nome, item.idade))
            : this.adicionarDepoimento();
        } catch { this.adicionarDepoimento(); }
      } else { this.adicionarDepoimento(); }

      // Sobre — Hero
      const sobreHero = secoes['sobre_hero'];
      if (sobreHero && Object.keys(sobreHero).length > 0) this.formSobreHero.patchValue(sobreHero);

      // Sobre — História
      const sobreHistoria = secoes['sobre_historia'];
      if (sobreHistoria && Object.keys(sobreHistoria).length > 0) this.formSobreHistoria.patchValue(sobreHistoria);

      // Sobre — Timeline
      const sobreTimeline = secoes['sobre_timeline'];
      if (sobreTimeline?.['lista']) {
        try {
          const lista = JSON.parse(sobreTimeline['lista']);
          lista.length > 0
            ? lista.forEach((item: any) => this.adicionarItemTimeline(item.ano, item.titulo, item.descricao))
            : this.adicionarItemTimeline();
        } catch { this.adicionarItemTimeline(); }
      } else { this.adicionarItemTimeline(); }

      // Sobre — Equipe
      const sobreEquipe = secoes['sobre_equipe'];
      if (sobreEquipe?.['lista']) {
        try {
          const lista = JSON.parse(sobreEquipe['lista']);
          lista.length > 0
            ? lista.forEach((item: any) => this.adicionarMembroEquipe(item.emoji, item.cargo, item.descricao))
            : this.adicionarMembroEquipe();
        } catch { this.adicionarMembroEquipe(); }
      } else { this.adicionarMembroEquipe(); }

      // Sobre — CTA
      const sobreCta = secoes['sobre_cta'];
      if (sobreCta && Object.keys(sobreCta).length > 0) this.formSobreCta.patchValue(sobreCta);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Salvar ────────────────────────────────────────────────
  salvarConfig() {
    this.salvando = true;
    this.limparMensagens();
    const values = this.formConfig.value;
    const array = Object.keys(values).map(k => ({ chave: k, valor: values[k] }));

    this.siteConfig.salvarConfigs(array).subscribe({
      next: () => {
        this.salvando = false;
        this.mensagemSucesso = 'Configurações salvas com sucesso!';
        this.siteConfig.aplicarCorPrimaria(values.corPrimaria);
        this.cdr.detectChanges();
        setTimeout(() => this.siteConfig.carregarConfigs().subscribe(), 0);
      },
      error: () => { this.tratarErro('configurações'); this.cdr.detectChanges(); }
    });
  }

  salvarHero() { this.salvarSecaoValorUnico('hero', this.formHero.value); }
  salvarMissao() { this.salvarSecaoValorUnico('missao', this.formMissao.value); }

  // Sobre
  salvarSobreHero() { this.salvarSecaoValorUnico('sobre_hero', this.formSobreHero.value); }
  salvarSobreHistoria() { this.salvarSecaoValorUnico('sobre_historia', this.formSobreHistoria.value); }
  salvarSobreCta() { this.salvarSecaoValorUnico('sobre_cta', this.formSobreCta.value); }

  salvarSobreTimeline() {
    if (this.formSobreTimeline.invalid) return;
    this.salvando = true;
    this.limparMensagens();
    const lista = this.formSobreTimeline.value.lista;
    this.siteConfig.salvarSecao('sobre_timeline', [{ chave: 'lista', valor: JSON.stringify(lista) }]).subscribe({
      next: () => this.tratarSucesso('sobre_timeline'),
      error: () => this.tratarErro('sobre_timeline'),
    });
  }

  salvarSobreEquipe() {
    if (this.formSobreEquipe.invalid) return;
    this.salvando = true;
    this.limparMensagens();
    const lista = this.formSobreEquipe.value.lista;
    this.siteConfig.salvarSecao('sobre_equipe', [{ chave: 'lista', valor: JSON.stringify(lista) }]).subscribe({
      next: () => this.tratarSucesso('sobre_equipe'),
      error: () => this.tratarErro('sobre_equipe'),
    });
  }

  // ── Upload de Logo ────────────────────────────────────────
  onLogoChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => this.logoPreview = reader.result as string;
    reader.readAsDataURL(file);

    this.uploadandoLogo = true;
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const form = new FormData();
    form.append('file', file);

    this.http.post<{ url: string }>(`${this.apiUrl}/upload`, form, { headers }).subscribe({
      next: (res) => {
        this.formConfig.patchValue({ logoUrl: res.url });
        this.logoPreview = res.url;
        this.uploadandoLogo = false;
        this.mensagemSucesso = 'Logo enviada! Clique em "Salvar Configurações" para aplicar.';
      },
      error: () => {
        this.uploadandoLogo = false;
        this.mensagemErro = 'Erro ao enviar a logo. Tente novamente.';
      }
    });
  }

  removerLogo() { this.logoParaExcluir = true; }
  cancelarExclusaoLogo() { this.logoParaExcluir = false; }
  confirmarExclusaoLogo() {
    this.logoPreview = null;
    this.formConfig.patchValue({ logoUrl: '' });
    this.logoParaExcluir = false;
  }

  salvarOficinas() {
    if (this.formOficinas.invalid) return;
    this.salvando = true;
    this.limparMensagens();
    const lista = this.formOficinas.value.lista;
    this.siteConfig.salvarSecao('oficinas', [{ chave: 'lista', valor: JSON.stringify(lista) }]).subscribe({
      next: () => this.tratarSucesso('oficinas'),
      error: () => this.tratarErro('oficinas'),
    });
  }

  salvarDepoimentos() {
    if (this.formDepoimentos.invalid) return;
    this.salvando = true;
    this.limparMensagens();
    const lista = this.formDepoimentos.value.lista;
    this.siteConfig.salvarSecao('depoimentos', [{ chave: 'lista', valor: JSON.stringify(lista) }]).subscribe({
      next: () => this.tratarSucesso('depoimentos'),
      error: () => this.tratarErro('depoimentos'),
    });
  }

  // ── Helpers privados ──────────────────────────────────────
  private salvarSecaoValorUnico(secao: string, values: any) {
    this.salvando = true;
    this.limparMensagens();
    const array = Object.keys(values)
      .filter(k => values[k] !== null && values[k] !== undefined)
      .map(k => ({ chave: k, valor: String(values[k]) }));

    this.siteConfig.salvarSecao(secao, array).subscribe({
      next: () => this.tratarSucesso(secao),
      error: () => this.tratarErro(secao),
    });
  }

  private getNomeSecao(nome: string): string {
    const mapa: Record<string, string> = {
      'hero': 'Apresentação Principal',
      'sobre_hero': 'Apresentação (Sobre)',
      'sobre_historia': 'Nossa História (Sobre)',
      'sobre_timeline': 'Linha do Tempo (Sobre)',
      'sobre_equipe': 'Equipe (Sobre)',
      'sobre_cta': 'Chamada para Ação (Sobre)',
      'missao': 'Missão & Valores',
      'oficinas': 'Oficinas',
      'depoimentos': 'Depoimentos'
    };
    return mapa[nome] || nome.toUpperCase();
  }

  private tratarSucesso(nome: string) {
    this.salvando = false;
    this.mensagemSucesso = `Seção "${this.getNomeSecao(nome)}" salva com sucesso!`;
    this.cdr.detectChanges();
    setTimeout(() => this.siteConfig.carregarSecoes().subscribe(), 0);
  }

  private tratarErro(nome: string) {
    this.salvando = false;
    this.mensagemErro = `Erro ao salvar a seção "${this.getNomeSecao(nome)}".`;
    this.cdr.detectChanges();
  }
}

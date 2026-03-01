import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormArray, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { SiteConfigService } from '../../../core/services/site-config';
import { environment } from '../../../../environments/environment';
import { ComunicadosLista } from '../comunicados/comunicados-lista/comunicados-lista';

@Component({
  selector: 'app-conteudo-site',
  imports: [CommonModule, ReactiveFormsModule, ComunicadosLista],
  templateUrl: './conteudo-site.html',
  styleUrl: './conteudo-site.scss',
})
export class ConteudoSite implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  abaAtiva = 'config';

  formConfig!: FormGroup;
  formHero!: FormGroup;
  formMissao!: FormGroup;
  formOficinas!: FormGroup;
  formDepoimentos!: FormGroup;

  carregando = false;
  salvando = false;
  uploadandoLogo = false;
  mensagemSucesso = '';
  mensagemErro = '';

  // Logo
  logoPreview: string | null = null;
  private apiUrl = environment.apiUrl;

  // Modais de Exclusão
  oficinaParaExcluir: number | null = null;
  depoimentoParaExcluir: number | null = null;
  logoParaExcluir: boolean = false;

  constructor(
    private fb: FormBuilder,
    private siteConfig: SiteConfigService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.initForms();
    this.carregarDados();
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

    this.formOficinas = this.fb.group({
      lista: this.fb.array([])
    });

    this.formDepoimentos = this.fb.group({
      lista: this.fb.array([])
    });
  }

  get oficinasArray(): FormArray {
    return this.formOficinas.get('lista') as FormArray;
  }

  get depoimentosArray(): FormArray {
    return this.formDepoimentos.get('lista') as FormArray;
  }

  adicionarOficina(icon = '', titulo = '', descricao = '') {
    this.oficinasArray.push(this.fb.group({
      icon: [icon, Validators.required],
      titulo: [titulo, Validators.required],
      descricao: [descricao, Validators.required]
    }));
  }

  removerOficina(index: number) {
    this.oficinaParaExcluir = index;
  }

  confirmarExclusaoOficina() {
    if (this.oficinaParaExcluir !== null) {
      this.oficinasArray.removeAt(this.oficinaParaExcluir);
      this.oficinaParaExcluir = null;
    }
  }

  cancelarExclusaoOficina() {
    this.oficinaParaExcluir = null;
  }

  adicionarDepoimento(texto = '', nome = '', idade: number | '' = '') {
    this.depoimentosArray.push(this.fb.group({
      texto: [texto, Validators.required],
      nome: [nome, Validators.required],
      idade: [idade]
    }));
  }

  removerDepoimento(index: number) {
    this.depoimentoParaExcluir = index;
  }

  confirmarExclusaoDepoimento() {
    if (this.depoimentoParaExcluir !== null) {
      this.depoimentosArray.removeAt(this.depoimentoParaExcluir);
      this.depoimentoParaExcluir = null;
    }
  }

  cancelarExclusaoDepoimento() {
    this.depoimentoParaExcluir = null;
  }

  private carregarDados() {
    this.carregando = true;

    // ── Configs gerais ───────────────────────────────────────
    // Usa o BehaviorSubject do serviço (já populado no boot pelo app.ts).
    // filter garante que ignoramos o estado vazio {} inicial.
    // Resultado: preenchimento instantâneo sem nova chamada HTTP.
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

    // ── Seções ───────────────────────────────────────────────
    // Mesma estratégia: usa o secoesSubject, já populado pelo boot.
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
          if (lista.length > 0) {
            lista.forEach((item: any) => this.adicionarOficina(item.icon, item.titulo, item.descricao));
          } else {
            this.adicionarOficina();
          }
        } catch (e) {
          this.adicionarOficina();
        }
      } else {
        this.adicionarOficina();
      }

      // Depoimentos
      const depoimentos = secoes['depoimentos'];
      if (depoimentos?.['lista']) {
        try {
          const lista = JSON.parse(depoimentos['lista']);
          if (lista.length > 0) {
            lista.forEach((item: any) => this.adicionarDepoimento(item.texto, item.nome, item.idade));
          } else {
            this.adicionarDepoimento();
          }
        } catch (e) {
          this.adicionarDepoimento();
        }
      } else {
        this.adicionarDepoimento();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }


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
        this.cdr.detectChanges(); // withFetch() roda fora do Zone.js — forçar CD
        setTimeout(() => this.siteConfig.carregarConfigs().subscribe(), 0);
      },
      error: () => {
        this.tratarErro('configurações');
        this.cdr.detectChanges();
      }
    });
  }

  salvarHero() { this.salvarSecaoValorUnico('hero', this.formHero.value); }
  salvarMissao() { this.salvarSecaoValorUnico('missao', this.formMissao.value); }

  // ── Upload de logo ────────────────────────────────────────
  onLogoChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    // Preview local imediato
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

  removerLogo() {
    this.logoParaExcluir = true;
  }

  confirmarExclusaoLogo() {
    this.logoPreview = null;
    this.formConfig.patchValue({ logoUrl: '' });
    this.logoParaExcluir = false;
  }

  cancelarExclusaoLogo() {
    this.logoParaExcluir = false;
  }

  private salvarSecaoValorUnico(secao: string, values: any) {
    this.salvando = true;
    this.limparMensagens();
    const array = Object.keys(values)
      .filter(k => values[k] !== null && values[k] !== undefined)
      .map(k => ({ chave: k, valor: String(values[k]) }));

    this.siteConfig.salvarSecao(secao, array).subscribe({
      next: () => this.tratarSucesso(secao),
      error: () => this.tratarErro(secao)
    });
  }

  salvarOficinas() {
    if (this.formOficinas.invalid) return;
    this.salvando = true;
    this.limparMensagens();

    const lista = this.formOficinas.value.lista;
    const array = [{ chave: 'lista', valor: JSON.stringify(lista) }];

    this.siteConfig.salvarSecao('oficinas', array).subscribe({
      next: () => this.tratarSucesso('oficinas'),
      error: () => this.tratarErro('oficinas')
    });
  }

  salvarDepoimentos() {
    if (this.formDepoimentos.invalid) return;
    this.salvando = true;
    this.limparMensagens();

    const lista = this.formDepoimentos.value.lista;
    const array = [{ chave: 'lista', valor: JSON.stringify(lista) }];

    this.siteConfig.salvarSecao('depoimentos', array).subscribe({
      next: () => this.tratarSucesso('depoimentos'),
      error: () => this.tratarErro('depoimentos')
    });
  }

  private tratarSucesso(nome: string) {
    this.salvando = false;
    this.mensagemSucesso = `Aba ${nome.toUpperCase()} salva com sucesso!`;
    this.cdr.detectChanges(); // withFetch() roda fora do Zone.js — forçar CD
    setTimeout(() => this.siteConfig.carregarSecoes().subscribe(), 0);
  }

  private tratarErro(nome: string) {
    this.salvando = false;
    this.mensagemErro = `Erro ao salvar a aba ${nome.toUpperCase()}.`;
    this.cdr.detectChanges();
  }
}

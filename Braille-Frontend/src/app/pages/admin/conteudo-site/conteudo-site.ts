import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormArray, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SiteConfigService } from '../../../core/services/site-config';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-conteudo-site',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './conteudo-site.html',
  styleUrl: './conteudo-site.scss',
})
export class ConteudoSite implements OnInit {
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

  constructor(
    private fb: FormBuilder,
    private siteConfig: SiteConfigService,
    private http: HttpClient
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
    this.oficinasArray.removeAt(index);
  }

  adicionarDepoimento(texto = '', nome = '', idade: number | '' = '') {
    this.depoimentosArray.push(this.fb.group({
      texto: [texto, Validators.required],
      nome: [nome, Validators.required],
      idade: [idade]
    }));
  }

  removerDepoimento(index: number) {
    this.depoimentosArray.removeAt(index);
  }

  private carregarDados() {
    this.carregando = true;

    this.siteConfig.carregarConfigs().subscribe(configs => {
      const logoUrl = configs['logoUrl'] || '';
      this.formConfig.patchValue({
        corPrimaria: configs['corPrimaria'] || '#f5c800',
        logoUrl,
      });
      if (logoUrl) this.logoPreview = logoUrl;
      this.carregando = false;
    });

    this.siteConfig.getSecao('hero').subscribe(dados => {
      if (dados) this.formHero.patchValue(dados);
    });

    this.siteConfig.getSecao('missao').subscribe(dados => {
      if (dados) this.formMissao.patchValue(dados);
    });

    this.siteConfig.getSecao('oficinas').subscribe(dados => {
      if (dados && dados['lista']) {
        try {
          const listaParseada = JSON.parse(dados['lista']);
          listaParseada.forEach((item: any) => this.adicionarOficina(item.icon, item.titulo, item.descricao));
        } catch (e) { }
      } else {
        // Fallback caso vazio (1 item em branco para o usuário preencher)
        this.adicionarOficina();
      }
    });

    this.siteConfig.getSecao('depoimentos').subscribe(dados => {
      if (dados && dados['lista']) {
        try {
          const listaParseada = JSON.parse(dados['lista']);
          listaParseada.forEach((item: any) => this.adicionarDepoimento(item.texto, item.nome, item.idade));
        } catch (e) { }
      } else {
        this.adicionarDepoimento();
      }
    });
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
      },
      error: () => this.tratarErro('configurações')
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
    this.logoPreview = null;
    this.formConfig.patchValue({ logoUrl: '' });
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
  }

  private tratarErro(nome: string) {
    this.salvando = false;
    this.mensagemErro = `Erro ao salvar a aba ${nome.toUpperCase()}.`;
  }
}

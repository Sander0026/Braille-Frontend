import { Component, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
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
export class ConteudoSite implements OnInit, OnDestroy, AfterViewInit {
  private readonly destroy$ = new Subject<void>();
  private observer!: MutationObserver;
  abaAtiva = 'config';

  @ViewChildren('btnAba') botoesAbas!: QueryList<ElementRef<HTMLButtonElement>>;

  // ── Forms existentes ──────────────────────────────────────
  formConfig!: FormGroup;
  formHero!: FormGroup;
  formMissao!: FormGroup;
  formOficinas!: FormGroup;
  formDepoimentos!: FormGroup;
  formFaq!: FormGroup;

  // ── Forms da aba Sobre ────────────────────────────────────
  formSobreHero!: FormGroup;
  formSobreHistoria!: FormGroup;
  formSobreTimeline!: FormGroup;
  formSobreEquipe!: FormGroup;
  formSobreCta!: FormGroup;

  // ── Forms de Contato / Dados Globais ──────────────────────
  formContato!: FormGroup;

  // ── Estado ────────────────────────────────────────────────
  carregando = false;
  salvando = false;
  uploadandoLogo = false;
  uploadandoFachada = false;
  mensagemSucesso = '';
  mensagemErro = '';

  // Logo
  logoPreview: string | null = null;
  // Fachada
  fachadaPreview: string | null = null;
  private readonly apiUrl = environment.apiUrl;

  // Modais de Exclusão — existentes
  oficinaParaExcluir: number | null = null;
  depoimentoParaExcluir: number | null = null;
  faqParaExcluir: number | null = null;
  logoParaExcluir: boolean = false;
  fachadaParaExcluir: boolean = false;

  // Modais de Exclusão — Sobre
  timelineItemParaExcluir: number | null = null;
  equipeMemberParaExcluir: number | null = null;

  // Lista padronizada de ícones corporativos para Oficinas / Seções
  readonly iconesDisponiveis = [
    { valor: 'school', nome: 'Educação / Escola' },
    { valor: 'computer', nome: 'Informática / Tecnologia' },
    { valor: 'music_note', nome: 'Música / Musicoterapia' },
    { valor: 'palette', nome: 'Artes / Artesanato' },
    { valor: 'self_improvement', nome: 'Atividade Física / Saúde' },
    { valor: 'theater_comedy', nome: 'Teatro / Artes Cênicas' },
    { valor: 'menu_book', nome: 'Braille / Leitura' },
    { valor: 'group', nome: 'Convívio Social / Grupo' },
    { valor: 'volunteer_activism', nome: 'Apoio / Cuidado' },
    { valor: 'psychology', nome: 'Apoio Psicológico' },
    { valor: 'restaurant', nome: 'Culinária / AVDs' },
    { valor: 'handshake', nome: 'Parcerias / Trabalho' },
    { valor: 'accessibility_new', nome: 'Acessibilidade' },
    { valor: 'sports_soccer', nome: 'Esportes / Recreação' },
    { valor: 'brush', nome: 'Pintura / Desenho' },
    { valor: 'language', nome: 'Idiomas / Línguas' },
    { valor: 'gavel', nome: 'Direito / Cidadania' },
    { valor: 'work', nome: 'Profissionalização / Emprego' },
    { valor: 'nature_people', nome: 'Meio Ambiente / Natureza' },
    { valor: 'record_voice_over', nome: 'Canto / Coral' },
    { valor: 'family_restroom', nome: 'Apoio à Família' },
    { valor: 'cake', nome: 'Culinária / Confeitaria' },
    { valor: 'emoji_events', nome: 'Conquistas / Prêmios' },
    { valor: 'diversity_3', nome: 'Diversidade / Inclusão' },
    { valor: 'directions_bus', nome: 'Mobilidade / Transporte' },
    { valor: 'medical_services', nome: 'Serviços Médicos / Saúde' },
    { valor: 'smart_toy', nome: 'Robótica / Tecnologias Assistivas' },
    { valor: 'storefront', nome: 'Empreendedorismo / Bazar' },
    { valor: 'hearing_disabled', nome: 'Surdez / Libras' },
    { valor: 'blind', nome: 'Uso de Bengala / O&M' },
    { valor: 'pets', nome: 'Cão-guia' },
    { valor: 'diversity_1', nome: 'Roda de Conversa' },
    { valor: 'local_library', nome: 'Biblioteca / Sala de Estudo' },
    { valor: 'spa', nome: 'Bem-estar / Terapias' },
    { valor: 'directions_run', nome: 'Atletismo / Corrida' },
    { valor: 'pool', nome: 'Natação / Hidroginástica' },
    { valor: 'fitness_center', nome: 'Musculação / Academia' },
    { valor: 'headphones', nome: 'Audiolivros / Podcast' },
    { valor: 'calculate', nome: 'Matemática / Soroban' },
    { valor: 'child_care', nome: 'Estimulação Precoce / Infantil' },
    { valor: 'elderly', nome: 'Atividades para Terceira Idade' },
    { valor: 'construction', nome: 'Trabalhos Manuais / Marcenaria' }
  ];

  // Lista padronizada de ícones para Equipe / Departamentos
  readonly iconesEquipe = [
    { valor: 'groups', nome: 'Diretoria / Gestão' },
    { valor: 'psychology', nome: 'Psicologia' },
    { valor: 'diversity_1', nome: 'Assistência Social' },
    { valor: 'clinical_notes', nome: 'Terapia Ocupacional' },
    { valor: 'menu_book', nome: 'Pedagogia / Educação' },
    { valor: 'hearing', nome: 'Fonoaudiologia' },
    { valor: 'sports_gymnastics', nome: 'Fisioterapia' },
    { valor: 'visibility', nome: 'Oftalmologia / Médicos' },
    { valor: 'record_voice_over', nome: 'Comunicação / RP' },
    { valor: 'manage_accounts', nome: 'Administração / RH' },
    { valor: 'volunteer_activism', nome: 'Coordenação Voluntariado' },
    { valor: 'support_agent', nome: 'Atendimento / Recepção' },
    { valor: 'campaign', nome: 'Marketing / Captação' },
    { valor: 'account_balance', nome: 'Finanças / Contabilidade' },
    { valor: 'engineering', nome: 'Operações / T.I.' },
    { valor: 'security', nome: 'Segurança' },
    { valor: 'cleaning_services', nome: 'Limpeza / Conservação' },
    { valor: 'directions_car', nome: 'Logística / Motorista' },
    { valor: 'medication', nome: 'Enfermagem / Farmácia' },
    { valor: 'food_bank', nome: 'Nutrição / Refeitório' },
    { valor: 'gavel', nome: 'Assessoria Jurídica' },
    { valor: 'inventory', nome: 'Almoxarifado / Suprimentos' },
    { valor: 'event', nome: 'Eventos / Produção' },
    { valor: 'handshake', nome: 'Parcerias Institucionais' },
    { valor: 'print', nome: 'Coord. de Imprensa Braille' },
    { valor: 'blind', nome: 'Instrutor de O&M' },
    { valor: 'fitness_center', nome: 'Esportes / Preparador Físico' },
    { valor: 'public', nome: 'Projetos Especiais' },
    { valor: 'savings', nome: 'Captação de Recursos' },
    { valor: 'local_library', nome: 'Coord. de Biblioteca' },
    { valor: 'contact_phone', nome: 'Telemarketing / Ouvidoria' },
    { valor: 'work', nome: 'Jovem Aprendiz / Estágio' },
    { valor: 'diversity_3', nome: 'Conselho / Comitê Ético' },
    { valor: 'local_shipping', nome: 'Setor de Entregas' },
    { valor: 'cookie', nome: 'Auxiliar de Cozinha' },
    { valor: 'groups_3', nome: 'Equipe Multidisciplinar' },
    { valor: 'health_and_safety', nome: 'Segurança do Trabalho' }
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly siteConfig: SiteConfigService,
    private readonly http: HttpClient,
    private readonly cdr: ChangeDetectorRef,
    private readonly route: ActivatedRoute,
    private readonly el: ElementRef
  ) { }

  ngOnInit() {
    this.initForms();
    this.carregarDados();

    this.route.queryParams.pipe(take(1)).subscribe(params => {
      if (params['aba']) {
        this.setAba(params['aba']);
      }
    });

    // Acessibilidade: Intercepta a renderização assíncrona do QuillJS para injetar ARIA e TITLE nas ferramentas
    this.observer = new MutationObserver(() => this.corrigirAcessibilidadeQuill());
    this.observer.observe(this.el.nativeElement, { childList: true, subtree: true });
  }

  ngAfterViewInit() {
    // Acessibilidade já é configurada, mas no momento nenhuma ação é necessária em AfterViewInit neste escopo
  }

  handleKeydown(event: KeyboardEvent) {
    const tabs = this.botoesAbas.toArray().map(t => t.nativeElement);
    const currentIndex = tabs.indexOf(event.target as HTMLButtonElement);
    
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % tabs.length;
      event.preventDefault();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      event.preventDefault();
    } else if (event.key === 'Home') {
      nextIndex = 0;
      event.preventDefault();
    } else if (event.key === 'End') {
      nextIndex = tabs.length - 1;
      event.preventDefault();
    } else if (event.key === 'Enter' || event.key === ' ') {
      tabs[currentIndex].click();
      event.preventDefault();
      return;
    }

    if (nextIndex !== currentIndex) {
      tabs[nextIndex].focus();
    }
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
      fachadaUrl: [''],
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
      descricaoLinha1: [''],
      descricaoLinha2: [''],
      valor1Titulo: [''],
      valor2Titulo: [''],
      valor3Titulo: [''],
      valor4Titulo: [''],
    });

    this.formOficinas = this.fb.group({ lista: this.fb.array([]) });
    this.formDepoimentos = this.fb.group({ lista: this.fb.array([]) });
    this.formFaq = this.fb.group({ lista: this.fb.array([]) });

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

    this.formContato = this.fb.group({
      telefoneCentral: [''],
      emailOficial: [''],
      enderecoCompleto: [''],
      heroDescricaoContato: [''],
      instagram: [''],
      facebook: [''],
      youtube: [''],
      linkedin: [''],
      footerDireitos: [''],
    });
  }

  // ── Getters FormArray ─────────────────────────────────────
  get oficinasArray(): FormArray { return this.formOficinas.get('lista') as FormArray; }
  get depoimentosArray(): FormArray { return this.formDepoimentos.get('lista') as FormArray; }
  get faqArray(): FormArray { return this.formFaq.get('lista') as FormArray; }
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
      if (this.formOficinas.valid) this.salvarOficinas();
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
      if (this.formDepoimentos.valid) this.salvarDepoimentos();
    }
  }

  // ── FAQ ───────────────────────────────────────────
  adicionarFaq(pergunta = '', resposta = '') {
    this.faqArray.push(this.fb.group({
      pergunta: [pergunta, Validators.required],
      resposta: [resposta, Validators.required],
    }));
  }

  removerFaq(index: number) { this.faqParaExcluir = index; }
  cancelarExclusaoFaq() { this.faqParaExcluir = null; }
  confirmarExclusaoFaq() {
    if (this.faqParaExcluir !== null) {
      this.faqArray.removeAt(this.faqParaExcluir);
      this.faqParaExcluir = null;
      if (this.formFaq.valid) this.salvarFaq();
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
      if (this.formSobreTimeline.valid) this.salvarSobreTimeline();
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
      const fachadaUrl = configs['fachadaUrl'] || '';
      this.formConfig.patchValue({
        corPrimaria: configs['corPrimaria'] || '#f5c800',
        logoUrl,
        fachadaUrl,
      });
      if (logoUrl) this.logoPreview = logoUrl;
      if (fachadaUrl) this.fachadaPreview = fachadaUrl;
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

      // FAQ
      const faq = secoes['faq'];
      if (faq?.['lista']) {
        try {
          const lista = JSON.parse(faq['lista']);
          lista.length > 0
            ? lista.forEach((item: any) => this.adicionarFaq(item.pergunta, item.resposta))
            : this.adicionarFaq();
        } catch { this.adicionarFaq(); }
      } else { this.adicionarFaq(); }

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

      // Contato e Dados Globais
      const contatoConfig = secoes['contato_global'];
      if (contatoConfig && Object.keys(contatoConfig).length > 0) this.formContato.patchValue(contatoConfig);
    });
  }

  ngOnDestroy() {
    if (this.observer) this.observer.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Acessibilidade ────────────────────────────────────────
  private corrigirAcessibilidadeQuill() {
    // Procura todos os seletores dropdown do Quill que não tenham aria-label
    const pickers = document.querySelectorAll('.ql-picker-label:not([aria-label])');
    pickers.forEach((picker) => {
      const parent = picker.parentElement;
      const type = parent?.className.match(/ql-(header|size|font|color|background|align)/)?.[1];
      const labels: Record<string, string> = {
        'header': 'Nível do Título',
        'size': 'Tamanho da fonte',
        'font': 'Família da fonte',
        'color': 'Cor do texto',
        'background': 'Cor de fundo do texto',
        'align': 'Alinhamento do texto'
      };
      const label = type ? labels[type] : 'Opções de formatação do editor';
      picker.setAttribute('aria-label', label);
      picker.setAttribute('title', label);
    });
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

  // Contato / Global
  salvarContato() { this.salvarSecaoValorUnico('contato_global', this.formContato.value); }

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
    const oldUrl = this.formConfig.value.logoUrl || this.logoPreview;
    if (oldUrl && oldUrl.includes('cloudinary')) {
      const token = localStorage.getItem('token') || '';
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      this.http.delete(`${this.apiUrl}/upload`, { headers, params: { url: oldUrl } }).subscribe({
        next: () => console.log('Logo antiga removida do Cloudinary'),
        error: (e) => console.error('Erro ao remover logo do Cloudinary', e)
      });
    }

    this.logoPreview = null;
    this.formConfig.patchValue({ logoUrl: '' });
    this.logoParaExcluir = false;
  }

  // ── Upload de Fachada ─────────────────────────────────────
  onFachadaChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => this.fachadaPreview = reader.result as string;
    reader.readAsDataURL(file);

    this.uploadandoFachada = true;
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const form = new FormData();
    form.append('file', file);

    this.http.post<{ url: string }>(`${this.apiUrl}/upload`, form, { headers }).subscribe({
      next: (res) => {
        this.formConfig.patchValue({ fachadaUrl: res.url });
        this.fachadaPreview = res.url;
        this.uploadandoFachada = false;

        // Auto-salvar imediatamente após o upload para refletir no site público sem etapa manual
        const values = this.formConfig.value;
        const array = Object.keys(values).map(k => ({ chave: k, valor: values[k] ?? '' }));
        this.siteConfig.salvarConfigs(array).subscribe({
          next: () => {
            this.mensagemSucesso = 'Foto da fachada salva e publicada com sucesso!';
            this.siteConfig.aplicarCorPrimaria(values.corPrimaria);
            this.cdr.detectChanges();
            setTimeout(() => this.siteConfig.carregarConfigs().subscribe(), 0);
          },
          error: () => {
            this.mensagemErro = 'Foto enviada, mas falha ao salvar. Clique em "Salvar Configurações" manualmente.';
            this.cdr.detectChanges();
          }
        });
      },
      error: () => {
        this.uploadandoFachada = false;
        this.mensagemErro = 'Erro ao enviar a foto da fachada. Tente novamente.';
      }
    });
  }

  removerFachada() { this.fachadaParaExcluir = true; }
  cancelarExclusaoFachada() { this.fachadaParaExcluir = false; }
  confirmarExclusaoFachada() {
    const oldUrl = this.formConfig.value.fachadaUrl || this.fachadaPreview;
    if (oldUrl && oldUrl.includes('cloudinary')) {
      const token = localStorage.getItem('token') || '';
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      this.http.delete(`${this.apiUrl}/upload`, { headers, params: { url: oldUrl } }).subscribe({
        next: () => console.log('Fachada antiga removida do Cloudinary'),
        error: (e) => console.error('Erro ao remover fachada do Cloudinary', e)
      });
    }

    this.fachadaPreview = null;
    this.formConfig.patchValue({ fachadaUrl: '' });
    this.fachadaParaExcluir = false;

    // Auto-salvar para refletir imediatamente no site público
    const values = this.formConfig.value;
    const array = Object.keys(values).map(k => ({ chave: k, valor: values[k] ?? '' }));
    this.siteConfig.salvarConfigs(array).subscribe({
      next: () => {
        this.mensagemSucesso = '🗑️ Foto da fachada removida e publicada com sucesso!';
        this.cdr.detectChanges();
        setTimeout(() => this.siteConfig.carregarConfigs().subscribe(), 0);
      },
      error: () => {
        this.mensagemErro = 'Foto removida localmente, mas falha ao salvar. Clique em "Salvar Configurações" manualmente.';
        this.cdr.detectChanges();
      }
    });
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

  salvarFaq() {
    if (this.formFaq.invalid) return;
    this.salvando = true;
    this.limparMensagens();
    const lista = this.formFaq.value.lista;
    this.siteConfig.salvarSecao('faq', [{ chave: 'lista', valor: JSON.stringify(lista) }]).subscribe({
      next: () => this.tratarSucesso('faq'),
      error: () => this.tratarErro('faq'),
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
      'depoimentos': 'Depoimentos',
      'faq': 'Perguntas Frequentes (FAQ)',
      'contato_global': 'Contato e Redes Sociais'
    };
    return mapa[nome] || nome.toUpperCase();
  }

  private tratarSucesso(nome: string) {
    setTimeout(() => {
      this.salvando = false;
      this.mensagemSucesso = `Seção "${this.getNomeSecao(nome)}" salva com sucesso!`;
      this.cdr.detectChanges();
      this.siteConfig.carregarSecoes().subscribe();
    }, 10);
  }

  private tratarErro(nome: string) {
    setTimeout(() => {
      this.salvando = false;
      this.mensagemErro = `Erro ao salvar a seção "${this.getNomeSecao(nome)}".`;
      this.cdr.detectChanges();
    }, 10);
  }
}

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Apoiador, ApoiadoresService } from '../apoiadores.service';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-apoiadores-lista',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './apoiadores-lista.html',
  styleUrls: ['./apoiadores-lista.scss']
})
export class ApoiadoresLista implements OnInit, OnDestroy {
  apoiadores: Apoiador[] = [];
  carregando = true;
  totalApoiadores = 0;
  
  // Filtros
  searchControl = new FormControl('');
  tipoControl = new FormControl('');
  private readonly destroy$ = new Subject<void>();

  // Modal de Perfil
  modalAberto = false;
  carregandoDetalhes = false;
  apoiadorVisualizado: Apoiador | null = null;

  // Modal de Formulário (Novo/Editar)
  modalFormAberto = false;
  modoEdicao = false;
  idApoiadorEditando: string | null = null;
  apoiadorForm: FormGroup;
  logoFile: File | null = null;
  logoPreview: string | ArrayBuffer | null = null;
  salvando = false;

  // Form Rápido do Perfil Visualizado
  novaAcaoForm: FormGroup;
  salvandoAcao = false;

  constructor(
    private readonly router: Router,
    private readonly apoiadoresService: ApoiadoresService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.apoiadorForm = this.fb.group({
      tipo: ['EMPRESA', Validators.required],
      nomeRazaoSocial: ['', Validators.required],
      nomeFantasia: [''],
      cpfCnpj: [''],
      contatoPessoa: [''],
      telefone: [''],
      email: ['', [Validators.email, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')]],
      endereco: [''],
      atividadeEspecialidade: [''],
      observacoes: [''],
      exibirNoSite: [false],
      ativo: [true],
      acoes: this.fb.array([])
    });

    this.novaAcaoForm = this.fb.group({
      dataEvento: ['', Validators.required],
      descricaoAcao: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.carregarApoiadores();
    this.configurarFiltros();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private configurarFiltros(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.carregarApoiadores());

    this.tipoControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.carregarApoiadores());
  }

  carregarApoiadores(): void {
    this.carregando = true;
    const search = this.searchControl.value || undefined;
    const tipo = this.tipoControl.value || undefined;

    this.apoiadoresService.listar(0, 50, tipo, search).subscribe({
      next: (res) => {
        this.apoiadores = res.data;
        this.totalApoiadores = res.total;
        this.carregando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao buscar apoiadores', err);
        this.carregando = false;
        this.cdr.detectChanges();
      }
    });
  }

  novoApoiador() {
    this.fecharModal();
    this.fecharModalForm();
    this.modoEdicao = false;
    this.idApoiadorEditando = null;
    this.logoFile = null;
    this.logoPreview = null;
    this.apoiadorForm.reset({
      tipo: 'EMPRESA',
      exibirNoSite: false,
      ativo: true
    });
    this.acoesFormArray.clear();
    this.modalFormAberto = true;
  }

  editarApoiador(id: string) {
    this.fecharModal(); // Fecha view se aberto
    this.modoEdicao = true;
    this.idApoiadorEditando = id;
    this.logoFile = null;
    this.logoPreview = null;
    this.modalFormAberto = true;
    this.apoiadorForm.reset();
    this.acoesFormArray.clear();
    
    this.apoiadoresService.obterPorId(id).subscribe({
      next: (res) => {
        this.apoiadorForm.patchValue({
          tipo: res.tipo,
          nomeRazaoSocial: res.nomeRazaoSocial,
          nomeFantasia: res.nomeFantasia,
          cpfCnpj: res.cpfCnpj,
          contatoPessoa: res.contatoPessoa,
          telefone: res.telefone,
          email: res.email,
          endereco: res.endereco,
          atividadeEspecialidade: res.atividadeEspecialidade,
          observacoes: res.observacoes,
          ativo: res.ativo
        });
        if (res.logoUrl) {
            this.logoPreview = res.logoUrl;
        }

        // Apply Masks
        if (res.cpfCnpj) this.formatarCpfCnpj({ target: { value: res.cpfCnpj } });
        if (res.telefone) this.formatarTelefone({ target: { value: res.telefone } });

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao buscar perfil para edição', err);
        this.cdr.detectChanges();
      }
    });
  }

  // --- MÁSCARAS ---
  formatarCpfCnpj(event: any): void {
    let valor = event.target.value.replace(/\D/g, '');
    if (valor.length <= 11) {
      // CPF
      valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
      valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
      valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      // CNPJ (max 14 digitos numéricos)
      valor = valor.substring(0, 14);
      valor = valor.replace(/^(\d{2})(\d)/, '$1.$2');
      valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
      valor = valor.replace(/\.(\d{3})(\d)/, '.$1/$2');
      valor = valor.replace(/(\d{4})(\d)/, '$1-$2');
    }
    event.target.value = valor;
    this.apoiadorForm.get('cpfCnpj')?.setValue(valor, { emitEvent: false });
  }

  formatarEmail(event: any): void {
    let v = event.target.value.replace(/\s/g, '').toLowerCase();
    event.target.value = v;
    this.apoiadorForm.get('email')?.setValue(v);
  }

  formatarTelefone(event: any): void {
    let valor = event.target.value.replace(/\D/g, '');
    valor = valor.substring(0, 11);
    
    if (valor.length > 10) {
      valor = valor.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
    } else if (valor.length > 6) {
      valor = valor.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    } else if (valor.length > 2) {
      valor = valor.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    } else if (valor.length > 0) {
      valor = valor.replace(/^(\d{0,2})/, '($1');
    }

    event.target.value = valor;
    this.apoiadorForm.get('telefone')?.setValue(valor, { emitEvent: false });
  }

  // --- CONTROLES DE ARRAY DE AÇÕES NO FORMULÁRIO GERAL ---
  get acoesFormArray() {
    return this.apoiadorForm.get('acoes') as FormArray;
  }

  addAcaoField(dataEvento = '', descricaoAcao = '') {
    this.acoesFormArray.push(this.fb.group({
      dataEvento: [dataEvento, Validators.required],
      descricaoAcao: [descricaoAcao, Validators.required]
    }));
  }

  removeAcaoField(index: number) {
    this.acoesFormArray.removeAt(index);
  }

  verPerfil(id: string) {
    this.modalAberto = true;
    this.carregandoDetalhes = true;
    this.apoiadorVisualizado = null;
    
    this.apoiadoresService.obterPorId(id).subscribe({
      next: (res) => {
        this.apoiadorVisualizado = res;
        this.carregandoDetalhes = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao buscar perfil', err);
        this.carregandoDetalhes = false;
        this.cdr.detectChanges();
      }
    });
  }

  fecharModal() {
    this.modalAberto = false;
    this.apoiadorVisualizado = null;
    this.novaAcaoForm.reset();
  }

  // Lógica do Modal de Histórico Pessoal (Rápido)
  adicionarAcaoPerfil(event: Event) {
    event.preventDefault();
    if (this.novaAcaoForm.invalid || !this.apoiadorVisualizado) {
      this.novaAcaoForm.markAllAsTouched();
      return;
    }
    this.salvandoAcao = true;
    const val = this.novaAcaoForm.value;
    
    this.apoiadoresService.adicionarAcao(this.apoiadorVisualizado.id, val.dataEvento, val.descricaoAcao).subscribe({
      next: (novaAcao) => {
        this.salvandoAcao = false;
        // Atualiza a view em tempo real
        if (!this.apoiadorVisualizado!.acoes) {
          this.apoiadorVisualizado!.acoes = [];
        }
        this.apoiadorVisualizado!.acoes.unshift(novaAcao);
        this.novaAcaoForm.reset();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao adicionar ação avulsa', err);
        alert('Falha ao adicionar histórico.');
        this.salvandoAcao = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Lógica do Modal de Formulário
  fecharModalForm() {
    this.modalFormAberto = false;
  }

  onLogoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.logoFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmitForm(): void {
    if (this.apoiadorForm.invalid) {
      this.apoiadorForm.markAllAsTouched();
      return;
    }

    this.salvando = true;
    const formData = this.apoiadorForm.value;
    
    // Preparando o Dto
    const saveDto: Partial<Apoiador> = {
      tipo: formData.tipo,
      nomeRazaoSocial: formData.nomeRazaoSocial,
      nomeFantasia: formData.nomeFantasia || undefined,
      cpfCnpj: formData.cpfCnpj || undefined,
      contatoPessoa: formData.contatoPessoa || undefined,
      telefone: formData.telefone || undefined,
      email: formData.email || undefined,
      endereco: formData.endereco || undefined,
      atividadeEspecialidade: formData.atividadeEspecialidade || undefined,
      observacoes: formData.observacoes || undefined,
      exibirNoSite: formData.exibirNoSite,
      ativo: formData.ativo,
      acoes: (!this.modoEdicao && formData.acoes?.length) ? formData.acoes : undefined
    };

    const req$ = this.modoEdicao && this.idApoiadorEditando
      ? this.apoiadoresService.atualizar(this.idApoiadorEditando, saveDto)
      : this.apoiadoresService.criar(saveDto);

    req$.subscribe({
      next: (res) => {
        const id = this.modoEdicao && this.idApoiadorEditando ? this.idApoiadorEditando : (res as Apoiador).id;
        if (this.logoFile && id) {
          this.apoiadoresService.uploadLogo(id, this.logoFile).subscribe({
            next: () => this.sucessoForm(),
            error: (err) => {
              console.error('Erro no upload', err);
              this.sucessoForm();
            }
          });
        } else {
          this.sucessoForm();
        }
      },
      error: (err) => {
        console.error('Erro ao salvar apoiador', err);
        alert('Erro ao salvar no servidor. Verifique os dados e tente novamente.');
        this.salvando = false;
        this.cdr.detectChanges();
      }
    });
  }

  private sucessoForm(): void {
    this.salvando = false;
    this.cdr.detectChanges();
    this.fecharModalForm();
    this.carregarApoiadores(); // recarrega a lista
  }
}


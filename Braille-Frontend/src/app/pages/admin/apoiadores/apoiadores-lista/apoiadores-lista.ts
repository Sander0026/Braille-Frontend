import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApoiadoresService, Apoiador, AcaoApoiador } from '../apoiadores.service';
import { MasksUtil } from '../../../../shared/utils/masks.util';

// Importa os sub-componentes modulares (Micro-frontends)
import { ApoiadorWizardFormComponent } from '../components/apoiador-wizard-form/apoiador-wizard-form.component';
import { ApoiadorPerfilComponent } from '../components/apoiador-perfil/apoiador-perfil.component';
import { ApoiadorAcoesComponent } from '../components/apoiador-acoes/apoiador-acoes.component';
import { ApoiadorCertificadosComponent } from '../components/apoiador-certificados/apoiador-certificados.component';

@Component({
  selector: 'app-apoiadores-lista',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FormsModule,
    ApoiadorWizardFormComponent,
    ApoiadorPerfilComponent,
    ApoiadorAcoesComponent,
    ApoiadorCertificadosComponent
  ],
  templateUrl: './apoiadores-lista.html',
  styleUrl: './apoiadores-lista.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApoiadoresLista implements OnInit, OnDestroy {
  // Estado da Listagem
  pesquisaTermo = '';
  filtroTipo = 'TODOS';
  apoiadoresOriginais: Apoiador[] = [];
  apoiadoresFiltrados: Apoiador[] = [];
  carregandoLista = true;
  total = 0;

  // Estados dos Modais usando Signals (Melhor Performance que propriedades comuns)
  modalFormAberto = signal<boolean>(false);
  modalPerfilAberto = signal<boolean>(false);
  modalAcoesAberto = signal<boolean>(false);
  modalCertificadosAberto = signal<boolean>(false);

  // Estados de Contexto (O Atual Selecionado)
  apoiadorAtual: Apoiador | null = null;
  modoEdicao = false;
  
  // Dependências de contexto (Modais Filhos)
  acoesFiltradas: AcaoApoiador[] = [];
  certificadosEmitidos: any[] = [];
  carregandoContextoFilho = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly apoiadoresService: ApoiadoresService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarApoiadores();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==========================================
  // LÓGICA DE ROOT: LISTAGEM E FETCHING (SRP)
  // ==========================================

  carregarApoiadores(): void {
    this.carregandoLista = true;
    this.cdr.detectChanges(); // forçar caso assincrono

    this.apoiadoresService.listar()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dados) => {
          this.apoiadoresOriginais = [ ...dados.data ];
          this.aplicarFiltros(); 
          this.carregandoLista = false;
          this.total = dados.total;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erro ao carregar lista principal', err);
          this.carregandoLista = false;
          this.cdr.detectChanges();
        }
      });
  }

  aplicarFiltros(): void {
    let result = this.apoiadoresOriginais;

    if (this.filtroTipo !== 'TODOS') {
      result = result.filter(a => a.tipo === this.filtroTipo);
    }

    if (this.pesquisaTermo && this.pesquisaTermo.trim()) {
      const termo = this.pesquisaTermo.toLowerCase().trim();
      const numApenas = termo.replace(/\D/g, ''); // RegEx isolado só pra fetch

      result = result.filter(a => {
        const nomeRazao = a.nomeRazaoSocial.toLowerCase();
        const fantasia = a.nomeFantasia?.toLowerCase() || '';
        const docLimpo = a.cpfCnpj ? a.cpfCnpj.replace(/\D/g, '') : '';
        const regexDoc = numApenas.length >= 3 && docLimpo.includes(numApenas);

        return nomeRazao.includes(termo) || fantasia.includes(termo) || regexDoc;
      });
    }

    this.apoiadoresFiltrados = result;
    this.cdr.detectChanges();
  }

  get maskUtil() { return MasksUtil; }

  limparFiltros(): void {
    this.pesquisaTermo = '';
    this.filtroTipo = 'TODOS';
    this.aplicarFiltros();
  }

  toggleStatus(apoiador: Apoiador): void {
    if (!apoiador.id) return;
    const novoStatus = !apoiador.ativo;
    
    // Optimistic Update
    const oldStatus = apoiador.ativo;
    apoiador.ativo = novoStatus;
    
    this.apoiadoresService.atualizar(apoiador.id, { ativo: novoStatus })
      .subscribe({
        error: () => {
          // Revert on fail
          apoiador.ativo = oldStatus;
          alert('Erro ao alterar status no servidor.');
          this.cdr.detectChanges();
        }
      });
  }

  // ==========================================
  // ORQUESTRAÇÃO DE MODAIS (STATES)
  // ==========================================

  abrirNovo(): void {
    this.fecharTodosModais();
    this.modoEdicao = false;
    this.apoiadorAtual = null;
    this.modalFormAberto.set(true);
  }

  editarApoiador(id: string): void {
    this.fecharTodosModais(); // Garante sem memory leak de modais abertos no fundo
    this.modoEdicao = true;
    
    // Set a context early for Form Wizard rendering
    this.apoiadorAtual = this.apoiadoresOriginais.find(a => a.id === id) || null;
    this.modalFormAberto.set(true);
  }

  abrirDados(apoiador: Apoiador): void {
    this.fecharTodosModais();
    this.apoiadorAtual = { ...apoiador };
    this.modalPerfilAberto.set(true);
  }

  abrirAcoes(apoiadorId: string): void {
    this.fecharTodosModais();
    this.apoiadorAtual = this.apoiadoresOriginais.find(a => a.id === apoiadorId) || null;
    this.modalAcoesAberto.set(true);
    this.fetchAcoes(apoiadorId);
  }

  abrirCertificados(apoiadorId: string): void {
    this.fecharTodosModais();
    this.apoiadorAtual = this.apoiadoresOriginais.find(a => a.id === apoiadorId) || null;
    this.modalCertificadosAberto.set(true);
    this.fetchCertificados(apoiadorId);
  }

  private fecharTodosModais(): void {
    this.modalFormAberto.set(false);
    this.modalPerfilAberto.set(false);
    this.modalAcoesAberto.set(false);
    this.modalCertificadosAberto.set(false);
  }

  // ==========================================
  // CALLBACKS E ATUALIZAÇÕES DOS FILHOS
  // ==========================================

  onFormSaved(): void {
    this.modalFormAberto.set(false);
    this.carregarApoiadores(); 
  }

  onModalFormClosed(): void {
    this.modalFormAberto.set(false);
  }

  onPerfilClosed(): void {
    this.modalPerfilAberto.set(false);
  }

  onAcoesClosed(): void {
    this.modalAcoesAberto.set(false);
  }

  onCertificadosClosed(): void {
    this.modalCertificadosAberto.set(false);
  }

  // Fetches das tabelas filhas isolados.
  fetchAcoes(id?: string): void {
    const target = id || this.apoiadorAtual?.id;
    if (!target) return;

    this.carregandoContextoFilho = true;
    this.cdr.detectChanges();

    this.apoiadoresService.buscarAcoes(target).subscribe({
      next: (acoes: AcaoApoiador[]) => {
        this.acoesFiltradas = acoes;
        this.carregandoContextoFilho = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.carregandoContextoFilho = false;
        this.cdr.detectChanges();
      }
    });
  }

  fetchCertificados(id?: string): void {
    const target = id || this.apoiadorAtual?.id;
    if (!target) return;

    this.carregandoContextoFilho = true;
    this.cdr.detectChanges();

    this.apoiadoresService.listarCertificados(target).subscribe({
      next: (cert: any[]) => {
        this.certificadosEmitidos = cert;
        this.carregandoContextoFilho = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.carregandoContextoFilho = false;
        this.cdr.detectChanges();
      }
    });
  }
}

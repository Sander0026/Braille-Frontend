import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormControl, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, forkJoin } from 'rxjs';
import { BeneficiariosService, Beneficiario } from '../../../core/services/beneficiarios.service';
import { FrequenciasService } from '../../../core/services/frequencias.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { FormatDatePipe } from '../../../shared/pipes/data-braille.pipe';
import { ImportModalComponent } from '../import-modal/import-modal';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-beneficiary-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormatDatePipe, ImportModalComponent],
  templateUrl: './beneficiary-list.html',
  styleUrl: './beneficiary-list.scss'
})
export class BeneficiaryList implements OnInit, OnDestroy {
  alunos: Beneficiario[] = [];
  isLoading = true;
  erro = '';

  // Modal Ver Aluno
  modalAberto = false;
  carregandoDetalhes = false;
  uploadingImage = false;
  deletandoImage = false;
  alunoSelecionado: Beneficiario | null = null;

  // Modais de Confirmação (Padronizados)
  alunoParaInativar: Beneficiario | null = null;
  alunoParaRestaurar: Beneficiario | null = null;
  alunoParaExcluirDefinitivo: Beneficiario | null = null;
  salvando = false;

  documentoParaExcluir: { tipo: 'fotoPerfil' | 'laudoUrl'; url: string } | null = null;
  frequenciasMap: Map<string, { presentes: number; faltas: number; taxaPresenca: number }> = new Map();

  // Abas
  abaAtiva: 'ativos' | 'inativos' = 'ativos';

  // Paginação
  paginaAtual = 1;
  totalPaginas = 1;
  total = 0;
  readonly limite = 10;

  // Busca
  buscaCtrl = new FormControl('');

  private destroy$ = new Subject<void>();

  // Modal de Edição
  modalEdicaoAberto = false;
  alunoEmEdicao: Beneficiario | null = null;
  salvandoEdicao = false;
  editForm!: FormGroup;

  // Modal de Importação
  modalImportAberto = false;
  isAdmin = false;

  // ── Filtros Avançados (Drawer) ──────────────────────────────────
  drawerAberto = false;
  filterForm!: FormGroup;

  // ── Exportação ──────────────────────────────────────────────────
  exportando = false;

  constructor(
    private beneficiariosService: BeneficiariosService,
    private cdr: ChangeDetectorRef,
    private confirmDialog: ConfirmDialogService,
    private toast: ToastService,
    private fb: FormBuilder,
    private authService: AuthService,
    private frequenciasService: FrequenciasService
  ) {
    this.editForm = this.fb.group({
      nomeCompleto: [''],
      cpfRg: [''],
      dataNascimento: [''],
      genero: [''],
      email: [''],
      telefoneContato: [''],
      // Endereço
      cep: [''],
      rua: [''],
      numero: [''],
      complemento: [''],
      bairro: [''],
      cidade: [''],
      uf: [''],
      // Deficiência
      tipoDeficiencia: [''],
      causaDeficiencia: [''],
      idadeOcorrencia: [''],
      tecAssistivas: [''],
      prefAcessibilidade: [''],
      outrasComorbidades: [''],
      // Socioeconômico
      escolaridade: [''],
      profissao: [''],
      rendaFamiliar: [''],
      beneficiosGov: [''],
      composicaoFamiliar: [''],
      precisaAcompanhante: [false],
      acompOftalmologico: [false],
      contatoEmergencia: [''],
    });
    this.filterForm = this.fb.group({
      tipoDeficiencia: [''],
      causaDeficiencia: [''],
      prefAcessibilidade: [''],
      precisaAcompanhante: [''],
      genero: [''],
      estadoCivil: [''],
      cidade: [''],
      uf: [''],
      escolaridade: [''],
      rendaFamiliar: [''],
      dataCadastroInicio: [''],
      dataCadastroFim: [''],
    });
  }

  ngOnInit(): void {
    this.buscaCtrl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.paginaAtual = 1;
      this.carregar();
    });

    const user = this.authService.getUser();
    this.isAdmin = user?.role === 'ADMIN' || user?.role === 'SECRETARIA';
    this.carregar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Modal de Importação ─────────────────────────────────────────────
  onImportFechou(devRecarregar: boolean): void {
    this.modalImportAberto = false;
    if (devRecarregar) {
      this.paginaAtual = 1;
      this.carregar();
    }
    this.cdr.markForCheck();
  }

  carregar(): void {
    this.isLoading = true;
    const busca = this.buscaCtrl.value?.trim() || undefined;
    const filtros = this.filtrosAtivos();
    this.beneficiariosService.listar(this.paginaAtual, this.limite, busca, this.abaAtiva === 'inativos', filtros).subscribe({

      next: (res) => {
        this.alunos = res.data;
        this.total = res.meta.total;
        this.totalPaginas = res.meta.lastPage;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.erro = 'Erro ao carregar alunos. Tente novamente.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Imprimir Ficha do Aluno ──────────────────────────────────────
  /**
   * Gera um HTML completo da ficha do aluno em uma nova janela
   * e aciona a impressão nativa. Funciona mesmo com o encapsulamento
   * de estilos do Angular.
   */
  imprimirFicha(): void {
    const a = this.alunoSelecionado;
    if (!a) return;

    const fmtData = (v?: string | null) => {
      if (!v) return 'Não informado';
      try { return new Date(v).toLocaleDateString('pt-BR', { timeZone: 'UTC' }); }
      catch { return v; }
    };

    const ni = (v: any) => v || 'Não informado';
    const sim = (v: boolean | undefined) => v ? 'Sim' : 'Não';

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ficha do Aluno – ${a.nomeCompleto}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 10pt; color: #111; background: #fff; padding: 16px; }
    .ficha-header { display: flex; align-items: center; justify-content: space-between;
      border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 12px; }
    .ficha-header h1 { font-size: 13pt; font-weight: bold; }
    .ficha-header .meta { font-size: 8pt; color: #555; text-align: right; }
    .aluno-nome { font-size: 14pt; font-weight: bold; margin-bottom: 4px; }
    .badges { display: flex; gap: 6px; margin-bottom: 12px; }
    .badge { font-size: 8pt; padding: 2px 8px; border-radius: 12px; border: 1px solid #ccc; }
    .badge-ativo { background: #d1fae5; border-color: #059669; color: #065f46; }
    .badge-inativo { background: #fee2e2; border-color: #dc2626; color: #991b1b; }
    .badge-tipo { background: #eff6ff; border-color: #3b82f6; color: #1e40af; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px; }
    .secao { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px 10px; }
    .secao h4 { font-size: 9pt; text-transform: uppercase; letter-spacing: .05em;
      color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 6px; }
    .secao p { font-size: 9pt; margin: 3px 0; color: #444; }
    .secao p strong { color: #111; }
    .full { grid-column: 1 / -1; }
    .rodape { margin-top: 16px; border-top: 1px solid #ccc; padding-top: 6px;
      font-size: 7.5pt; color: #777; text-align: right; }
    @media print {
      body { padding: 0; }
      @page { size: A4; margin: 14mm 14mm 12mm; }
    }
  </style>
</head>
<body>
  <div class="ficha-header">
    <div>
      <h1>Instituto Louis Braille</h1>
      <div style="font-size:9pt;color:#555;">Ficha de Cadastro do Aluno</div>
    </div>
    <div class="meta">
      Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
    </div>
  </div>

  <div class="aluno-nome">${a.nomeCompleto}</div>
  <div class="badges">
    <span class="badge ${a.statusAtivo ? 'badge-ativo' : 'badge-inativo'}">${a.statusAtivo ? 'Ativo' : 'Inativo'}</span>
    ${a.tipoDeficiencia ? `<span class="badge badge-tipo">${a.tipoDeficiencia.replace(/_/g, ' ')}</span>` : ''}
  </div>

  <div class="grid">
    <div class="secao">
      <h4>Informações Pessoais</h4>
      <p><strong>CPF / RG:</strong> ${ni(a.cpfRg)}</p>
      <p><strong>Nascimento:</strong> ${fmtData(a.dataNascimento)}</p>
      <p><strong>Gênero:</strong> ${ni(a.genero)}</p>
      <p><strong>Estado Civil:</strong> ${ni(a.estadoCivil)}</p>
      <p><strong>Telefone:</strong> ${ni(a.telefoneContato)}</p>
      <p><strong>E-mail:</strong> ${ni(a.email)}</p>
      <p><strong>Contato Emergência:</strong> ${ni(a.contatoEmergencia)}</p>
    </div>

    <div class="secao">
      <h4>Perfil Inclusivo</h4>
      <p><strong>Causa:</strong> ${ni(a.causaDeficiencia)}</p>
      <p><strong>Idade na Ocorrência:</strong> ${ni(a.idadeOcorrencia)}</p>
      <p><strong>Acessibilidade Preferida:</strong> ${ni(a.prefAcessibilidade)}</p>
      <p><strong>Tecnologias Assistivas:</strong> ${ni(a.tecAssistivas)}</p>
      <p><strong>Acompanhante:</strong> ${sim(a.precisaAcompanhante)}</p>
      <p><strong>Acomp. Oftalmológico:</strong> ${sim(a.acompOftalmologico)}</p>
      ${a.outrasComorbidades ? `<p><strong>Outras Comorbidades:</strong> ${a.outrasComorbidades}</p>` : ''}
    </div>

    <div class="secao full">
      <h4>Endereço</h4>
      <p>${ni(a.rua)}${a.numero ? ', ' + a.numero : ''}${a.complemento ? ' — ' + a.complemento : ''}</p>
      <p>${ni(a.bairro)} — ${ni(a.cidade)} / ${ni(a.uf)}</p>
      <p><strong>CEP:</strong> ${ni(a.cep)}</p>
    </div>

    <div class="secao">
      <h4>Socioeconômico</h4>
      <p><strong>Escolaridade:</strong> ${ni(a.escolaridade)}</p>
      <p><strong>Profissão:</strong> ${ni(a.profissao)}</p>
      <p><strong>Renda Familiar:</strong> ${ni(a.rendaFamiliar)}</p>
      <p><strong>Benefícios Gov.:</strong> ${ni(a.beneficiosGov)}</p>
      <p><strong>Composição Familiar:</strong> ${ni(a.composicaoFamiliar)}</p>
    </div>

    <div class="secao">
      <h4>Sistema</h4>
      <p><strong>Cadastrado em:</strong> ${fmtData(a.criadoEm)}</p>
      <p><strong>Possui Laudo:</strong> ${a.laudoUrl ? 'Sim (arquivo digital)' : 'Não'}</p>
    </div>
    <div class="secao full">
      <h4>Histórico de Oficinas</h4>
      ${a.matriculasOficina && a.matriculasOficina.length > 0 ? `
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 8.5pt;">
        <thead>
          <tr style="background: #e5e7eb; text-align: left;">
            <th style="padding: 6px; border: 1px solid #d1d5db;">Oficina</th>
            <th style="padding: 6px; border: 1px solid #d1d5db;">Entrada</th>
            <th style="padding: 6px; border: 1px solid #d1d5db;">Saída</th>
            <th style="padding: 6px; border: 1px solid #d1d5db; text-align: center;">Pres.</th>
            <th style="padding: 6px; border: 1px solid #d1d5db; text-align: center;">Faltas</th>
            <th style="padding: 6px; border: 1px solid #d1d5db; text-align: center;">%</th>
            <th style="padding: 6px; border: 1px solid #d1d5db;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${a.matriculasOficina.map(m => {
      const stats = this.frequenciasMap.get(m.turma.id);
      const pres = stats?.presentes?.toString() || '—';
      const falt = stats?.faltas?.toString() || '—';
      const taxa = stats?.taxaPresenca != null ? `${stats.taxaPresenca}%` : '—';
      return `
            <tr>
               <td style="padding: 6px; border: 1px solid #d1d5db;">${m.turma.nome}</td>
               <td style="padding: 6px; border: 1px solid #d1d5db;">${fmtData(m.dataEntrada)}</td>
               <td style="padding: 6px; border: 1px solid #d1d5db;">${fmtData(m.dataEncerramento)}</td>
               <td style="padding: 6px; border: 1px solid #d1d5db; text-align: center;">${pres}</td>
               <td style="padding: 6px; border: 1px solid #d1d5db; text-align: center;">${falt}</td>
               <td style="padding: 6px; border: 1px solid #d1d5db; text-align: center;">${taxa}</td>
               <td style="padding: 6px; border: 1px solid #d1d5db;">${m.status === 'ATIVA' ? 'Em Curso' : m.status}</td>
            </tr>
            `;
    }).join('')}
        </tbody>
      </table>
      ` : '<p style="color: #777; margin-top: 8px;">Nenhuma oficina registrada.</p>'
      }
    </div>
  </div>

  <div class="rodape">Instituto Louis Braille &nbsp;|&nbsp; Documento gerado automaticamente pelo sistema</div>

  <script>
    window.onload = function () {
      window.print();
      window.onafterprint = function () { window.close(); };
    };
  </script>
</body>
</html>`;

    const popup = window.open('', '_blank', 'width=820,height=700,scrollbars=yes');
    if (popup) {
      popup.document.open();
      popup.document.write(html);
      popup.document.close();
    } else {
      alert('O navegador bloqueou a janela de impressão. Permita pop-ups para este site e tente novamente.');
    }
  }

  // ── Filtros Avançados ────────────────────────────────────────────

  /** Extrai do filterForm apenas os valores preenchidos (ignora vazios) */
  filtrosAtivos(): Record<string, any> | undefined {
    const val = this.filterForm.value;
    const filtros: Record<string, any> = {};
    Object.entries(val).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') filtros[k] = v;
    });
    return Object.keys(filtros).length > 0 ? filtros : undefined;
  }

  /** Conta quantos filtros estão ativos (exclui campos vazios) para o badge */
  get quantidadeFiltrosAtivos(): number {
    return Object.values(this.filterForm.value).filter(v => v !== null && v !== undefined && v !== '').length;
  }

  aplicarFiltros(): void {
    this.drawerAberto = false;
    this.paginaAtual = 1;
    this.beneficiariosService.limparCache();
    this.carregar();
    this.cdr.markForCheck();
  }

  limparFiltros(): void {
    this.filterForm.reset();
    this.paginaAtual = 1;
    this.beneficiariosService.limparCache();
    this.carregar();
    this.cdr.markForCheck();
  }

  irParaPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaAtual = pagina;
    this.carregar();
  }

  /** Retorna a janela de páginas visíveis: até 5 ao redor da atual + reticências (-1).
   *  Exemplo com 50 páginas na página 25: [1, -1, 23, 24, 25, 26, 27, -1, 50]
   */
  get paginasVisiveis(): number[] {
    const total = this.totalPaginas;
    const atual = this.paginaAtual;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const janela = 2; // páginas de cada lado da atual
    const inicio = Math.max(2, atual - janela);
    const fim = Math.min(total - 1, atual + janela);

    const paginas: number[] = [1];
    if (inicio > 2) paginas.push(-1); // reticências esquerda
    for (let p = inicio; p <= fim; p++) paginas.push(p);
    if (fim < total - 1) paginas.push(-1); // reticências direita
    paginas.push(total);
    return paginas;
  }

  // ── Modal de Edição ────────────────────────────────────────────
  abrirModalEdicao(aluno: Beneficiario): void {
    this.alunoEmEdicao = aluno;
    this.modalEdicaoAberto = true;
    // Carrega dados completos do aluno para preencher o form
    this.beneficiariosService.buscarPorId(aluno.id).subscribe({
      next: (dadosCompletos) => {
        // Formata a data de nascimento para yyyy-MM-dd (formato do input[type=date])
        const dataNasc = dadosCompletos.dataNascimento
          ? dadosCompletos.dataNascimento.substring(0, 10)
          : '';
        this.editForm.patchValue({ ...dadosCompletos, dataNascimento: dataNasc });
        this.cdr.markForCheck();
      }
    });
  }

  fecharModalEdicao(): void {
    this.modalEdicaoAberto = false;
    this.alunoEmEdicao = null;
    this.editForm.reset();
  }

  salvarEdicao(): void {
    if (!this.alunoEmEdicao || this.salvandoEdicao) return;
    this.salvandoEdicao = true;

    const payload = this.editForm.value;
    this.beneficiariosService.atualizar(this.alunoEmEdicao.id, payload).subscribe({
      next: () => {
        setTimeout(() => {
          this.salvandoEdicao = false;
          this.fecharModalEdicao();
          this.toast.sucesso('Aluno atualizado com sucesso!');
          this.carregar();
        }, 0);
      },
      error: () => {
        setTimeout(() => {
          this.salvandoEdicao = false;
          this.toast.erro('Erro ao atualizar os dados do aluno.');
          this.cdr.markForCheck();
        }, 0);
      }
    });
  }

  // ── Exportar Lista para Excel ─────────────────────────────────────
  exportarListaParaXlsx(): void {
    if (this.exportando) return;
    this.exportando = true;
    this.cdr.markForCheck();

    const busca = this.buscaCtrl.value?.trim() || undefined;
    const filtros = this.filtrosAtivos();

    this.beneficiariosService.exportarLista(busca, this.abaAtiva === 'inativos', filtros)
      .subscribe({
        next: (buffer: ArrayBuffer) => {
          const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          const date = new Date().toISOString().slice(0, 10);
          const status = this.abaAtiva === 'inativos' ? 'Inativos' : 'Ativos';
          a.href = url;
          a.download = `Alunos_${status}_${date}.xlsx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          this.exportando = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.toast.erro('Erro ao exportar a lista. Tente novamente.');
          this.exportando = false;
          this.cdr.markForCheck();
        },
      });
  }

  inativar(aluno: Beneficiario): void {
    this.alunoParaInativar = aluno;
  }

  cancelarInativacao(): void {
    this.alunoParaInativar = null;
  }

  confirmarInativacao(): void {
    if (!this.alunoParaInativar) return;
    this.salvando = true;

    this.beneficiariosService.inativar(this.alunoParaInativar.id).subscribe({
      next: () => {
        setTimeout(() => {
          this.salvando = false;
          this.alunoParaInativar = null;
          this.toast.sucesso('Aluno inativado com sucesso!');
          this.carregar();
        }, 0);
      },
      error: () => {
        setTimeout(() => {
          this.salvando = false;
          this.toast.erro('Erro ao inativar aluno.');
          this.cdr.markForCheck();
        }, 0);
      }
    });
  }

  setAba(aba: 'ativos' | 'inativos'): void {
    if (this.abaAtiva === aba) return;
    this.abaAtiva = aba;
    this.paginaAtual = 1;
    this.carregar();
  }

  // Lógica de Exclusão Definitiva
  excluirDefinitivamente(aluno: Beneficiario): void {
    this.alunoParaExcluirDefinitivo = aluno;
  }

  cancelarExclusaoDefinitiva(): void {
    this.alunoParaExcluirDefinitivo = null;
  }

  confirmarExclusaoDefinitiva(): void {
    if (!this.alunoParaExcluirDefinitivo) return;
    this.salvando = true;

    this.beneficiariosService.excluirDefinitivo(this.alunoParaExcluirDefinitivo.id).subscribe({
      next: () => {
        setTimeout(() => {
          this.salvando = false;
          this.alunoParaExcluirDefinitivo = null;
          this.toast.sucesso('Aluno excluído definitivamente com sucesso!');
          this.carregar();
        }, 0);
      },
      error: () => {
        setTimeout(() => {
          this.salvando = false;
          this.toast.erro('Erro ao excluir aluno definitivamente.');
          this.cdr.detectChanges();
        }, 0);
      }
    });
  }

  // Lógica de Restauração
  restaurarConta(aluno: Beneficiario): void {
    this.alunoParaRestaurar = aluno;
  }

  cancelarRestauracao(): void {
    this.alunoParaRestaurar = null;
  }

  confirmarRestauracao(): void {
    if (!this.alunoParaRestaurar) return;
    this.salvando = true;

    this.beneficiariosService.restaurar(this.alunoParaRestaurar.id).subscribe({
      next: () => {
        setTimeout(() => {
          this.salvando = false;
          this.alunoParaRestaurar = null;
          this.toast.sucesso('Aluno restaurado com sucesso!');
          this.carregar();
        }, 0);
      },
      error: () => {
        setTimeout(() => {
          this.salvando = false;
          this.toast.erro('Erro ao restaurar aluno.');
          this.cdr.detectChanges();
        }, 0);
      }
    });
  }

  // Visualização de Perfil Inteiro
  abrirModal(aluno: Beneficiario): void {
    this.modalAberto = true;
    this.carregandoDetalhes = true;
    this.alunoSelecionado = null;
    this.frequenciasMap.clear();

    this.beneficiariosService.buscarPorId(aluno.id).subscribe({
      next: (dadosCompletos) => {
        this.alunoSelecionado = dadosCompletos;

        // Se o aluno tiver matrículas em oficinas, busca as frequências para cada uma
        const matriculasAtivas = dadosCompletos.matriculasOficina?.filter(m => m.status === 'ATIVA' || m.status === 'CONCLUIDA') || [];

        if (matriculasAtivas.length > 0) {
          const requests = matriculasAtivas.map(m =>
            this.frequenciasService.getRelatorioAluno(m.turma.id, dadosCompletos.id)
          );

          forkJoin(requests).subscribe({
            next: (resultados) => {
              resultados.forEach((res, index) => {
                const turmaId = matriculasAtivas[index].turma.id;
                this.frequenciasMap.set(turmaId, res.estatisticas);
              });
              this.carregandoDetalhes = false;
              this.cdr.markForCheck();
            },
            error: () => {
              // Se falhar a frequência, pelo menos mostra o perfil
              this.carregandoDetalhes = false;
              this.cdr.markForCheck();
            }
          });
        } else {
          this.carregandoDetalhes = false;
          this.cdr.markForCheck();
        }
      },
      error: () => {
        this.carregandoDetalhes = false;
        this.modalAberto = false;
        this.cdr.markForCheck();
      }
    });
  }

  fecharModal(): void {
    this.modalAberto = false;
    this.alunoSelecionado = null;
  }

  getAvatarUrl(aluno: Beneficiario): string {
    if (aluno.fotoPerfil) return aluno.fotoPerfil;
    const genero = aluno.genero ? aluno.genero.toLowerCase() : '';
    if (genero === 'feminino') return 'assets/images/avatar-female.svg';
    if (genero === 'masculino') return 'assets/images/avatar-male.svg';
    return 'assets/images/avatar-neutral.svg';
  }

  // --- Lógica de Upload e Exclusão de Arquivos no Perfil ---
  async processarUploadArquivo(event: any, tipo: 'fotoPerfil' | 'laudoUrl'): Promise<void> {
    const file = event.target.files[0];
    if (!file || !this.alunoSelecionado) return;

    this.uploadingImage = true;
    this.cdr.detectChanges();

    this.beneficiariosService.uploadImagem(file).subscribe({
      next: (res) => {
        const updatePayload: Partial<Beneficiario> = {};
        updatePayload[tipo] = res.url;

        this.beneficiariosService.atualizar(this.alunoSelecionado!.id, updatePayload).subscribe({
          next: (alunoAtualizado) => {
            setTimeout(() => {
              this.alunoSelecionado = alunoAtualizado;
              this.uploadingImage = false;
              this.toast.sucesso('Documento salvo com sucesso!');
              this.carregar();
            }, 0);
          },
          error: () => {
            setTimeout(() => {
              this.uploadingImage = false;
              this.toast.erro('Erro ao vincular documento ao aluno.');
              this.cdr.detectChanges();
            }, 0);
          }
        });
      },
      error: () => {
        this.uploadingImage = false;
        this.toast.erro('Erro ao enviar documento. Tente novamente.');
        this.cdr.detectChanges();
      }
    });
  }

  excluirDocumento(tipo: 'fotoPerfil' | 'laudoUrl'): void {
    if (!this.alunoSelecionado) return;
    const urlAtual = this.alunoSelecionado[tipo];
    if (!urlAtual) return;

    this.documentoParaExcluir = { tipo, url: urlAtual };
  }

  cancelarExclusaoDocumento(): void {
    this.documentoParaExcluir = null;
  }

  confirmarExclusaoDocumento(): void {
    if (!this.alunoSelecionado || !this.documentoParaExcluir) return;

    this.deletandoImage = true;
    this.cdr.detectChanges();

    const { tipo, url } = this.documentoParaExcluir;

    this.beneficiariosService.excluirArquivo(url).subscribe({
      next: () => {
        const updatePayload: Partial<Beneficiario> = {};
        updatePayload[tipo] = '';

        this.beneficiariosService.atualizar(this.alunoSelecionado!.id, updatePayload).subscribe({
          next: () => {
            setTimeout(() => {
              if (this.alunoSelecionado) {
                this.alunoSelecionado[tipo] = '';
              }
              this.deletandoImage = false;
              this.documentoParaExcluir = null;
              this.toast.sucesso('Documento excluído com sucesso!');
              this.carregar();
            }, 0);
          },
          error: () => {
            setTimeout(() => {
              this.deletandoImage = false;
              this.toast.erro('Erro ao desvincular documento do aluno.');
              this.cdr.detectChanges();
            }, 0);
          }
        });
      },
      error: () => {
        this.deletandoImage = false;
        this.toast.erro('Erro ao excluir documento.');
        this.cdr.detectChanges();
      }
    });
  }


}

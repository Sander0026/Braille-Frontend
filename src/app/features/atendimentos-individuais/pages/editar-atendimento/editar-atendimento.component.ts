import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AtendimentosIndividuaisApiService } from '../../services/atendimentos-individuais-api.service';
import { AcompanhamentoIndividual } from '../../models/acompanhamento-individual.model';
import { AtendimentoFormComponent } from '../../components/atendimento-form/atendimento-form.component';
import { UploadArquivosAtendimentoComponent } from '../../components/upload-arquivos-atendimento/upload-arquivos-atendimento.component';
import { AtendimentoIndividual, CriarAtendimentoIndividualPayload } from '../../models/atendimento-individual.model';

import { ToastService } from '../../../../core/services/toast.service';
import { CategoriaArquivoAtendimentoIndividual } from '../../models/arquivo-atendimento.model';
import { AuthService } from '../../../../core/services/auth.service';
import { injectFormDescarte } from '../../../../shared/classes/base-form-descarte';
import { ComponenteComDescarte } from '../../../../core/interfaces/componente-com-descarte.interface';

/**
 * Página de edição de um atendimento individual existente.
 * Reutiliza AtendimentoFormComponent com pré-carregamento dos dados atuais.
 */
@Component({
  selector: 'app-editar-atendimento',
  standalone: true,
  imports: [CommonModule, RouterLink, AtendimentoFormComponent, UploadArquivosAtendimentoComponent],
  templateUrl: './editar-atendimento.component.html',
  styleUrl: './editar-atendimento.component.scss',
})
export class EditarAtendimentoComponent implements OnInit, ComponenteComDescarte {
  private readonly route        = inject(ActivatedRoute);
  private readonly router       = inject(Router);
  private readonly api          = inject(AtendimentosIndividuaisApiService);
  private readonly toast        = inject(ToastService);
  private readonly authService  = inject(AuthService);

  readonly acompanhamento  = signal<AcompanhamentoIndividual | null>(null);
  readonly atendimento     = signal<AtendimentoIndividual | null>(null);
  readonly salvando        = signal(false);
  readonly carregando      = signal(true);
  readonly erro            = signal('');
  readonly formTocado      = signal(false);
  readonly salvoComSucesso = signal(false);

  // ── Guard de descarte ──────────────────────────────────────────────────────
  private readonly verificarDescarte = injectFormDescarte(() => this.isFormDirty());

  podeDescartar(): Promise<boolean> {
    return this.verificarDescarte();
  }

  isFormDirty(): boolean {
    return this.formTocado() && !this.salvoComSucesso();
  }

  ngOnInit(): void {
    const acompanhamentoId = this.route.snapshot.paramMap.get('id');
    const atendimentoId    = this.route.snapshot.paramMap.get('atendimentoId');
    if (!acompanhamentoId || !atendimentoId) return;

    // Carrega o acompanhamento pai e o atendimento a editar em paralelo
    this.api.buscar(acompanhamentoId).subscribe({
      next: item => {
        this.acompanhamento.set(item);
        if (!this.canEdit(item)) {
          this.erro.set('Voce nao tem permissao para editar atendimentos neste acompanhamento.');
          this.carregando.set(false);
        }
      },
      error: () => {
        this.erro.set('Nao foi possivel carregar o acompanhamento.');
        this.carregando.set(false);
      },
    });

    this.api.buscarAtendimento(atendimentoId).subscribe({
      next: item => {
        this.atendimento.set(item);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Nao foi possivel carregar o atendimento.');
        this.carregando.set(false);
      },
    });
  }

  salvar(payload: CriarAtendimentoIndividualPayload): void {
    const atendimento = this.atendimento();
    const acompanhamento = this.acompanhamento();
    if (!atendimento || !acompanhamento || !this.canEdit(acompanhamento)) return;

    this.salvando.set(true);
    this.api.atualizarAtendimento(atendimento.id, payload).subscribe({
      next: atualizado => {
        this.salvando.set(false);
        this.salvoComSucesso.set(true);
        this.atendimento.set(atualizado);
        this.toast.sucesso('Atendimento atualizado com sucesso.');
        this.router.navigate(['/admin/atendimentos-individuais', acompanhamento.id]);
      },
      error: () => {
        this.salvando.set(false);
        this.toast.erro('Nao foi possivel salvar as alteracoes do atendimento.');
      },
    });
  }

  cancelar(): void {
    const item = this.acompanhamento();
    if (item) this.router.navigate(['/admin/atendimentos-individuais', item.id]);
    else this.router.navigate(['/admin/atendimentos-individuais']);
  }

  onFormChange(): void {
    this.formTocado.set(true);
  }

  canEdit(item: AcompanhamentoIndividual): boolean {
    if (item.status !== 'EM_ANDAMENTO') return false;
    const user = this.authService.getUser();
    if (user?.role === 'ADMIN') return true;
    return user?.role === 'PROFESSOR' && item.professorId === user.sub;
  }

  valoresIniciais(): CriarAtendimentoIndividualPayload | null {
    const a = this.atendimento();
    if (!a) return null;
    return {
      dataAtendimento: a.dataAtendimento,
      tipoRegistro:    a.tipoRegistro,
      horaInicio:      a.horaInicio      ?? undefined,
      horaFim:         a.horaFim         ?? undefined,
      duracaoMinutos:  a.duracaoMinutos  ?? undefined,
      modalidade:      a.modalidade      ?? undefined,
      localAtendimento: a.localAtendimento ?? undefined,
      assuntoDoDia:    a.assuntoDoDia    ?? undefined,
      observacao:      a.observacao      ?? undefined,
      evolucao:        a.evolucao        ?? undefined,
      dificuldades:    a.dificuldades    ?? undefined,
      pendencias:      a.pendencias      ?? undefined,
      recomendacoes:   a.recomendacoes   ?? undefined,
    };
  }

  categoriaPadraoAnexo(): CategoriaArquivoAtendimentoIndividual {
    return this.atendimento()?.tipoRegistro === 'FALTA_JUSTIFICADA'
      ? 'ATESTADO'
      : 'OUTRO';
  }


}

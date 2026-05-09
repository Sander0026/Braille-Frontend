import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AtendimentosIndividuaisApiService } from '../../services/atendimentos-individuais-api.service';
import { AcompanhamentoIndividual } from '../../models/acompanhamento-individual.model';
import { AtendimentoFormComponent } from '../../components/atendimento-form/atendimento-form.component';
import { AtendimentoIndividual, CriarAtendimentoIndividualPayload } from '../../models/atendimento-individual.model';
import { UploadArquivosAtendimentoComponent } from '../../components/upload-arquivos-atendimento/upload-arquivos-atendimento.component';
import { ToastService } from '../../../../core/services/toast.service';
import { CategoriaArquivoAtendimentoIndividual } from '../../models/arquivo-atendimento.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-novo-atendimento',
  standalone: true,
  imports: [CommonModule, RouterLink, AtendimentoFormComponent, UploadArquivosAtendimentoComponent],
  templateUrl: './novo-atendimento.component.html',
  styleUrl: './novo-atendimento.component.scss',
})
export class NovoAtendimentoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(AtendimentosIndividuaisApiService);
  private readonly toast = inject(ToastService);
  private readonly authService = inject(AuthService);
  readonly acompanhamento = signal<AcompanhamentoIndividual | null>(null);
  readonly atendimentoCriado = signal<AtendimentoIndividual | null>(null);
  readonly salvando = signal(false);
  readonly carregando = signal(true);
  readonly erro = signal('');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.api.buscar(id).subscribe({
      next: item => {
        this.acompanhamento.set(item);
        this.carregando.set(false);
        if (!this.canCreateAtendimento(item)) {
          this.erro.set('Voce nao tem permissao para registrar atendimento neste acompanhamento.');
        }
      },
      error: () => {
        this.carregando.set(false);
        this.erro.set('Nao foi possivel carregar o acompanhamento.');
      },
    });
  }

  salvar(payload: CriarAtendimentoIndividualPayload): void {
    const item = this.acompanhamento();
    if (!item || !this.canCreateAtendimento(item)) return;
    this.salvando.set(true);
    this.api.criarAtendimento(item.id, payload).subscribe({
      next: atendimento => {
        this.salvando.set(false);
        this.atendimentoCriado.set(atendimento);
        this.toast.sucesso('Atendimento registrado. Voce pode anexar arquivos agora.');
      },
      error: () => {
        this.salvando.set(false);
        this.toast.erro('Nao foi possivel salvar o atendimento.');
      },
    });
  }

  finalizarFluxo(): void {
    const item = this.acompanhamento();
    if (item) this.router.navigate(['/admin/atendimentos-individuais', item.id]);
  }

  categoriaPadraoAnexo(): CategoriaArquivoAtendimentoIndividual {
    return this.atendimentoCriado()?.tipoRegistro === 'FALTA_JUSTIFICADA'
      ? 'ATESTADO'
      : 'OUTRO';
  }

  cancelar(): void {
    const item = this.acompanhamento();
    if (item) this.router.navigate(['/admin/atendimentos-individuais', item.id]);
  }

  canCreateAtendimento(item: AcompanhamentoIndividual): boolean {
    if (item.status !== 'EM_ANDAMENTO') return false;
    const user = this.authService.getUser();
    if (user?.role === 'ADMIN') return true;
    return user?.role === 'PROFESSOR' && item.professorId === user.sub;
  }
}

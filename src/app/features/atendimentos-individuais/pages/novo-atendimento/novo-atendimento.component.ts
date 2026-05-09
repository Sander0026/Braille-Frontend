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
  readonly acompanhamento = signal<AcompanhamentoIndividual | null>(null);
  readonly atendimentoCriado = signal<AtendimentoIndividual | null>(null);
  readonly salvando = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.api.buscar(id).subscribe({ next: item => this.acompanhamento.set(item) });
  }

  salvar(payload: CriarAtendimentoIndividualPayload): void {
    const item = this.acompanhamento();
    if (!item) return;
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
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AtendimentosIndividuaisApiService } from '../../services/atendimentos-individuais-api.service';
import { AcompanhamentoIndividual } from '../../models/acompanhamento-individual.model';
import { AtendimentoFormComponent } from '../../components/atendimento-form/atendimento-form.component';
import { CriarAtendimentoIndividualPayload } from '../../models/atendimento-individual.model';

@Component({
  selector: 'app-novo-atendimento',
  standalone: true,
  imports: [CommonModule, RouterLink, AtendimentoFormComponent],
  templateUrl: './novo-atendimento.component.html',
  styleUrl: './novo-atendimento.component.scss',
})
export class NovoAtendimentoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(AtendimentosIndividuaisApiService);
  readonly acompanhamento = signal<AcompanhamentoIndividual | null>(null);
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
      next: () => {
        this.salvando.set(false);
        this.router.navigate(['/admin/atendimentos-individuais', item.id]);
      },
      error: () => this.salvando.set(false),
    });
  }

  cancelar(): void {
    const item = this.acompanhamento();
    if (item) this.router.navigate(['/admin/atendimentos-individuais', item.id]);
  }
}

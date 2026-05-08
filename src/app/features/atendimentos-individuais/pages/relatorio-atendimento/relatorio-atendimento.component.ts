import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RelatorioAtendimentoApiService } from '../../services/relatorio-atendimento-api.service';
import { RelatorioAtendimentoIndividual } from '../../models/relatorio-atendimento.model';
import { ResumoAtendimentosComponent } from '../../components/resumo-atendimentos/resumo-atendimentos.component';

@Component({
  selector: 'app-relatorio-atendimento',
  standalone: true,
  imports: [CommonModule, FormsModule, ResumoAtendimentosComponent],
  templateUrl: './relatorio-atendimento.component.html',
  styleUrl: './relatorio-atendimento.component.scss',
})
export class RelatorioAtendimentoComponent {
  private readonly api = inject(RelatorioAtendimentoApiService);
  readonly relatorio = signal<RelatorioAtendimentoIndividual | null>(null);
  carregando = false;
  filtros = {
    alunoId: '',
    professorId: '',
    dataInicio: '',
    dataFim: '',
    status: '',
    tipoRegistro: '',
  };

  gerar(): void {
    this.carregando = true;
    this.api.gerar({
      alunoId: this.filtros.alunoId || undefined,
      professorId: this.filtros.professorId || undefined,
      dataInicio: this.filtros.dataInicio || undefined,
      dataFim: this.filtros.dataFim || undefined,
      status: this.filtros.status as any || undefined,
      tipoRegistro: this.filtros.tipoRegistro as any || undefined,
    }).subscribe({
      next: res => { this.relatorio.set(res); this.carregando = false; },
      error: () => this.carregando = false,
    });
  }

  imprimir(): void {
    window.print();
  }
}

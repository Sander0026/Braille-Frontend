import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Turma, TurmaStatus } from '../../../../../core/services/turmas.service';

@Component({
  selector: 'app-turma-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './turma-card.component.html',
  styleUrl: '../turmas-lista.scss'
})
export class TurmaCardComponent {
  @Input({ required: true }) turma!: Turma;
  @Input() isProfessor = false;

  @Output() abrirModalAlunos = new EventEmitter<Turma>();
  @Output() atualizarStatusRapido = new EventEmitter<{turma: Turma, status: TurmaStatus}>();
  @Output() abrirModalEditar = new EventEmitter<Turma>();
  @Output() alternarArquivamento = new EventEmitter<{id: string, arquivada: boolean, event: Event}>();
  @Output() removerDaLista = new EventEmitter<{id: string, event: Event}>();

  onStatusChange(novoStatus: string) {
    this.atualizarStatusRapido.emit({ turma: this.turma, status: novoStatus as TurmaStatus });
  }

  totalAlunosMatriculados(): number {
    return this.turma._count?.matriculasOficina ?? this.turma.matriculasOficina?.length ?? 0;
  }

  capacidadeTotal(): number | null {
    return this.turma.capacidadeMaxima ?? null;
  }

  formatarGradeHoraria(grade: Turma['gradeHoraria']): string {
    if (!grade || grade.length === 0) return 'Horário a definir';
    return grade.map(g => {
      const hInit = this.minutosParaHm(g.horaInicio);
      const hEnd = this.minutosParaHm(g.horaFim);
      return `${g.dia} ${hInit}-${hEnd}`;
    }).join(', ');
  }

  minutosParaHm(min: number): string {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
}

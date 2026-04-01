import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-turma-filtro-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './turma-filtro-drawer.component.html',
  styleUrl: '../../turmas-lista/turmas-lista.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TurmaFiltroDrawerComponent implements OnInit {
  @Input() aberto = false;
  @Input() professores: { id: string; nome: string }[] = [];
  
  // O Form reactivo é mantido internamente e envia apenas o payload
  @Output() aplicar = new EventEmitter<{ professorId: string; status: string }>();
  @Output() limpar = new EventEmitter<void>();
  @Output() aoFechar = new EventEmitter<void>();

  filterForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      professorId: [''],
      status: [''],
    });
  }

  limparFiltros() {
    this.filterForm.reset({ professorId: '', status: '' });
    this.limpar.emit();
  }

  aplicarFiltros() {
    this.aplicar.emit(this.filterForm.value);
  }

  fecharDrawer() {
    this.aoFechar.emit();
  }
}

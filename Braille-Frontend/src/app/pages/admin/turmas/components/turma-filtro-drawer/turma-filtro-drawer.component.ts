import {
  Component, ChangeDetectionStrategy,
  Input, Output, EventEmitter,
  OnInit, OnChanges, SimpleChanges,
} from '@angular/core';
import { CommonModule }                  from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { A11yModule, LiveAnnouncer }     from '@angular/cdk/a11y';

@Component({
  selector: 'app-turma-filtro-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, A11yModule],
  templateUrl: './turma-filtro-drawer.component.html',
  styleUrl: '../../turmas-lista/turmas-lista.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurmaFiltroDrawerComponent implements OnInit, OnChanges {
  @Input() aberto = false;
  @Input() professores: { id: string; nome: string }[] = [];

  @Output() aplicar  = new EventEmitter<{ professorId: string; status: string }>();
  @Output() limpar   = new EventEmitter<void>();
  @Output() aoFechar = new EventEmitter<void>();

  filterForm!: FormGroup;

  /** Elemento que abriu o drawer — foco é restaurado ao fechar (WCAG 2.4.3) */
  private lastFocusBeforeDrawer: HTMLElement | null = null;

  constructor(
    private fb: FormBuilder,
    /** Anuncia ações de filtro para screen readers (WCAG 4.1.3) */
    private liveAnnouncer: LiveAnnouncer,
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      professorId: [''],
      status:      [''],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['aberto']) {
      if (this.aberto) {
        // WCAG 2.4.3: captura elemento focado antes de abrir o drawer
        this.lastFocusBeforeDrawer = document.activeElement as HTMLElement;
      }
    }
  }

  limparFiltros(): void {
    this.filterForm.reset({ professorId: '', status: '' });
    this.limpar.emit();
    // WCAG 4.1.3: anuncia resultado ao screen reader
    this.liveAnnouncer.announce('Filtros limpos.');
  }

  aplicarFiltros(): void {
    this.aplicar.emit(this.filterForm.value);
    // WCAG 4.1.3: anuncia que os filtros foram aplicados
    const status = this.filterForm.value.status || 'todos';
    this.liveAnnouncer.announce(`Filtros aplicados: fase "${status}".`);
    this.fecharDrawer();
  }

  fecharDrawer(): void {
    this.aoFechar.emit();
    // WCAG 2.4.3: retorna foco ao elemento que abriu o drawer
    setTimeout(() => this.lastFocusBeforeDrawer?.focus(), 0);
  }
}

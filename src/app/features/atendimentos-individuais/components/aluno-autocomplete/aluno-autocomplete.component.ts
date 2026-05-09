import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BeneficiarioResumo } from '../../../../core/services/beneficiarios.service';

@Component({
  selector: 'app-aluno-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <label class="field">
      <span>{{ label }}</span>
      <input
        type="search"
        [(ngModel)]="termo"
        (ngModelChange)="onSearchChange($event)"
        (keydown)="onKeydown($event)"
        placeholder="Busque por nome, CPF ou matricula"
        role="combobox"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-controls]="listboxId"
        [attr.aria-activedescendant]="activeOptionId()"
        aria-autocomplete="list"
        aria-describedby="aluno-autocomplete-status"
        autocomplete="off" />
    </label>

    <p id="aluno-autocomplete-status" class="sr-only" aria-live="polite">{{ statusMessage() }}</p>

    @if (selecionado()) {
      <div class="selected">
        <div>
          <strong>{{ selecionado()?.nomeCompleto }}</strong>
          <span>{{ descricaoAluno(selecionado()) }}</span>
        </div>
        <button type="button" (click)="limpar()">Trocar aluno</button>
      </div>
    } @else if (isListVisible()) {
      @if (loading) {
        <div class="results status" role="status">Buscando alunos...</div>
      } @else {
        <ul class="results" [id]="listboxId" role="listbox" aria-label="Resultados de alunos">
          @for (aluno of resultados(); track aluno.id; let i = $index) {
            <li role="option" [id]="optionId(i)" [attr.aria-selected]="activeIndex() === i">
              <button type="button" (mouseenter)="activeIndex.set(i)" (click)="selecionar(aluno)">
                <strong>{{ aluno.nomeCompleto }}</strong>
                <span>{{ descricaoAluno(aluno) }}</span>
              </button>
            </li>
          }
        </ul>
      }
    }
  `,
  styles: [`
    .field { display:grid; gap:.35rem; font-weight:800; color:#4b5563; }
    input { min-height:2.75rem; border:1px solid #cbd5e1; border-radius:8px; padding:.65rem .8rem; font:inherit; }
    .results { margin:.5rem 0 0; padding:0; list-style:none; border:1px solid #cbd5e1; border-radius:8px; overflow:hidden; background:#fff; }
    .status { padding:.8rem; color:#475569; font-weight:800; }
    .results button { width:100%; display:flex; justify-content:space-between; gap:1rem; border:0; background:#fff; padding:.8rem; text-align:left; cursor:pointer; }
    .results [aria-selected="true"] button { background:#f8fafc; outline:2px solid #f2c300; outline-offset:-2px; }
    .results button:hover, .results button:focus { background:#f8fafc; outline:2px solid #f2c300; outline-offset:-2px; }
    .selected { display:flex; align-items:center; justify-content:space-between; gap:.75rem; margin-top:.5rem; padding:.75rem; border-radius:8px; background:#f8fafc; }
    .selected div { display:grid; gap:.2rem; }
    .selected span, .results span { color:#64748b; font-size:.9rem; }
    .selected button { border:1px solid #cbd5e1; border-radius:8px; background:#fff; padding:.45rem .7rem; font-weight:800; cursor:pointer; }
    .sr-only { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0); }
  `],
})
export class AlunoAutocompleteComponent {
  @Input() alunos: BeneficiarioResumo[] = [];
  @Input() label = 'Aluno cadastrado';
  @Input() loading = false;
  @Output() selected = new EventEmitter<BeneficiarioResumo | null>();
  @Output() search = new EventEmitter<string>();

  termo = '';
  readonly listboxId = `aluno-autocomplete-${Math.random().toString(36).slice(2)}-listbox`;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  readonly selecionado = signal<BeneficiarioResumo | null>(null);
  readonly activeIndex = signal(-1);
  readonly isManuallyClosed = signal(false);

  readonly resultados = computed(() => {
    if (this.termo.trim().length < 3) return [];
    return this.alunos.slice(0, 10);
  });

  isOpen(): boolean {
    return this.isListVisible() && this.resultados().length > 0;
  }

  isListVisible(): boolean {
    return !this.selecionado() && !this.isManuallyClosed() && this.termo.trim().length >= 3;
  }

  activeOptionId(): string | null {
    return this.activeIndex() >= 0 ? this.optionId(this.activeIndex()) : null;
  }

  optionId(index: number): string {
    return `${this.listboxId}-option-${index}`;
  }

  statusMessage(): string {
    if (this.selecionado()) return `Aluno selecionado: ${this.selecionado()?.nomeCompleto}.`;
    if (this.termo.trim().length < 3) return 'Digite ao menos 3 caracteres para buscar aluno.';
    if (this.loading) return 'Buscando alunos...';
    const total = this.resultados().length;
    return total ? `${total} alunos encontrados. Use as setas para navegar, Enter para selecionar e Escape para fechar.` : 'Nenhum aluno encontrado.';
  }

  onSearchChange(value: string): void {
    this.termo = value;
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.activeIndex.set(-1);
    this.isManuallyClosed.set(false);
    const q = value.trim();
    if (q.length < 3 || this.selecionado()) return;

    this.searchTimer = setTimeout(() => this.search.emit(q), 300);
  }

  onKeydown(event: KeyboardEvent): void {
    const resultados = this.resultados();
    if (!resultados.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex.set((this.activeIndex() + 1) % resultados.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex.set(this.activeIndex() <= 0 ? resultados.length - 1 : this.activeIndex() - 1);
      return;
    }

    if (event.key === 'Enter' && this.activeIndex() >= 0) {
      event.preventDefault();
      this.selecionar(resultados[this.activeIndex()]);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.activeIndex.set(-1);
      this.isManuallyClosed.set(true);
    }
  }

  selecionar(aluno: BeneficiarioResumo): void {
    this.selecionado.set(aluno);
    this.activeIndex.set(-1);
    this.isManuallyClosed.set(true);
    this.termo = aluno.nomeCompleto;
    this.selected.emit(aluno);
  }

  limpar(): void {
    this.selecionado.set(null);
    this.activeIndex.set(-1);
    this.isManuallyClosed.set(false);
    this.termo = '';
    this.selected.emit(null);
  }

  descricaoAluno(aluno: BeneficiarioResumo | null): string {
    if (!aluno) return 'Sem matricula';
    const partes = [
      aluno.matricula ? `Matricula: ${aluno.matricula}` : null,
      aluno.cpfMascarado ? `CPF: ${aluno.cpfMascarado}` : null,
    ].filter(Boolean);

    return partes.length ? partes.join(' - ') : 'Sem matricula';
  }
}

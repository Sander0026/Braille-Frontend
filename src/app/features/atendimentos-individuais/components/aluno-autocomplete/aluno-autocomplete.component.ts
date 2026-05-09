import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Beneficiario } from '../../../../core/services/beneficiarios.service';

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
        placeholder="Busque por nome, CPF ou matricula"
        aria-describedby="aluno-autocomplete-status"
        autocomplete="off" />
    </label>

    <p id="aluno-autocomplete-status" class="sr-only" aria-live="polite">{{ statusMessage() }}</p>

    @if (selecionado()) {
      <div class="selected">
        <strong>{{ selecionado()?.nomeCompleto }}</strong>
        <span>{{ selecionado()?.matricula || 'Sem matricula' }}</span>
        <button type="button" (click)="limpar()">Trocar aluno</button>
      </div>
    } @else if (termo.trim().length >= 3) {
      <ul class="results">
        @for (aluno of resultados(); track aluno.id) {
          <li>
            <button type="button" (click)="selecionar(aluno)">
              <strong>{{ aluno.nomeCompleto }}</strong>
              <span>{{ aluno.matricula || 'sem matricula' }}</span>
            </button>
          </li>
        }
      </ul>
    }
  `,
  styles: [`
    .field { display:grid; gap:.35rem; font-weight:800; color:#4b5563; }
    input { min-height:2.75rem; border:1px solid #cbd5e1; border-radius:8px; padding:.65rem .8rem; font:inherit; }
    .results { margin:.5rem 0 0; padding:0; list-style:none; border:1px solid #cbd5e1; border-radius:8px; overflow:hidden; background:#fff; }
    .results button { width:100%; display:flex; justify-content:space-between; gap:1rem; border:0; background:#fff; padding:.8rem; text-align:left; cursor:pointer; }
    .results button:hover, .results button:focus { background:#f8fafc; outline:2px solid #f2c300; outline-offset:-2px; }
    .selected { display:flex; align-items:center; justify-content:space-between; gap:.75rem; margin-top:.5rem; padding:.75rem; border-radius:8px; background:#f8fafc; }
    .selected button { border:1px solid #cbd5e1; border-radius:8px; background:#fff; padding:.45rem .7rem; font-weight:800; cursor:pointer; }
    .sr-only { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0); }
  `],
})
export class AlunoAutocompleteComponent {
  @Input() alunos: Beneficiario[] = [];
  @Input() label = 'Aluno cadastrado';
  @Output() selected = new EventEmitter<Beneficiario | null>();
  @Output() search = new EventEmitter<string>();

  termo = '';
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  readonly selecionado = signal<Beneficiario | null>(null);

  readonly resultados = computed(() => {
    const q = this.termo.trim().toLowerCase();
    if (q.length < 3) return [];
    return this.alunos.filter((aluno) => {
      const texto = `${aluno.nomeCompleto} ${aluno.matricula ?? ''} ${aluno.cpf ?? ''}`.toLowerCase();
      return texto.includes(q);
    }).slice(0, 10);
  });

  statusMessage(): string {
    if (this.selecionado()) return `Aluno selecionado: ${this.selecionado()?.nomeCompleto}.`;
    if (this.termo.trim().length < 3) return 'Digite ao menos 3 caracteres para buscar aluno.';
    const total = this.resultados().length;
    return total ? `${total} alunos encontrados. Use Tab para navegar e Enter para selecionar.` : 'Nenhum aluno encontrado.';
  }

  onSearchChange(value: string): void {
    this.termo = value;
    if (this.searchTimer) clearTimeout(this.searchTimer);
    const q = value.trim();
    if (q.length < 3 || this.selecionado()) return;

    this.searchTimer = setTimeout(() => this.search.emit(q), 300);
  }

  selecionar(aluno: Beneficiario): void {
    this.selecionado.set(aluno);
    this.termo = aluno.nomeCompleto;
    this.selected.emit(aluno);
  }

  limpar(): void {
    this.selecionado.set(null);
    this.termo = '';
    this.selected.emit(null);
  }
}

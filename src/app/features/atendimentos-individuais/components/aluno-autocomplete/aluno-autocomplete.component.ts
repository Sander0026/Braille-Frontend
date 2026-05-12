import {
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BeneficiarioResumo } from '../../../../core/services/beneficiarios.service';

@Component({
  selector: 'app-aluno-autocomplete',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aluno-autocomplete.component.html',
  styleUrl: './aluno-autocomplete.component.scss',
})
export class AlunoAutocompleteComponent {
  // ── Inputs como Signals (Angular 17+) ──────────────────────────────────────
  // CORREÇÃO DO BUG: @Input() simples não é rastreável pelo computed().
  // input() Signal garante que computed() reaja quando o pai atualiza a lista.
  readonly alunos   = input<BeneficiarioResumo[]>([]);
  readonly label    = input('Aluno cadastrado');
  readonly loading  = input(false);

  // ── Outputs como Signals ───────────────────────────────────────────────────
  readonly selected = output<BeneficiarioResumo | null>();
  readonly search   = output<string>();

  // ── IDs únicos para acessibilidade ARIA ───────────────────────────────────
  private readonly uid = Math.random().toString(36).slice(2);
  readonly inputId   = `aluno-ac-input-${this.uid}`;
  readonly listboxId = `aluno-ac-listbox-${this.uid}`;

  // ── Estado interno ─────────────────────────────────────────────────────────
  termo = '';
  readonly selecionado  = signal<BeneficiarioResumo | null>(null);
  readonly activeIndex  = signal(-1);
  readonly isManuallyClosed = signal(false);

  // ── Computed: reativo porque agora depende do input Signal ─────────────────
  readonly resultados = computed(() => {
    if (this.termo.trim().length < 3) return [];
    return this.alunos().slice(0, 10);  // alunos() → Signal → computed() reage ✅
  });

  // ── Estado da lista visível ────────────────────────────────────────────────
  isOpen(): boolean {
    return this.isListVisible() && this.resultados().length > 0;
  }

  isListVisible(): boolean {
    return (
      !this.selecionado() &&
      !this.isManuallyClosed() &&
      this.termo.trim().length >= 3
    );
  }

  // ── IDs de opções para ARIA ────────────────────────────────────────────────
  activeOptionId(): string | null {
    return this.activeIndex() >= 0 ? this.optionId(this.activeIndex()) : null;
  }

  optionId(index: number): string {
    return `${this.listboxId}-option-${index}`;
  }

  // ── Mensagem de status para leitores de tela ───────────────────────────────
  statusMessage(): string {
    if (this.selecionado()) {
      return `Aluno selecionado: ${this.selecionado()?.nomeCompleto}.`;
    }
    if (this.termo.trim().length < 3) {
      return 'Digite ao menos 3 caracteres para buscar aluno.';
    }
    if (this.loading()) {
      return 'Buscando alunos...';
    }
    const total = this.resultados().length;
    return total
      ? `${total} alunos encontrados. Use as setas para navegar, Enter para selecionar e Escape para fechar.`
      : 'Nenhum aluno encontrado.';
  }

  // ── Handler de input nativo (sem [(ngModel)] para evitar conflito com Signal)
  onInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.termo = value;
    this.activeIndex.set(-1);
    this.isManuallyClosed.set(false);

    const q = value.trim();
    // Emite o evento de busca — o debounce está centralizado no componente pai
    // via pipeline RxJS (debounceTime + distinctUntilChanged + switchMap)
    if (q.length >= 3 && !this.selecionado()) {
      this.search.emit(q);
    }
  }

  // ── Navegação por teclado ──────────────────────────────────────────────────
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
      this.activeIndex.set(
        this.activeIndex() <= 0 ? resultados.length - 1 : this.activeIndex() - 1,
      );
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

  // ── Ações ──────────────────────────────────────────────────────────────────
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

  // ── Helpers ────────────────────────────────────────────────────────────────
  descricaoAluno(aluno: BeneficiarioResumo | null): string {
    if (!aluno) return 'Sem matricula';
    const partes = [
      aluno.matricula    ? `Matricula: ${aluno.matricula}`    : null,
      aluno.cpfMascarado ? `CPF: ${aluno.cpfMascarado}`       : null,
    ].filter(Boolean);
    return partes.length ? partes.join(' — ') : 'Sem matricula';
  }
}

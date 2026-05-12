import {
  Component,
  computed,
  EventEmitter,
  Input,
  Output,
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
  // ── Inputs via setter → signal interno (atualização síncrona garantida) ────
  // CORREÇÃO: @Input() setter é síncrono. Ao contrário de input() Signal +
  // effect(), o setter roda imediatamente ao receber o novo valor do pai,
  // antes da próxima avaliação do template. Isso garante que computed()
  // sempre lê dados atualizados quando o pai passa a nova lista.
  private readonly _alunos  = signal<BeneficiarioResumo[]>([]);
  private readonly _loading = signal(false);

  @Input() set alunos(value: BeneficiarioResumo[]) {
    this._alunos.set(value ?? []);
  }

  @Input() set loading(value: boolean) {
    this._loading.set(value ?? false);
  }

  @Input() label = 'Aluno cadastrado';

  @Output() readonly selected = new EventEmitter<BeneficiarioResumo | null>();
  @Output() readonly search   = new EventEmitter<string>();

  // ── IDs únicos para acessibilidade ARIA ───────────────────────────────────
  private readonly uid = Math.random().toString(36).slice(2);
  readonly inputId   = `aluno-ac-input-${this.uid}`;
  readonly listboxId = `aluno-ac-listbox-${this.uid}`;

  // ── Estado interno como Signals ────────────────────────────────────────────
  // CORREÇÃO: termo convertido para Signal para que computed() reexecute
  // quando o usuário digita, não só quando a lista de alunos muda.
  readonly termo            = signal('');
  readonly selecionado      = signal<BeneficiarioResumo | null>(null);
  readonly activeIndex      = signal(-1);
  readonly isManuallyClosed = signal(false);

  // ── Computed: reativo a AMBOS os Signals (alunos + termo) ─────────────────
  readonly resultados = computed(() => {
    if (this.termo().trim().length < 3) return [];
    return this._alunos().slice(0, 10);
  });

  // ── Expõe loading() para o template ───────────────────────────────────────
  readonly isLoading = computed(() => this._loading());

  // ── Estado da lista visível ────────────────────────────────────────────────
  readonly isListVisible = computed(() =>
    !this.selecionado() &&
    !this.isManuallyClosed() &&
    this.termo().trim().length >= 3
  );

  readonly isOpen = computed(() =>
    this.isListVisible() && this.resultados().length > 0
  );

  // ── IDs de opções para ARIA ────────────────────────────────────────────────
  activeOptionId(): string | null {
    return this.activeIndex() >= 0 ? this.optionId(this.activeIndex()) : null;
  }

  optionId(index: number): string {
    return `${this.listboxId}-option-${index}`;
  }

  // ── Mensagem de status para leitores de tela ───────────────────────────────
  readonly statusMessage = computed(() => {
    if (this.selecionado()) {
      return `Aluno selecionado: ${this.selecionado()?.nomeCompleto}.`;
    }
    if (this.termo().trim().length < 3) {
      return 'Digite ao menos 3 caracteres para buscar aluno.';
    }
    if (this._loading()) {
      return 'Buscando alunos...';
    }
    const total = this.resultados().length;
    return total
      ? `${total} alunos encontrados. Use as setas para navegar, Enter para selecionar e Escape para fechar.`
      : 'Nenhum aluno encontrado.';
  });

  // ── Handler de input nativo ────────────────────────────────────────────────
  onInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.termo.set(value);
    this.activeIndex.set(-1);
    this.isManuallyClosed.set(false);

    const q = value.trim();
    if (q.length >= 3 && !this.selecionado()) {
      this.search.emit(q);
    }

    if (q.length < 3) {
      this._alunos.set([]);
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
    this.termo.set(aluno.nomeCompleto);
    this.selected.emit(aluno);
  }

  limpar(): void {
    this.selecionado.set(null);
    this.activeIndex.set(-1);
    this.isManuallyClosed.set(false);
    this._alunos.set([]);
    this.termo.set('');
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

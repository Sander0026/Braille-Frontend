import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  signal,
  computed,
  inject,
  DestroyRef,
  ViewEncapsulation,
  ElementRef,
  ViewChild,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { A11yModule } from '@angular/cdk/a11y';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TurmasService, Turma } from '../../../../core/services/turmas.service';
import { AuthService } from '../../../../core/services/auth.service';

import { FrequenciaChamadaComponent }  from '../components/frequencia-chamada/frequencia-chamada.component';
import { FrequenciaHistoricoComponent } from '../components/frequencia-historico/frequencia-historico.component';
import { FrequenciaRelatorioComponent } from '../components/frequencia-relatorio/frequencia-relatorio.component';

/** Mapa de rótulos legíveis para cada aba — usado nos anúncios de screen reader */
const ABA_LABELS: Record<string, string> = {
  chamada:   'Fazer Chamada',
  historico: 'Histórico de Frequências',
  relatorio: 'Relatório Individual',
};

@Component({
  selector: 'app-frequencias-lista',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    A11yModule,
    FrequenciaChamadaComponent,
    FrequenciaHistoricoComponent,
    FrequenciaRelatorioComponent,
  ],
  templateUrl: './frequencias-lista.html',
  styleUrl: './frequencias-lista.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FrequenciasLista implements OnInit, AfterViewInit {
  private readonly turmasService = inject(TurmasService);
  private readonly authService   = inject(AuthService);
  private readonly destroyRef    = inject(DestroyRef);

  /** Referência à live region para anunciar trocas de aba (WCAG 4.1.3) */
  @ViewChild('anuncio', { static: true }) private anuncioEl!: ElementRef<HTMLDivElement>;

  readonly abaAtiva       = signal<'chamada' | 'historico' | 'relatorio'>('chamada');
  readonly turmas         = signal<Turma[]>([]);
  readonly isProfessor    = signal<boolean>(false);
  readonly userId         = signal<string>('');
  readonly erroCarregamento = signal<string>('');

  readonly turmasParaChamada = computed(() => this.turmas().filter(t => t.status === 'ANDAMENTO'));

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.isProfessor.set(user?.role === 'PROFESSOR');
    this.userId.set(user?.sub || '');
    this.carregarTurmas();
  }

  ngAfterViewInit(): void {}

  carregarTurmas(): void {
    const profId = this.isProfessor() ? this.userId() : undefined;

    this.turmasService.listar(1, 100, undefined, true, profId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.turmas.set(res.data.filter(t => t.statusAtivo)),
        error: () => this.erroCarregamento.set(
          'Não foi possível carregar as turmas. Verifique se o servidor está online.'
        ),
      });
  }

  /**
   * Troca a aba ativa e anuncia a mudança para leitores de tela via live region.
   * Padrão ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
   */
  mudarAba(aba: 'chamada' | 'historico' | 'relatorio'): void {
    this.abaAtiva.set(aba);
    this.anunciarTrocaDeAba(aba);
  }

  /** Injeta mensagem na live region — o texto é limpo após 1 s para evitar anúncio duplicado (WCAG 4.1.3) */
  private anunciarTrocaDeAba(aba: string): void {
    const el = this.anuncioEl?.nativeElement;
    if (!el) return;
    el.textContent = `Aba "${ABA_LABELS[aba]}" selecionada.`;
    setTimeout(() => { el.textContent = ''; }, 1000);
  }
}

import { Component, ChangeDetectionStrategy, Directive, ElementRef, Input, OnInit, signal, inject, DestroyRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FocusableOption, A11yModule } from '@angular/cdk/a11y';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TurmasService, Turma } from '../../../../core/services/turmas.service';
import { AuthService } from '../../../../core/services/auth.service';

// Importando os 3 Micro-Frontends Filhos Isolados
import { FrequenciaChamadaComponent } from '../components/frequencia-chamada/frequencia-chamada.component';
import { FrequenciaHistoricoComponent } from '../components/frequencia-historico/frequencia-historico.component';
import { FrequenciaRelatorioComponent } from '../components/frequencia-relatorio/frequencia-relatorio.component';

// Diretiva de acessibilidade exposta para ser usada nas tabelas internas
@Directive({
  selector: '[appTabelaTrFocavel]',
  standalone: true
})
export class TabelaTrFocavelDirective implements FocusableOption {
  @Input() disabled = false;

  constructor(public element: ElementRef<HTMLElement>) { }

  focus(): void {
    this.element.nativeElement.focus();
  }
}

@Component({
  selector: 'app-frequencias-lista',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    A11yModule, 
    FrequenciaChamadaComponent, 
    FrequenciaHistoricoComponent, 
    FrequenciaRelatorioComponent
  ],
  templateUrl: './frequencias-lista.html',
  styleUrl: './frequencias-lista.scss',
  encapsulation: ViewEncapsulation.None, // Permite que o enorme scss vaze para os componentes filhos sem quebra-los
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FrequenciasLista implements OnInit {
  private readonly turmasService = inject(TurmasService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  // Estados Baseados em Signals
  readonly abaAtiva = signal<'chamada' | 'historico' | 'relatorio'>('chamada');
  readonly turmas = signal<Turma[]>([]);
  readonly isProfessor = signal<boolean>(false);
  readonly userId = signal<string>('');
  readonly erroCarregamento = signal<string>('');

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.isProfessor.set(user?.role === 'PROFESSOR');
    this.userId.set(user?.sub || '');
    this.carregarTurmas();
  }

  carregarTurmas(): void {
    const profId = this.isProfessor() ? this.userId() : undefined;
    
    this.turmasService.listar(1, 100, undefined, true, profId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.turmas.set(res.data.filter(t => t.statusAtivo));
        },
        error: () => {
          this.erroCarregamento.set('Não foi possível carregar as turmas. Verifique se o servidor está online.');
        },
      });
  }

  mudarAba(aba: 'chamada' | 'historico' | 'relatorio'): void {
    this.abaAtiva.set(aba);
  }
}

import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

/** Tipagem de Borda/Sombra para uso Semântico Múltiplo no Design System */
export type CardVariant = 'elevated' | 'outline' | 'flat';

@Component({
  selector: 'app-ui-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush, // Bloqueio de reflows globais para otimizar paineis massivos
  template: `
    <!-- Semântica de Tag section obriga leitores de tela a isolarem o contexto e aria-label -->
    <section 
      [attr.aria-label]="ariaLabel() || 'Cartão de Informação'"
      [class]="cardClasses()">
      
      <!-- Slot Protegido para Injeção de Cabeçalhos -->
      <header class="card-header border-b border-gray-100 bg-gray-50/50 px-6 py-4 rounded-t-xl empty:hidden">
        <ng-content select="[card-header]"></ng-content>
      </header>

      <!-- Slot Principal do Card -->
      <main class="card-body p-6 flex flex-col gap-4 text-gray-700">
        <ng-content select="[card-body]"></ng-content>
      </main>

      <!-- Slot para Ações (Botões), Oculto nativamente caso o programador não injete via vazio -->
      <footer class="card-action border-t border-gray-100 px-6 py-4 bg-gray-50/30 rounded-b-xl flex justify-end gap-3 empty:hidden">
        <ng-content select="[card-action]"></ng-content>
      </footer>
      
    </section>
  `
})
export class UiCard {
  
  /** Atributos Funcionais de Reatividade Clean (Evita ciclo desnecessário do antigo @Input) */
  variant = input<CardVariant>('elevated');
  ariaLabel = input<string | undefined>(); // Fallback seguro WCAG

  /**
   * Resolver Tailwind Classes isoladas de compilação OnPush.
   * Não precisa poluir a View com *ngClass e dezenas de avaliações a cada clique na tela.
   */
  cardClasses = computed(() => {
    const defaultClasses = 'flex flex-col bg-white rounded-xl transition-all duration-200 ease-in-out block w-full';
    
    switch (this.variant()) {
      case 'outline':
        return `${defaultClasses} border-2 border-gray-200`;
      case 'flat':
        return `${defaultClasses} border border-gray-100 box-shadow-none`;
      case 'elevated':
      default:
        return `${defaultClasses} shadow-md border border-gray-50 hover:shadow-lg`;
    }
  });

}

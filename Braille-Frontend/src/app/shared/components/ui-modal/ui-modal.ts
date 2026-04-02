import { Component, ChangeDetectionStrategy, input, output, effect, ElementRef, ViewChild, HostListener } from '@angular/core';

@Component({
  selector: 'app-ui-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush, // Bloqueio extremo de Vazamentos de Memória (UI Lock)
  template: `
    <!-- Motor Reativo @if protege contra renderizações sujas -->
    @if (isOpen()) {
      <!-- 
        Uso nativo da tag HTML5 <dialog> invés de gambiarras com <div absolute z-index>.
        Impede sobreposições inconsistentes e garante captura de Foco (A11y WAI-ARIA inerente) 
      -->
      <div 
        class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity" 
        aria-hidden="true" 
        (click)="closeOnBackdrop()">
      </div>

      <dialog 
        #modalDialog
        [open]="isOpen()"
        class="fixed inset-0 z-50 m-auto flex flex-col bg-white rounded-xl shadow-2xl p-0 overflow-hidden outline-none break-words
               w-[95%] sm:w-[500px] md:max-w-[700px] max-h-[90vh]"
        aria-modal="true" 
        [attr.aria-labelledby]="ariaLabelledBy() || 'modal-title'"
        [attr.aria-describedby]="ariaDescribedBy()"
        (keydown.escape)="onEscape($event)">
        
        <!-- Slot Transcluso: Cabeçalho -->
        <header class="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50 empty:hidden">
          <ng-content select="[modal-header]"></ng-content>
          
          @if (showCloseButton()) {
            <button 
              type="button" 
              class="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary rounded p-1 transition-colors"
              aria-label="Botão de fechamento da janela modal"
              (click)="onClose()">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          }
        </header>

        <!-- Slot Transcluso: Corpo -->
        <main class="flex-1 overflow-y-auto px-6 py-6 text-gray-700 custom-scrollbar">
          <ng-content select="[modal-body]"></ng-content>
        </main>

        <!-- Slot Transcluso: Rodapé (Ações) -->
        <footer class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 empty:hidden">
          <ng-content select="[modal-footer]"></ng-content>
        </footer>

      </dialog>
    }
  `,
  styles: [`
    /* Scrollbar minimalista isolada */
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
    
    dialog::backdrop {
      display: none; /* Controlado via DIV para ter suporte nativo ao click-out */
    }
  `]
})
export class UiModal {
  @ViewChild('modalDialog') dialogRef?: ElementRef<HTMLDialogElement>;

  // Variáveis Funcionais do Fluxo de Estado Angular Signals
  isOpen = input.required<boolean>();
  showCloseButton = input<boolean>(true);
  disableBackdropClick = input<boolean>(false);
  
  // WAI-ARIA Dynamics Security
  ariaLabelledBy = input<string | undefined>();
  ariaDescribedBy = input<string | undefined>();

  // Notificador de Eventos Angular Model CVA-Like
  closed = output<void>();

  // Efeito reativo para focalizar o Modal assim que ele abre (Requiremento crítico WCAG de Navegação por Teclado)
  constructor() {
    effect(() => {
      if (this.isOpen() && this.dialogRef) {
        // Envia foco ao corpo do modal para blindar navegação por TAB (Trap Focus Nativo do Browser)
        requestAnimationFrame(() => this.dialogRef?.nativeElement?.focus());
      }
    });
  }

  onClose() {
    this.closed.emit();
  }

  closeOnBackdrop() {
    if (!this.disableBackdropClick()) {
      this.onClose();
    }
  }

  // Previne bugs default de navegação nativa paralisando a renderização descontrolável da tag <dialog> base
  onEscape(event: KeyboardEvent) {
    event.preventDefault();
    if (!this.disableBackdropClick()) {
      this.onClose();
    }
  }
}

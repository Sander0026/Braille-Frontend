import { Component, ChangeDetectionStrategy, input, forwardRef, signal, computed } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiInput),
      multi: true
    }
  ],
  template: `
    <div class="flex flex-col w-full text-left">
      <!-- Label Renderizado de forma dinamica caso o Programador passe -->
      @if (label()) {
        <label 
          [htmlFor]="id()" 
          class="block text-sm font-medium text-gray-700 mb-1"
        >
          {{ label() }}
        </label>
      }

      <div class="relative rounded-md shadow-sm">
        <input
          [id]="id()"
          [type]="type()"
          [placeholder]="placeholder()"
          [disabled]="isDisabled()"
          [value]="value()"
          (input)="onInput($event)"
          (blur)="onTouched()"
          [attr.aria-label]="ariaLabel() || label()"
          [attr.aria-invalid]="hasError() ? 'true' : 'false'"
          [attr.aria-describedby]="hasError() ? id() + '-error' : null"
          class="block w-full rounded-md border-gray-300 px-4 py-2 text-gray-900 border
                 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
                 sm:text-sm transition-colors duration-200"
          [ngClass]="{
            'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500': hasError(),
            'bg-gray-100 text-gray-500 cursor-not-allowed': isDisabled()
          }"
        />
      </div>

      <!-- Tratativa Unificada de Mensagem de Erro (SRP Centralizado) -->
      @if (hasError() && errorMessage()) {
        <p 
          [id]="id() + '-error'" 
          class="mt-2 text-sm text-red-600"
          role="alert" 
          aria-live="assertive"
        >
          {{ errorMessage() }}
        </p>
      }
    </div>
  `
})
export class UiInput implements ControlValueAccessor {

  // Signals Funcionais de Configuração do Input
  label = input<string>('');
  ariaLabel = input<string | undefined>();
  type = input<'text' | 'email' | 'password' | 'number'>('text');
  placeholder = input<string>('');
  hasError = input<boolean>(false);
  errorMessage = input<string>('');
  
  // Identificador randomico isolado para evitar colisao de labellings ARIA
  id = input<string>(`ui-input-${Math.random().toString(36).substring(2, 9)}`);

  // Estado Interno Gerenciado via Signal
  value = signal<string>('');
  isDisabled = signal<boolean>(false);

  // Callbacks Funcionais providos pelo Angular Forms (CVA Mechanics)
  onChange = (val: string) => {};
  onTouched = () => {};

  /**
   * Captura as insercoes do Host, escreve no signal e Notifica a raiz do form
   */
  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const val = target.value;
    this.value.set(val);
    this.onChange(val);
  }

  // ---- CVA INTERFACE IMPLEMENTATION ---- //

  /** 
   * Método chamado pelo framework (Model -> View) qdo `patchValue` é trigado
   */
  writeValue(val: string): void {
    this.value.set(val || '');
  }

  /**
   * Registra a Lamba de Alteração (View -> Model) passada pelo Angular
   */
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  /**
   * Registra o toque no campo (Focus lost / Blur)
   */
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  /**
   * Método disparado quando o FormGroup desabilita o controller
   */
  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

}

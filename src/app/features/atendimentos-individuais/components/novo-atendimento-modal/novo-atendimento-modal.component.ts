import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AtendimentoFormComponent } from '../atendimento-form/atendimento-form.component';
import { AcompanhamentoIndividual } from '../../models/acompanhamento-individual.model';
import { CriarAtendimentoIndividualPayload, AtendimentoIndividual } from '../../models/atendimento-individual.model';
import { AtendimentosIndividuaisApiService } from '../../services/atendimentos-individuais-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';

@Component({
  selector: 'app-novo-atendimento-modal',
  standalone: true,
  imports: [CommonModule, AtendimentoFormComponent],
  templateUrl: './novo-atendimento-modal.component.html',
  styleUrl: './novo-atendimento-modal.component.scss'
})
export class NovoAtendimentoModalComponent {
  private readonly api = inject(AtendimentosIndividuaisApiService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  @Input({ required: true }) acompanhamento!: AcompanhamentoIndividual;
  @Output() salvo = new EventEmitter<AtendimentoIndividual>();
  @Output() fechado = new EventEmitter<void>();

  @ViewChild('criacaoPrimeiroFoco') private criacaoPrimeiroFoco?: ElementRef<HTMLElement>;

  readonly salvando = signal(false);
  formTocado = false;
  salvoComSucesso = false;

  ngAfterViewInit() {
    window.setTimeout(() => this.criacaoPrimeiroFoco?.nativeElement.focus());
  }

  async fechar(): Promise<void> {
    if (this.salvando()) return;
    if (this.temAlteracoes() && !(await this.confirmarDescarte())) return;
    this.fechado.emit();
  }

  salvar(payload: CriarAtendimentoIndividualPayload): void {
    this.salvando.set(true);
    this.api.criarAtendimento(this.acompanhamento.id, payload).subscribe({
      next: criado => {
        this.salvando.set(false);
        this.salvoComSucesso = true;
        this.toast.sucesso('Atendimento criado com sucesso.');
        this.salvo.emit(criado);
      },
      error: () => {
        this.salvando.set(false);
        this.toast.erro('Não foi possível salvar o atendimento.');
      }
    });
  }

  temAlteracoes(): boolean {
    return this.formTocado && !this.salvoComSucesso;
  }

  private confirmarDescarte(): Promise<boolean> {
    return this.confirmDialog.confirmar({
      titulo: 'Descartar alterações?',
      mensagem: 'Existem alterações não salvas. Deseja realmente sair e descartar as informações preenchidas?',
      textoBotaoConfirmar: 'Descartar alterações',
      textoBotaoCancelar: 'Continuar editando',
      tipo: 'warning',
    });
  }

  onDialogKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.fechar();
      return;
    }
    if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.salvando()) {
      this.fechar();
    }
  }

  private trapFocus(event: KeyboardEvent): void {
    const root = event.currentTarget as HTMLElement;
    const sel = 'button:not([disabled]),[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
    const focusable = Array.from(root.querySelectorAll<HTMLElement>(sel));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (document.activeElement === root) { event.preventDefault(); (event.shiftKey ? last : first).focus(); return; }
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); return; }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
}

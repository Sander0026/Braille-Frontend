import { Component, ChangeDetectionStrategy, EventEmitter, Output, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { A11yModule, LiveAnnouncer } from '@angular/cdk/a11y';
import { Subject, takeUntil, finalize } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-modal-senha',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, A11yModule],
  templateUrl: './modal-senha.component.html',
  styleUrl: './modal-senha.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalSenhaComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();

  formSenha!: FormGroup;
  senhaErro: string | null = null;
  senhaSucesso = false;
  carregandoSenha = false;

  private readonly destroy$ = new Subject<void>();
  private readonly announcer = inject(LiveAnnouncer);

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.inicializarForm();
  }

  fecharModal(): void {
    if (!this.carregandoSenha) {
      this.close.emit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).tagName === 'DIALOG') {
      this.fecharModal();
    }
  }

  private inicializarForm(): void {
    this.formSenha = this.fb.group({
      senhaAtual: ['', [Validators.required]],
      novaSenha: ['', [
        Validators.required, 
        Validators.minLength(8),
        // OWASP: Exigir complexidade
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/)
      ]],
      confirmarSenha: ['', [Validators.required]]
    }, { validators: [this.senhasIguaisValidator] });
  }

  private senhasIguaisValidator(group: FormGroup): { [key: string]: boolean } | null {
    const nova = group.get('novaSenha')?.value;
    const confirmar = group.get('confirmarSenha')?.value;
    return nova && confirmar && nova !== confirmar ? { senhasDiferentes: true } : null;
  }

  get confirmacaoInvalida(): boolean {
    return !!(this.formSenha.hasError('senhasDiferentes') &&
      this.formSenha.get('confirmarSenha')?.touched);
  }

  salvarSenha(): void {
    if (this.formSenha.invalid || this.carregandoSenha) return;

    const { senhaAtual, novaSenha } = this.formSenha.value;
    this.carregandoSenha = true;
    this.senhaErro = null;

    this.authService.trocarSenha(senhaAtual, novaSenha)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.carregandoSenha = false)
      )
      .subscribe({
        next: () => {
          this.senhaSucesso = true;
          this.announcer.announce('Senha alterada com sucesso!', 'polite');
          this.formSenha.reset();
          // Timeout sem causar leak de memória 
          setTimeout(() => this.fecharModal(), 1800);
        },
        error: (err: any) => {
          this.senhaErro = err?.error?.message ?? 'Erro ao trocar a senha. Verifique a senha atual e tente novamente.';
          this.announcer.announce(this.senhaErro!, 'assertive');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

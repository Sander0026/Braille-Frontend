import { Component, ChangeDetectionStrategy, EventEmitter, Input, Output, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { A11yModule, LiveAnnouncer } from '@angular/cdk/a11y';
import { Subject, takeUntil, finalize } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-modal-foto',
  standalone: true,
  imports: [CommonModule, A11yModule],
  templateUrl: './modal-foto.component.html',
  styleUrl: './modal-foto.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalFotoComponent implements OnDestroy {
  @Input() fotoPerfil: string | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() fotoAtualizada = new EventEmitter<string | null>();

  fotoPreview: string | null = null;
  fotoSelecionada: File | null = null;
  fotoErro: string | null = null;
  carregandoFoto = false;
  removerFotoFlag = false;

  private readonly destroy$ = new Subject<void>();
  private readonly announcer = inject(LiveAnnouncer);

  constructor(private readonly authService: AuthService) {}

  fecharModal(): void {
    if (!this.carregandoFoto) {
      this.close.emit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).tagName === 'DIALOG') {
      this.fecharModal();
    }
  }

  onFotoSelecionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.fotoErro = null;

    if (!file) return;

    // Sanitização e validação OWASP Anti-DOS / Malformed Files
    const extensoesValidas = ['image/jpeg', 'image/png', 'image/webp'];
    if (!extensoesValidas.includes(file.type)) {
      this.fotoErro = 'Formato inválido. Use JPG, PNG ou WebP.';
      this.announcer.announce(this.fotoErro, 'assertive');
      return;
    }
    
    // Limite máximo de tamanho OWASP
    if (file.size > 2 * 1024 * 1024) {
      this.fotoErro = 'A imagem deve ter no máximo 2 MB.';
      this.announcer.announce(this.fotoErro, 'assertive');
      return;
    }

    this.fotoSelecionada = file;
    this.removerFotoFlag = false;

    const reader = new FileReader();
    reader.onload = (e) => { 
        this.fotoPreview = e.target?.result as string; 
    };
    reader.readAsDataURL(file);
  }

  marcarParaRemoverFoto(): void {
    this.fotoSelecionada = null;
    this.removerFotoFlag = true;
    this.fotoPreview = null;
  }

  salvarFoto(): void {
    if ((!this.fotoSelecionada && !this.removerFotoFlag) || this.carregandoFoto) return;

    this.carregandoFoto = true;
    this.fotoErro = null;

    if (this.removerFotoFlag) {
      this.authService.atualizarFoto(null)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.carregandoFoto = false)
        )
        .subscribe({
          next: () => {
            this.fotoAtualizada.emit(null);
            this.fecharModal();
          },
          error: () => {
            this.fotoErro = 'Erro ao remover a foto. Tente novamente.';
          }
        });
      return;
    }

    if (this.fotoSelecionada) {
      this.authService.uploadFoto(this.fotoSelecionada)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: ({ url }) => {
            this.authService.atualizarFoto(url)
              .pipe(
                takeUntil(this.destroy$),
                finalize(() => this.carregandoFoto = false)
              )
              .subscribe({
                next: () => {
                  this.fotoAtualizada.emit(url);
                  this.fecharModal();
                },
                error: () => {
                  this.fotoErro = 'Erro ao salvar a foto atualizada.';
                }
              });
          },
          error: () => {
            this.carregandoFoto = false;
            this.fotoErro = 'Erro ao fazer o upload da imagem.';
          }
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

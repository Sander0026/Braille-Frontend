import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Apoiador, ApoiadoresService } from '../../apoiadores.service';
import { A11yModule, LiveAnnouncer } from '@angular/cdk/a11y';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
  selector: 'app-apoiador-perfil',
  standalone: true,
  imports: [CommonModule, A11yModule],
  templateUrl: './apoiador-perfil.component.html',
  styleUrl: './apoiador-perfil.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApoiadorPerfilComponent {
  @Input({ required: true }) isOpen = false;
  @Input({ required: true }) apoiador!: Apoiador;
  @Input() carregandoDetalhes = false;

  @Output() formClosed = new EventEmitter<void>();
  @Output() editRequested = new EventEmitter<string>();
  @Output() viewActionsRequested = new EventEmitter<void>();
  @Output() viewCertificatesRequested = new EventEmitter<void>();

  carregandoLogoInline = false;

  private readonly announcer = inject(LiveAnnouncer);
  private readonly toast = inject(ToastService);

  constructor(
    private readonly apoiadoresService: ApoiadoresService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  fecharModal(): void {
    this.formClosed.emit();
  }

  editar(): void {
    this.editRequested.emit(this.apoiador.id);
  }

  onLogoSelectedAdmin(event: any): void {
    const file = event.target.files?.[0];
    if (!file || !this.apoiador) return;

    if (file.size > 10 * 1024 * 1024) {
      this.toast.aviso('O arquivo selecionado excede o limite de 10MB permitido. Escolha um arquivo menor.');
      this.announcer.announce('Erro: O logotipo excede o limite de 10 megabytes.', 'assertive');
      event.target.value = '';
      return;
    }

    this.carregandoLogoInline = true;
    this.cdr.detectChanges();

    this.apoiadoresService.uploadLogo(this.apoiador.id, file).subscribe({
      next: (res: any) => {
        const url = res.logoUrl || res.url;
        if (url) {
          this.apoiador.logoUrl = url;
          this.announcer.announce('Logotipo processado e alterado com sucesso.', 'polite');
        }
        this.carregandoLogoInline = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro no upload inline da logo', err);
        this.announcer.announce('Falha ao subir logotipo. O arquivo pode ser inválido ou exceder o tamanho definido.', 'assertive');
        this.carregandoLogoInline = false;
        this.cdr.detectChanges();
      }
    });
  }
}

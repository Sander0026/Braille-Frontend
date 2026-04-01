import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Apoiador, ApoiadoresService } from '../../apoiadores.service';

@Component({
  selector: 'app-apoiador-perfil',
  standalone: true,
  imports: [CommonModule],
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

    this.carregandoLogoInline = true;
    this.cdr.detectChanges();

    this.apoiadoresService.uploadLogo(this.apoiador.id, file).subscribe({
      next: (res: any) => {
        const url = res.logoUrl || res.url;
        if (url) {
          this.apoiador.logoUrl = url;
        }
        this.carregandoLogoInline = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro no upload inline da logo', err);
        alert('Falha ao subir logotipo. Verifique o tamanho ou tente novamente.');
        this.carregandoLogoInline = false;
        this.cdr.detectChanges();
      }
    });
  }
}

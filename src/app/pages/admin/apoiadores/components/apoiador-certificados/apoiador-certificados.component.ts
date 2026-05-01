import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Apoiador, ApoiadoresService } from '../../apoiadores.service';
import { PdfViewerComponent } from '../../../../../shared/components/pdf-viewer/pdf-viewer.component';
import { A11yModule, LiveAnnouncer } from '@angular/cdk/a11y';
import { CertificadoEmitido } from '../../../../../core/interfaces/certificados.interface';

@Component({
  selector: 'app-apoiador-certificados',
  standalone: true,
  imports: [CommonModule, PdfViewerComponent, A11yModule],
  templateUrl: './apoiador-certificados.component.html',
  styleUrl: './apoiador-certificados.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApoiadorCertificadosComponent implements OnInit {
  @Input({ required: true }) isOpen = false;
  @Input({ required: true }) apoiador!: Apoiador;
  @Input() certificados: CertificadoEmitido[] = [];
  @Input() carregandoCertificados = false;

  @Output() modalClosed = new EventEmitter<void>();
  @Output() certificatesUpdated = new EventEmitter<void>();

  // Track button states
  processandoId: string | null = null;

  // View PDF
  pdfAberto = false;
  pdfAtual: { url: string; title: string } | null = null;
  
  private readonly announcer = inject(LiveAnnouncer);

  constructor(
    private readonly apoiadoresService: ApoiadoresService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Empty initialization
  }

  fecharModal(): void {
    this.modalClosed.emit();
  }

  abrirPdf(cert: CertificadoEmitido): void {
    this.processandoId = cert.id;
    this.cdr.detectChanges();

    this.apoiadoresService.gerarPdfCertificado(this.apoiador.id, cert.id).subscribe({
      next: (res) => {
        this.pdfAtual = {
          url: res.pdfUrl,
          title: `${cert.tituloCertificado || 'Certificado'} - ${this.apoiador.nomeFantasia || this.apoiador.nomeRazaoSocial}`
        };
        this.pdfAberto = true;
        this.processandoId = null;
        this.announcer.announce('Certificado aberto no visualizador.', 'polite');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao abrir PDF', err);
        this.announcer.announce('Erro ao carregar o PDF do servidor. Verifique sua conexão.', 'assertive');
        this.processandoId = null;
        this.cdr.detectChanges();
      }
    });
  }

  fecharPdf(): void {
    this.pdfAberto = false;
    this.pdfAtual = null;
    this.cdr.detectChanges();
  }

  baixarPdf(cert: CertificadoEmitido): void {
    this.processandoId = cert.id;
    this.cdr.detectChanges();

    this.apoiadoresService.gerarPdfCertificado(this.apoiador.id, cert.id).subscribe({
      next: (res) => {
        // Redireciona para Cloudinary com target _blank para iniciar o download ou visualização nativa
        window.open(res.pdfUrl, '_blank');
        
        this.processandoId = null;
        this.announcer.announce('Download da honraria iniciado com sucesso.', 'polite');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao baixar PDF', err);
        this.announcer.announce('Erro ao realizar o download do PDF.', 'assertive');
        this.processandoId = null;
        this.cdr.detectChanges();
      }
    });
  }
}

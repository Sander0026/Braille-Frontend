import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Apoiador, ApoiadoresService } from '../../apoiadores.service';
import { PdfViewerComponent } from '../../../../../shared/components/pdf-viewer/pdf-viewer.component';

@Component({
  selector: 'app-apoiador-certificados',
  standalone: true,
  imports: [CommonModule, PdfViewerComponent],
  templateUrl: './apoiador-certificados.component.html',
  styleUrl: './apoiador-certificados.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApoiadorCertificadosComponent implements OnInit {
  @Input({ required: true }) isOpen = false;
  @Input({ required: true }) apoiador!: Apoiador;
  @Input() certificados: any[] = [];
  @Input() carregandoCertificados = false;

  @Output() modalClosed = new EventEmitter<void>();
  @Output() certificatesUpdated = new EventEmitter<void>();

  // Track button states
  processandoId: string | null = null;

  // View PDF
  pdfAberto = false;
  pdfAtual: { url: string; title: string } | null = null;

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

  abrirPdf(cert: any): void {
    this.processandoId = cert.id;
    this.cdr.detectChanges();

    this.apoiadoresService.gerarPdfCertificado(this.apoiador.id, cert.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        this.pdfAtual = {
          url: url,
          title: `${cert.tituloCertificado} - ${this.apoiador.nomeFantasia || this.apoiador.nomeRazaoSocial}`
        };
        this.pdfAberto = true;
        this.processandoId = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao abrir PDF', err);
        alert('Erro ao carregar o PDF do servidor. Verifique sua conexão.');
        this.processandoId = null;
        this.cdr.detectChanges();
      }
    });
  }

  fecharPdf(): void {
    this.pdfAberto = false;
    if (this.pdfAtual?.url) {
      URL.revokeObjectURL(this.pdfAtual.url); // Memory leak prevention
    }
    this.pdfAtual = null;
    this.cdr.detectChanges();
  }

  baixarPdf(cert: any): void {
    this.processandoId = cert.id;
    this.cdr.detectChanges();

    this.apoiadoresService.gerarPdfCertificado(this.apoiador.id, cert.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const dataStr = cert.dataEmissao ? String(cert.dataEmissao).substring(0, 10) : 'Doc';
        link.download = `Certificado_${this.apoiador.id}_${dataStr}.pdf`;
        link.target = '_blank';
        link.click();
        URL.revokeObjectURL(url); // Clean quickly for memory efficiency
        
        this.processandoId = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao baixar PDF', err);
        alert('Erro ao realizar o download do PDF.');
        this.processandoId = null;
        this.cdr.detectChanges();
      }
    });
  }
}

import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Apoiador, ApoiadoresService } from '../../apoiadores.service';
import { PdfViewerComponent } from '../../../ajuda/components/pdf-viewer/pdf-viewer.component';

@Component({
  selector: 'app-apoiador-certificados',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PdfViewerComponent],
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

  certificadoForm!: FormGroup;
  gerandoCertificado = false;

  // View PDF
  pdfAberto = false;
  pdfAtual: { url: string; title: string } | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly apoiadoresService: ApoiadoresService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.certificadoForm = this.fb.group({
      tituloCertificado: ['', Validators.required],
      dataEmissao: ['', Validators.required],
      textoPersonalizado: ['']
    });
  }

  fecharModal(): void {
    this.certificadoForm.reset();
    this.modalClosed.emit();
  }

  gerarCertificado(): void {
    if (this.certificadoForm.invalid || !this.apoiador) {
      this.certificadoForm.markAllAsTouched();
      return;
    }

    this.gerandoCertificado = true;
    const dto = this.certificadoForm.value;

    this.apoiadoresService.emitirCertificado(this.apoiador.id, {
      modeloId: dto.tituloCertificado,
      motivoPersonalizado: dto.textoPersonalizado,
      dataEmissao: dto.dataEmissao
    }).subscribe({
      next: () => {
        this.gerandoCertificado = false;
        this.certificadoForm.reset();
        this.certificatesUpdated.emit();
      },
      error: (err: any) => {
        console.error('Erro ao gerar certificado', err);
        alert('Falha ao gerar o certificado da honraria. Tente novamente.');
        this.gerandoCertificado = false;
        this.cdr.detectChanges();
      }
    });
  }

  abrirPdf(cert: any): void {
    if (!cert.pdfUrl) {
      alert('PDF ainda em processamento interno ou indisponível.');
      return;
    }
    this.pdfAtual = {
      url: cert.pdfUrl,
      title: `${cert.tituloCertificado} - ${this.apoiador.nomeFantasia || this.apoiador.nomeRazaoSocial}`
    };
    this.pdfAberto = true;
    this.cdr.detectChanges();
  }

  fecharPdf(): void {
    this.pdfAberto = false;
    this.pdfAtual = null;
    this.cdr.detectChanges();
  }

  baixarPdf(cert: any): void {
    if (!cert.pdfUrl) return;
    const link = document.createElement('a');
    link.href = cert.pdfUrl;
    link.download = `Certificado_${this.apoiador.id}_${cert.id}.pdf`;
    link.target = '_blank';
    link.click();
  }
}

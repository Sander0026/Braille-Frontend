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

  processandoId: string | null = null;

  pdfAberto = false;
  pdfAtual: { url: string; title: string } | null = null;

  private readonly announcer = inject(LiveAnnouncer);

  constructor(
    private readonly apoiadoresService: ApoiadoresService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  fecharModal(): void {
    this.modalClosed.emit();
  }

  tituloCertificado(cert: CertificadoEmitido): string {
    return cert.modelo?.nome || cert.acao?.descricaoAcao || cert.tituloCertificado || 'Certificado';
  }

  detalheCertificado(cert: CertificadoEmitido): string {
    if (cert.acao?.descricaoAcao) return `Acao: ${cert.acao.descricaoAcao}`;
    if (cert.emitidoPor?.nomeCompleto || cert.emitidoPor?.nome) {
      return `Emitido por: ${cert.emitidoPor.nomeCompleto || cert.emitidoPor.nome}`;
    }
    return 'Emissao manual';
  }

  abrirPdf(cert: CertificadoEmitido): void {
    this.processandoId = cert.id;
    this.cdr.detectChanges();

    const janelaPdf = this.abrirJanelaPdfPendente();
    this.apoiadoresService.gerarPdfCertificado(this.apoiador.id, cert.id).subscribe({
      next: (res) => {
        this.enviarPdfParaJanela(res.pdfUrl, janelaPdf);
        this.processandoId = null;
        this.announcer.announce('Certificado aberto em nova aba.', 'polite');
        this.cdr.detectChanges();
      },
      error: (err) => {
        janelaPdf?.close();
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

  /**
   * Snyk Fix (CWE-601 — Open Redirect):
   * Valida que a URL retornada pela API pertence ao Cloudinary antes de abrir no browser.
   * Impede que uma URL maliciosa redirecione o usuário para domínios não autorizados.
   */
  private isSafeCloudinaryUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' &&
        (parsed.hostname === 'res.cloudinary.com' || parsed.hostname.endsWith('.cloudinary.com'));
    } catch {
      return false;
    }
  }

  baixarPdf(cert: CertificadoEmitido): void {
    this.processandoId = cert.id;
    this.cdr.detectChanges();

    const janelaPdf = this.abrirJanelaPdfPendente();
    this.apoiadoresService.gerarPdfCertificado(this.apoiador.id, cert.id).subscribe({
      next: (res) => {
        // Snyk Fix CWE-601: valida domínio antes de abrir (aceita apenas Cloudinary)
        if (!this.isSafeCloudinaryUrl(res.pdfUrl)) {
          console.error('[Segurança] URL de PDF rejeitada — domínio não autorizado:', res.pdfUrl);
          this.announcer.announce('Erro de segurança: URL do PDF é inválida.', 'assertive');
          janelaPdf?.close();
          this.processandoId = null;
          this.cdr.detectChanges();
          return;
        }
        // noopener,noreferrer — previne que a nova aba acesse window.opener
        this.enviarPdfParaJanela(res.pdfUrl, janelaPdf);
        this.processandoId = null;
        this.announcer.announce('Download da honraria iniciado com sucesso.', 'polite');
        this.cdr.detectChanges();
      },
      error: (err) => {
        janelaPdf?.close();
        console.error('Erro ao baixar PDF', err);
        this.announcer.announce('Erro ao realizar o download do PDF.', 'assertive');
        this.processandoId = null;
        this.cdr.detectChanges();
      }
    });
  }

  private abrirJanelaPdfPendente(): Window | null {
    const janela = window.open('', '_blank');
    if (!janela) {
      this.announcer.announce('O navegador bloqueou a abertura do PDF. Permita pop-ups para este sistema e tente novamente.', 'assertive');
      return null;
    }

    janela.opener = null;
    janela.document.write(`
      <!doctype html>
      <html lang="pt-BR">
        <head><title>Carregando PDF</title></head>
        <body style="font-family: Arial, sans-serif; display: grid; min-height: 100vh; place-items: center; margin: 0;">
          <p>Gerando PDF, aguarde...</p>
        </body>
      </html>
    `);
    janela.document.close();
    return janela;
  }

  private enviarPdfParaJanela(url: string, janela: Window | null): void {
    if (janela && !janela.closed) {
      janela.location.href = url;
      return;
    }

    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  }
}

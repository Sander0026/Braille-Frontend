import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { SafeUrlPipe } from '../../../core/pipes/safe-url.pipe'; 
@Component({
  selector: 'app-beneficiary-details',
  imports: [CommonModule, SafeUrlPipe],
  templateUrl: './beneficiary-details.html',
  styleUrl: './beneficiary-details.scss',
})
export class BeneficiaryDetails {

  // Variável que guarda a URL montada do visualizador
  urlVisualizadorPdf: string | null = null;

  // Exemplo de como o termo do beneficiário pode estar salvo (Simulação)
  termoLgpdMock = 'https://res.cloudinary.com/dpe1qzhhs/raw/upload/v1773854461/braille_lgpd/f7cac7ywqckqxp2guh88.pdf';

  abrirPdf(urlDoCloudinary: string) {
    if (!urlDoCloudinary) return;

    let urlCorrigida = urlDoCloudinary;
    if (!urlCorrigida.toLowerCase().endsWith('.pdf')) {
      urlCorrigida += '.pdf';
    }

    // Monta a URL passando pelo Google Viewer com embedded=true
    this.urlVisualizadorPdf = `https://docs.google.com/viewer?url=${encodeURIComponent(urlCorrigida)}&embedded=true`;
  }

  fecharPdf() {
    this.urlVisualizadorPdf = null;
  }
}


import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { PdfViewerComponent } from '../../../shared/components/pdf-viewer/pdf-viewer.component';

@Component({
  selector: 'app-beneficiary-details',
  imports: [CommonModule, PdfViewerComponent],
  templateUrl: './beneficiary-details.html',
  styleUrl: './beneficiary-details.scss',
})
export class BeneficiaryDetails {
  // Variável que guarda o estado visível do documento
  termoLgpdMock: string = 'https://res.cloudinary.com/dpe1qzhhs/raw/upload/v1773854461/braille_lgpd/f7cac7ywqckqxp2guh88.pdf';
  
  // Controle de estado enxuto e explícito
  exibirTermo: boolean = false;

  abrirPdf() {
    this.exibirTermo = true;
  }

  fecharPdf() {
    this.exibirTermo = false;
  }
}


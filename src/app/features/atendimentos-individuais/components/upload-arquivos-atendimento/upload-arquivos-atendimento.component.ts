import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArquivosAtendimentoApiService } from '../../services/arquivos-atendimento-api.service';
import { ArquivoAtendimentoIndividual, CategoriaArquivoAtendimentoIndividual } from '../../models/arquivo-atendimento.model';

@Component({
  selector: 'app-upload-arquivos-atendimento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="upload">
      <label>
        <span>Categoria do arquivo</span>
        <select [(ngModel)]="categoria">
          <option value="ATESTADO">Atestado</option>
          <option value="LAUDO">Laudo</option>
          <option value="MATERIAL_PEDAGOGICO">Material pedagogico</option>
          <option value="DOCUMENTO">Documento</option>
          <option value="OUTRO">Outro</option>
        </select>
      </label>

      <label>
        <span>Arquivo</span>
        <input type="file" accept=".pdf,.png,.jpg,.jpeg" (change)="selecionar($event)" />
      </label>

      <p aria-live="polite">{{ status }}</p>
    </div>
  `,
  styles: [`
    .upload { display:grid; gap:.75rem; padding:1rem; border:1px dashed #cbd5e1; border-radius:8px; background:#f8fafc; }
    label { display:grid; gap:.35rem; font-weight:800; color:#4b5563; }
    input, select { min-height:2.75rem; border:1px solid #cbd5e1; border-radius:8px; padding:.65rem .8rem; background:#fff; }
    p { margin:0; color:#64748b; }
  `],
})
export class UploadArquivosAtendimentoComponent {
  private readonly api = inject(ArquivosAtendimentoApiService);

  @Input({ required: true }) atendimentoId!: string;
  @Output() uploaded = new EventEmitter<ArquivoAtendimentoIndividual>();

  categoria: CategoriaArquivoAtendimentoIndividual = 'OUTRO';
  status = 'Selecione PDF, PNG, JPG ou JPEG com ate 10 MB.';

  selecionar(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      this.status = 'Arquivo maior que 10 MB. Escolha um arquivo menor.';
      return;
    }

    this.status = 'Enviando arquivo...';
    this.api.anexar(this.atendimentoId, file, this.categoria).subscribe({
      next: arquivo => {
        this.status = 'Arquivo anexado com sucesso.';
        this.uploaded.emit(arquivo);
      },
      error: () => this.status = 'Nao foi possivel anexar o arquivo.',
    });
  }
}

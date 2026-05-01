import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManualArquivo, ManualSecaoAcessivel } from '../../ajuda.constants';

@Component({
  selector: 'app-manual-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './manual-viewer.component.html',
  styleUrl: './manual-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManualViewerComponent {
  @Input({ required: true }) manual!: ManualArquivo;
  @Output() fecharManual = new EventEmitter<void>();
  @Output() abrirPdf = new EventEmitter<ManualArquivo>();

  statusLeitorTela = signal('');

  idSecao(index: number): string {
    return `manual-secao-${index + 1}`;
  }

  idTituloSecao(index: number): string {
    return `${this.idSecao(index)}-titulo`;
  }

  onFechar(): void {
    this.fecharManual.emit();
  }

  onAbrirPdf(): void {
    this.abrirPdf.emit(this.manual);
  }

  navegarParaSecao(index: number, titulo: string): void {
    const tituloSecao = document.getElementById(this.idTituloSecao(index));
    if (!tituloSecao) return;

    tituloSecao.scrollIntoView({ behavior: 'smooth', block: 'start' });
    tituloSecao.focus({ preventScroll: true });
    this.statusLeitorTela.set(`Topico ${titulo} selecionado.`);
  }

  urlPdf(): string {
    const arquivo = this.manual?.arquivo?.trim() ?? '';
    return arquivo.startsWith('assets/') ? `/${arquivo}` : arquivo;
  }

  temConteudoAcessivel(): boolean {
    return Boolean(this.manual?.conteudo?.secoes?.length);
  }

  trackSecao(index: number, secao: ManualSecaoAcessivel): string {
    return `${index}-${secao.titulo}`;
  }
}

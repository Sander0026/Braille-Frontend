import { Component, EventEmitter, Output, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { A11yModule, LiveAnnouncer } from '@angular/cdk/a11y';
import { BeneficiariosService, ImportResult } from '../../../core/services/beneficiarios.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
    selector: 'app-import-modal',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, A11yModule],
    templateUrl: './import-modal.html',
    styleUrl: './import-modal.scss',
})
export class ImportModalComponent {
    @Output() fechou = new EventEmitter<boolean>(); // true = recarregar lista

    arquivoSelecionado: File | null = null;
    isDragOver = false;
    processando = false;
    resultado: ImportResult | null = null;
    erro = '';

    constructor(
        private beneficiariosService: BeneficiariosService,
        private toast: ToastService,
        private cdr: ChangeDetectorRef,
        private liveAnnouncer: LiveAnnouncer
    ) { }

    // ── Drag & Drop ───────────────────────────────────────────────
    onDragOver(event: DragEvent): void {
        event.preventDefault();
        this.isDragOver = true;
        this.cdr.markForCheck();
    }

    onDragLeave(): void {
        this.isDragOver = false;
        this.cdr.markForCheck();
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.isDragOver = false;
        const file = event.dataTransfer?.files?.[0];
        if (file) this.selecionarArquivo(file);
    }

    onFileInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) this.selecionarArquivo(file);
        input.value = '';
    }

    selecionarArquivo(file: File): void {
        const extensoesPermitidas = /\.(xlsx|xls|csv)$/i;
        if (!extensoesPermitidas.test(file.name)) {
            this.erro = 'Tipo de arquivo não permitido. Envie um arquivo .xlsx ou .csv.';
            this.arquivoSelecionado = null;
            this.cdr.markForCheck();
            return;
        }
        this.erro = '';
        this.resultado = null;
        this.arquivoSelecionado = file;
        this.liveAnnouncer.announce(`Arquivo ${file.name} selecionado.`, 'polite');
        this.cdr.markForCheck();
    }

    // ── Download do Modelo (arquivo estático da pasta assets) ────
    baixarModelo(): void {
        const link = document.createElement('a');
        link.href = '/assets/modelo-importacao-alunos.xlsx';
        link.download = 'modelo-importacao-alunos.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // ── Processar Importação ────────────────────────────────────
    importar(): void {
        if (!this.arquivoSelecionado || this.processando) return;

        this.processando = true;
        this.erro = '';
        this.resultado = null;
        this.liveAnnouncer.announce('Iniciando processamento da planilha. Por favor, aguarde.', 'assertive');
        this.cdr.markForCheck();

        this.beneficiariosService.importar(this.arquivoSelecionado).subscribe({
            next: (res) => {
                this.resultado = res;
                this.processando = false;
                if (res.importados > 0) {
                    this.liveAnnouncer.announce(`Importação concluída. ${res.importados} aluno(s) importado(s) com sucesso.`, 'assertive');
                    this.toast.sucesso(`${res.importados} aluno(s) importado(s) com sucesso!`);
                    this.beneficiariosService.limparCache();
                } else {
                    this.liveAnnouncer.announce('Importação concluída, mas nenhum aluno novo foi importado.', 'assertive');
                }
                this.cdr.markForCheck();
            },
            error: (err) => {
                this.erro = err?.error?.message || 'Erro ao processar a planilha. Tente novamente.';
                this.processando = false;
                this.liveAnnouncer.announce('Erro na importação: ' + this.erro, 'assertive');
                this.cdr.markForCheck();
            }
        });
    }

    // ── Fechar ──────────────────────────────────────────────────
    fechar(): void {
        const devRecarregar = (this.resultado?.importados ?? 0) > 0;
        this.fechou.emit(devRecarregar);
    }

    // ── Helpers ──────────────────────────────────────────────────
    get tamanhoFormatado(): string {
        if (!this.arquivoSelecionado) return '';
        const kb = this.arquivoSelecionado.size / 1024;
        return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;
    }
}

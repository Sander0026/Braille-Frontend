import { Component, EventEmitter, Output, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { A11yModule, LiveAnnouncer } from '@angular/cdk/a11y';
import { BeneficiariosService, ImportResult } from '../../../core/services/beneficiarios.service';
import { ToastService } from '../../../core/services/toast.service';
import * as XLSX from 'xlsx';
import { firstValueFrom } from 'rxjs';

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

    // Estado da Importação em Lote
    faseProcessamento: 'aguardando' | 'lendo' | 'enviando' | 'concluido' = 'aguardando';
    totalLinhas = 0;
    linhasProcessadas = 0;
    progressoPercentual = 0;
    TAMANHO_LOTE = 300; 

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
        const extensaoPermitida = /\.xlsx$/i;
        if (!extensaoPermitida.test(file.name)) {
            this.erro = 'Tipo de arquivo não permitido. Envie a planilha modelo no formato .xlsx.';
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
        this.faseProcessamento = 'lendo';
        this.liveAnnouncer.announce('Iniciando leitura da planilha no seu navegador. Isso pode levar alguns segundos.', 'assertive');
        this.cdr.markForCheck();

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // range: 1 ignora a linha 0 (instruções visuais) e usa a linha 1 como chaves (cabeçalhos)
                // blankrows: false e defval: '' garante um formato previsível
                const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { range: 1, blankrows: false, defval: '' });
                
                this.totalLinhas = rawData.length;
                if (this.totalLinhas === 0) {
                    throw new Error('A planilha está vazia ou sem dados válidos.');
                }

                this.faseProcessamento = 'enviando';
                this.liveAnnouncer.announce(`Planilha lida com sucesso. Encontradas ${this.totalLinhas} linhas. Iniciando o envio para o servidor em lotes.`, 'assertive');
                this.cdr.markForCheck();

                await this.processarEmLotes(rawData);
            } catch (err: any) {
                this.erro = err?.message || 'Falha ao ler o arquivo Excel. Verifique se o formato está correto.';
                this.processando = false;
                this.faseProcessamento = 'aguardando';
                this.liveAnnouncer.announce('Erro: ' + this.erro, 'assertive');
                this.cdr.markForCheck();
            }
        };

        reader.onerror = () => {
            this.erro = 'Erro na leitura do arquivo pelo navegador.';
            this.processando = false;
            this.faseProcessamento = 'aguardando';
            this.cdr.markForCheck();
        };

        reader.readAsArrayBuffer(this.arquivoSelecionado);
    }

    private async processarEmLotes(dadosTotais: Record<string, unknown>[]): Promise<void> {
        let consolidadosImportados = 0;
        let consolidadosIgnorados = 0;
        const consolidadosErros: { linha: number; documento: string; motivo: string }[] = [];

        this.linhasProcessadas = 0;
        this.progressoPercentual = 0;

        for (let i = 0; i < this.totalLinhas; i += this.TAMANHO_LOTE) {
            const lote = dadosTotais.slice(i, i + this.TAMANHO_LOTE);
            
            // Injeta a linha original para preservar a referência correta nos erros (índice 0 = linha 2 do excel, etc)
            const loteMarcado = lote.map((row, index) => ({
                ...row,
                _linhaOriginal: i + index + 2 // Pula o cabeçalho
            }));

            try {
                const res = await firstValueFrom(this.beneficiariosService.importarLote(loteMarcado));
                consolidadosImportados += res.importados;
                consolidadosIgnorados += res.ignorados;
                consolidadosErros.push(...res.erros);
                
                this.linhasProcessadas += lote.length;
                this.progressoPercentual = Math.round((this.linhasProcessadas / this.totalLinhas) * 100);
                
                // Anuncia o progresso a cada 20% ou no final para não poluir o leitor de tela
                if (this.progressoPercentual % 20 === 0 || this.linhasProcessadas === this.totalLinhas) {
                    this.liveAnnouncer.announce(`Progresso de importação: ${this.progressoPercentual} por cento concluído.`, 'polite');
                }
                
                this.cdr.markForCheck();
            } catch (error: any) {
                this.erro = error?.error?.message || `Falha fatal ao processar o lote ${Math.floor(i / this.TAMANHO_LOTE) + 1}. A importação foi abortada.`;
                this.processando = false;
                this.faseProcessamento = 'aguardando';
                this.liveAnnouncer.announce('Erro grave na importação: ' + this.erro, 'assertive');
                this.cdr.markForCheck();
                return; // Interrompe o loop
            }
        }

        // Concluído com sucesso (mesmo que com erros de linha)
        this.faseProcessamento = 'concluido';
        this.processando = false;
        this.resultado = {
            importados: consolidadosImportados,
            ignorados: consolidadosIgnorados,
            erros: consolidadosErros
        };

        if (consolidadosImportados > 0) {
            this.liveAnnouncer.announce(`Importação concluída. ${consolidadosImportados} aluno(s) importado(s) com sucesso.`, 'assertive');
            this.toast.sucesso(`${consolidadosImportados} aluno(s) importado(s) com sucesso!`);
            this.beneficiariosService.limparCache();
        } else {
            this.liveAnnouncer.announce('Importação concluída, mas nenhum aluno novo foi importado.', 'assertive');
        }
        this.cdr.markForCheck();
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

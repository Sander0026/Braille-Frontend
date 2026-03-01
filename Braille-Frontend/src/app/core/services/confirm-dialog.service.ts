import { Injectable, signal } from '@angular/core';

export interface ConfirmDialogData {
    titulo?: string;
    mensagem: string;
    textoBotaoConfirmar?: string;
    textoBotaoCancelar?: string;
    tipo?: 'danger' | 'warning' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
    /** Dados do dialog atual (null = fechado) */
    readonly dialogData = signal<ConfirmDialogData | null>(null);

    private resolveCallback: ((result: boolean) => void) | null = null;

    /**
     * Abre o dialog de confirmação e retorna uma Promise<boolean>.
     * true = usuário confirmou | false = usuário cancelou
     */
    confirmar(dados: ConfirmDialogData): Promise<boolean> {
        return new Promise((resolve) => {
            this.resolveCallback = resolve;
            this.dialogData.set(dados);
        });
    }

    /** Chamado pelo componente ao confirmar */
    _confirmar(): void {
        this.dialogData.set(null);
        this.resolveCallback?.(true);
        this.resolveCallback = null;
    }

    /** Chamado pelo componente ao cancelar */
    _cancelar(): void {
        this.dialogData.set(null);
        this.resolveCallback?.(false);
        this.resolveCallback = null;
    }
}

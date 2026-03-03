import { Injectable, signal, computed, inject, NgZone } from '@angular/core';

export type ToastTipo = 'sucesso' | 'erro' | 'aviso' | 'info';

export interface Toast {
    id: number;
    mensagem: string;
    tipo: ToastTipo;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    private ngZone = inject(NgZone);
    private _toasts = signal<Toast[]>([]);
    readonly toasts = computed(() => this._toasts());

    private nextId = 0;

    mostrar(mensagem: string, tipo: ToastTipo = 'sucesso', duracaoMs = 3500): void {
        const id = ++this.nextId;

        // Isola completamente do Change Detection do Angular (Zone.js)
        this.ngZone.runOutsideAngular(() => {
            // Atualiza o signal (vai engatilhar o componente Toast de qualquer forma, 
            // mas sem explodir a verificação síncrona do componente pai)
            this._toasts.update(lista => [...lista, { id, mensagem, tipo }]);

            setTimeout(() => {
                this.remover(id);
            }, duracaoMs);
        });
    }

    sucesso(mensagem: string): void { this.mostrar(mensagem, 'sucesso'); }
    erro(mensagem: string): void { this.mostrar(mensagem, 'erro', 5000); }
    aviso(mensagem: string): void { this.mostrar(mensagem, 'aviso'); }
    info(mensagem: string): void { this.mostrar(mensagem, 'info'); }

    remover(id: number): void {
        this.ngZone.runOutsideAngular(() => {
            this._toasts.update(lista => lista.filter(t => t.id !== id));
        });
    }
}

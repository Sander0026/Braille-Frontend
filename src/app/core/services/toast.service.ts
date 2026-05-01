import { Injectable, signal, computed, inject, NgZone } from '@angular/core';
import { AriaLivePoliteness, LiveAnnouncer } from '@angular/cdk/a11y';

export type ToastTipo = 'sucesso' | 'erro' | 'aviso' | 'info';

export interface Toast {
    id: number;
    mensagem: string;
    tipo: ToastTipo;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    private readonly ngZone = inject(NgZone);
    private readonly liveAnnouncer = inject(LiveAnnouncer);
    private _toasts = signal<Toast[]>([]);
    readonly toasts = computed(() => this._toasts());

    private nextId = 0;

    mostrar(mensagem: string, tipo: ToastTipo = 'sucesso', duracaoMs = 6000): void {
        const id = ++this.nextId;
        this.anunciarMensagem(mensagem, tipo);

        // Isola completamente do Change Detection do Angular (Zone.js)
        this.ngZone.runOutsideAngular(() => {
            this._toasts.update(lista => [...lista, { id, mensagem, tipo }]);

            setTimeout(() => {
                this.remover(id);
            }, duracaoMs);
        });
    }

    sucesso(mensagem: string): void { this.mostrar(mensagem, 'sucesso'); }
    erro(mensagem: string): void { this.mostrar(mensagem, 'erro', 8000); }
    aviso(mensagem: string): void { this.mostrar(mensagem, 'aviso'); }
    info(mensagem: string): void { this.mostrar(mensagem, 'info'); }

    remover(id: number): void {
        this.ngZone.runOutsideAngular(() => {
            this._toasts.update(lista => lista.filter(t => t.id !== id));
        });
    }

    private anunciarMensagem(mensagem: string, tipo: ToastTipo): void {
        const politeness: AriaLivePoliteness = tipo === 'erro' ? 'assertive' : 'polite';
        const prefixo = this.labelTipo(tipo);
        this.liveAnnouncer.announce(`${prefixo}: ${mensagem}`, politeness);
    }

    private labelTipo(tipo: ToastTipo): string {
        switch (tipo) {
            case 'sucesso': return 'Sucesso';
            case 'erro': return 'Erro';
            case 'aviso': return 'Aviso';
            case 'info': return 'Informacao';
        }
    }
}

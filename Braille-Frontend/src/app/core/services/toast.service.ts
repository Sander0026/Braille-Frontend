import { Injectable, signal, computed, inject, NgZone } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';

export type ToastTipo = 'sucesso' | 'erro' | 'aviso' | 'info';

export interface Toast {
    id: number;
    mensagem: string;
    tipo: ToastTipo;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    private ngZone = inject(NgZone);
    private liveAnnouncer = inject(LiveAnnouncer);
    private _toasts = signal<Toast[]>([]);
    readonly toasts = computed(() => this._toasts());

    private nextId = 0;

    mostrar(mensagem: string, tipo: ToastTipo = 'sucesso', duracaoMs = 6000): void {
        const id = ++this.nextId;

        // Narrar via ARIA Live Region para leitores de tela (NVDA, VoiceOver, JAWS)
        // 'assertive' para erros: interrompe o leitor de tela imediatamente
        // 'polite' para o restante: narra quando o leitor terminar a sentença atual
        const politeness = tipo === 'erro' ? 'assertive' : 'polite';
        this.liveAnnouncer.announce(mensagem, politeness);

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
}

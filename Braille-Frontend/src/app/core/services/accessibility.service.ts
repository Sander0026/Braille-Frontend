import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type FonteSize = 'padrao' | 'grande' | 'extragrande';

@Injectable({ providedIn: 'root' })
export class AccessibilityService {
    private readonly LS_CONTRASTE = 'a11y_alto_contraste';
    private readonly LS_FONTE = 'a11y_tamanho_fonte';

    private _altoContraste = new BehaviorSubject<boolean>(false);
    private _fonteSize = new BehaviorSubject<FonteSize>('padrao');

    readonly altoContraste$ = this._altoContraste.asObservable();
    readonly fonteSize$ = this._fonteSize.asObservable();

    constructor() {
        this.restaurarPreferencias();
    }

    private restaurarPreferencias(): void {
        const contraste = localStorage.getItem(this.LS_CONTRASTE) === 'true';
        const fonte = (localStorage.getItem(this.LS_FONTE) as FonteSize) || 'padrao';
        this.aplicarContraste(contraste);
        this.aplicarFonte(fonte);
    }

    toggleAltoContraste(): void {
        const novoValor = !this._altoContraste.value;
        this.aplicarContraste(novoValor);
        localStorage.setItem(this.LS_CONTRASTE, String(novoValor));
    }

    setFonte(tamanho: FonteSize): void {
        this.aplicarFonte(tamanho);
        localStorage.setItem(this.LS_FONTE, tamanho);
    }

    private aplicarContraste(ativo: boolean): void {
        this._altoContraste.next(ativo);
        const html = document.documentElement;
        if (ativo) {
            html.classList.add('alto-contraste');
        } else {
            html.classList.remove('alto-contraste');
        }
    }

    private aplicarFonte(tamanho: FonteSize): void {
        this._fonteSize.next(tamanho);
        const html = document.documentElement;
        html.classList.remove('fonte-grande', 'fonte-extragrande');
        if (tamanho === 'grande') html.classList.add('fonte-grande');
        if (tamanho === 'extragrande') html.classList.add('fonte-extragrande');
        // Ajusta o font-size raiz para que os rems cresçam proporcionalmente
        const tamanhos: Record<FonteSize, string> = {
            padrao: '16px',
            grande: '19px',
            extragrande: '22px'
        };
        html.style.fontSize = tamanhos[tamanho];
    }

    get isAltoContraste(): boolean {
        return this._altoContraste.value;
    }

    get fonteAtual(): FonteSize {
        return this._fonteSize.value;
    }
}

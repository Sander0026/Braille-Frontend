import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type FonteSize = 'padrao' | 'grande' | 'extragrande';

@Injectable({ providedIn: 'root' })
export class AccessibilityService {
    private readonly document = inject(DOCUMENT);
    private readonly platformId = inject(PLATFORM_ID);
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
        if (!this.isBrowser) return;
        const contraste = localStorage.getItem(this.LS_CONTRASTE) === 'true';
        const fonte = (localStorage.getItem(this.LS_FONTE) as FonteSize) || 'padrao';
        this.aplicarContraste(contraste);
        this.aplicarFonte(fonte);
    }

    toggleAltoContraste(): void {
        const novoValor = !this._altoContraste.value;
        this.aplicarContraste(novoValor);
        if (this.isBrowser) {
            localStorage.setItem(this.LS_CONTRASTE, String(novoValor));
        }
    }

    setFonte(tamanho: FonteSize): void {
        this.aplicarFonte(tamanho);
        if (this.isBrowser) {
            localStorage.setItem(this.LS_FONTE, tamanho);
        }
    }

    private aplicarContraste(ativo: boolean): void {
        this._altoContraste.next(ativo);
        const html = this.document?.documentElement;
        if (!html) return;
        if (ativo) {
            html.classList.add('alto-contraste');
        } else {
            html.classList.remove('alto-contraste');
        }
    }

    private aplicarFonte(tamanho: FonteSize): void {
        this._fonteSize.next(tamanho);
        const html = this.document?.documentElement;
        if (!html) return;
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

    private get isBrowser(): boolean {
        return isPlatformBrowser(this.platformId);
    }

    get isAltoContraste(): boolean {
        return this._altoContraste.value;
    }

    get fonteAtual(): FonteSize {
        return this._fonteSize.value;
    }
}

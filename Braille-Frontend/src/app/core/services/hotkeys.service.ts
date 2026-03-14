import { Injectable, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { fromEvent, Subject, Subscription } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { ToastService } from './toast.service';

export interface HotkeyAction {
    combo: string; // Ex: 'alt.n'
    description: string;
    action: () => void;
}

@Injectable({
    providedIn: 'root'
})
export class HotkeysService implements OnDestroy {
    private subscription: Subscription = new Subscription();
    private hotkeys = new Map<string, HotkeyAction>();

    // Evento que pode ser escutado pelos componentes (ex: para abrir o modal de atalhos 'Alt+H')
    public onHelpRequested$ = new Subject<void>();

    // Evento específico para abrir modal de novo aluno da tela de alunos (para nâo poluir o Router se precisar de modal)
    public onNovoAlunoRequested$ = new Subject<void>();

    constructor(
        @Inject(PLATFORM_ID) private platformId: Object,
        private router: Router,
        private toast: ToastService
    ) {
        if (isPlatformBrowser(this.platformId)) {
            this.initDefaultHotkeys();
            this.listenToKeyboard();
        }
    }

    private initDefaultHotkeys() {
        // Alt + N: Novo Aluno
        this.addHotkey({
            combo: 'alt.n',
            description: 'Novo Cadastro de Aluno',
            action: () => {
                this.router.navigate(['/admin/alunos/cadastro']);
            }
        });

        // Alt + O: Oficinas
        this.addHotkey({
            combo: 'alt.o',
            description: 'Ir para Oficinas/Turmas',
            action: () => this.router.navigate(['/admin/turmas'])
        });

        // Alt + F: Frequências
        this.addHotkey({
            combo: 'alt.f',
            description: 'Ir para Chamada (Frequências)',
            action: () => this.router.navigate(['/admin/frequencias'])
        });

        // Alt + H: Ajuda / Lista de Atalhos
        this.addHotkey({
            combo: 'alt.h',
            description: 'Mostrar Lista de Atalhos',
            action: () => this.onHelpRequested$.next()
        });

        // Alt + D: Dashboard
        this.addHotkey({
            combo: 'alt.d',
            description: 'Ir para o Dashboard',
            action: () => this.router.navigate(['/admin/dashboard'])
        });
    }

    public addHotkey(hotkey: HotkeyAction) {
        this.hotkeys.set(hotkey.combo.toLowerCase(), hotkey);
    }

    public getRegisteredHotkeys(): HotkeyAction[] {
        return Array.from(this.hotkeys.values());
    }

    private listenToKeyboard() {
        this.subscription.add(
            fromEvent<KeyboardEvent>(document, 'keydown').pipe(
                filter(event => this.isHotkey(event)),
                filter(event => !this.isInsideInputForm(event)), // Evita capturar Alt combos dentro de textareas (se existirem combos comuns)
                tap(event => {
                    const comboStr = this.getComboString(event);
                    const hotkey = this.hotkeys.get(comboStr);

                    if (hotkey) {
                        event.preventDefault(); // Evita comportamento nativo do browser como menus
                        hotkey.action();
                        // Feedback discreto caso mude repentinamente
                        if (comboStr !== 'alt.h') {
                            this.toast.sucesso(`Atalho executado: ${hotkey.description}`);
                        }
                    }
                })
            ).subscribe()
        );
    }

    private isHotkey(event: KeyboardEvent): boolean {
        return event.altKey && !event.ctrlKey && !event.shiftKey && !event.metaKey;
    }

    private getComboString(event: KeyboardEvent): string {
        let key = event.key.toLowerCase();
        // Normalizar espaços ou teclas especiais se houver
        if (key === ' ') key = 'space';
        return `alt.${key}`;
    }

    private isInsideInputForm(event: KeyboardEvent): boolean {
        const target = event.target as HTMLElement;
        if (!target) return false;

        const tagName = target.tagName.toLowerCase();
        const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
        const isContentEditable = target.isContentEditable;

        // Se o usuário estiver focando num input de busca, nós não queremos impedir que ele digite símbolos ou acentos complexos (como Alt Gr que aciona altKey no windows)
        // Para simplificar, desabilitamos os atalhos diários enquanto ele tem o cursor num form, para evitar colisões mortais de texto
        return isInput || isContentEditable;
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}

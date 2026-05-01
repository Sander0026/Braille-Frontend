import { Directive, inject, DestroyRef } from '@angular/core';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { ComponenteComDescarte } from '../../core/interfaces/componente-com-descarte.interface';

/**
 * Padrão DevSecOps Funcional (Composição sobre Herança - Angular 16+)
 * Utilize esta função injetável em novos componentes de formulário em vez da classe abstrata.
 */
export function injectFormDescarte(isDirtyFn: () => boolean) {
    const confirmDialog = inject(ConfirmDialogService);
    const destroyRef = inject(DestroyRef);

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
        if (isDirtyFn()) {
            event.preventDefault();
            event.returnValue = ''; 
            return '';
        }
        return undefined;
    };

    // Assina e Destrói Passivamente (Garante Memória Limpa)
    window.addEventListener('beforeunload', onBeforeUnload);
    destroyRef.onDestroy(() => window.removeEventListener('beforeunload', onBeforeUnload));

    return async (): Promise<boolean> => {
        if (!isDirtyFn()) return true;

        return confirmDialog.confirmar({
            titulo: 'Descartar alterações?',
            mensagem: 'Você tem dados preenchidos que não foram salvos. Deseja realmente sair e descartar as alterações?',
            textoBotaoConfirmar: 'Sair sem salvar',
            textoBotaoCancelar: 'Continuar editando',
            tipo: 'warning'
        });
    };
}

/**
 * Classe Abstrata Legada Refatorada (Mantida para Zero Regressions).
 * @deprecated Prefira utilizar a função injectFormDescarte() para permitir múltiplas heranças.
 */
@Directive()
export abstract class BaseFormDescarte implements ComponenteComDescarte {
    protected confirmDialogService = inject(ConfirmDialogService);
    
    constructor() {
        const destroyRef = inject(DestroyRef);
        const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
            if (this.isFormDirty()) {
                event.preventDefault();
                event.returnValue = ''; 
                return '';
            }
            return undefined;
        };

        window.addEventListener('beforeunload', beforeUnloadHandler);
        
        // Remoção manual do Listener antes do DOM Element ser expurgado
        destroyRef.onDestroy(() => {
            window.removeEventListener('beforeunload', beforeUnloadHandler);
        });
    }

    /**
     * O componente filho deve implementar este método para
     * informar se existem dados não salvos (ex: formTocado && !salvo).
     */
    abstract isFormDirty(): boolean;

    /**
     * Método chamado pelo DescarteGuard.
     * Retorna true se puder descartar ou se os dados já foram salvos.
     * Caso contrário, exibe o modal de confirmação.
     */
    async podeDescartar(): Promise<boolean> {
        if (!this.isFormDirty()) {
            return true;
        }

        return this.confirmDialogService.confirmar({
            titulo: 'Descartar alterações?',
            mensagem: 'Você tem dados preenchidos que não foram salvos. Deseja realmente sair e descartar as alterações?',
            textoBotaoConfirmar: 'Sair sem salvar',
            textoBotaoCancelar: 'Continuar editando',
            tipo: 'warning'
        });
    }
}

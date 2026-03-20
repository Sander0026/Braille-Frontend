import { Directive, HostListener, inject } from '@angular/core';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { ComponenteComDescarte } from '../../core/interfaces/componente-com-descarte.interface';

@Directive()
export abstract class BaseFormDescarte implements ComponenteComDescarte {
    protected confirmDialogService = inject(ConfirmDialogService);

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

    /**
     * Previne o fechamento/recarregamento da aba do navegador nativo.
     * Apenas emite o alerta genérico do navegador.
     */
    @HostListener('window:beforeunload', ['$event'])
    onBeforeUnload(event: BeforeUnloadEvent) {
        if (this.isFormDirty()) {
            event.preventDefault();
            // Padrão antigo que a maioria dos navegadores ainda requer:
            event.returnValue = ''; 
            return '';
        }
        return undefined;
    }
}

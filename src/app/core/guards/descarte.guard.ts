import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ComponenteComDescarte } from '../interfaces/componente-com-descarte.interface';

export const descarteGuard: CanDeactivateFn<ComponenteComDescarte> = async (component) => {
    if (component && component.podeDescartar) {
        return await component.podeDescartar();
    }
    return true;
};

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ModelosLista } from './modelos-lista/modelos-lista';
import { ModelosForm } from './modelos-form/modelos-form';

const routes: Routes = [
  { path: '', component: ModelosLista },
  { path: 'novo', component: ModelosForm },
  { path: 'editar/:id', component: ModelosForm }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ModelosCertificadosRoutingModule { }

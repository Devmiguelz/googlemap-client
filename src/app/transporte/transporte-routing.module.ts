import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RutaComponent } from './ruta/ruta.component';
import { ReporterutaComponent } from './reporteruta/reporteruta.component';


const routes: Routes = [
  {
    path: '',
    redirectTo: 'ruta'
  },
  {
    path: 'ruta',
    component: RutaComponent
  },
  {
    path: 'reporteruta',
    component: ReporterutaComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TransporteRoutingModule { }

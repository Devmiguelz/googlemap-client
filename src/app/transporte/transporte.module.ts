import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TransporteRoutingModule } from './transporte-routing.module';
import { RutaComponent } from './ruta/ruta.component';
import { ReporterutaComponent } from './reporteruta/reporteruta.component';


@NgModule({
  declarations: [RutaComponent, ReporterutaComponent],
  imports: [
    CommonModule,
    TransporteRoutingModule
  ]
})
export class TransporteModule { }

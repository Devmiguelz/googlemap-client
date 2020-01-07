import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TransporteRoutingModule } from './transporte-routing.module';
import { RutaComponent } from './ruta/ruta.component';
import { ReporterutaComponent } from './reporteruta/reporteruta.component';
import { FormsModule } from '@angular/forms';
import { NgSelect2Module } from 'ng-select2';


@NgModule({
  declarations: [RutaComponent, ReporterutaComponent],
  imports: [
    CommonModule,
    FormsModule,
    TransporteRoutingModule,
    NgSelect2Module
  ]
})
export class TransporteModule { }

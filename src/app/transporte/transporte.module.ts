import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiSwitchModule } from 'ngx-toggle-switch';
import { BsDatepickerModule, DatepickerModule } from 'ngx-bootstrap/datepicker';
import { TransporteRoutingModule } from './transporte-routing.module';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';
import { AlertModule } from 'ngx-bootstrap/alert';

import { RutaComponent } from './ruta/ruta.component';
import { ReporterutaComponent } from './reporteruta/reporteruta.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelect2Module } from 'ng-select2';


@NgModule({
  declarations: [RutaComponent, ReporterutaComponent],
  imports: [
    CommonModule,
    FormsModule,
    ProgressbarModule.forRoot(),
    AlertModule.forRoot(),
    ReactiveFormsModule,
    DatepickerModule.forRoot(),
    BsDatepickerModule.forRoot(),
    TransporteRoutingModule,
    NgSelect2Module,
    UiSwitchModule
  ]
})
export class TransporteModule { }

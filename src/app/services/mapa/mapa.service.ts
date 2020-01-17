import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MapaService {

  private servicio: string = environment.URL_SERVICIOS;
  private url: string;
  private headers: HttpHeaders;

  colegio: string = 'altamira';
  

  constructor(
    public http: HttpClient
  ) { }

  cargarAnioActivo() {
     this.url = this.servicio + '/anio/anioactivo/' + this.colegio;
    return this.http.get( this.url ); 
  }

  cargarAnios() {
    this.url =  this.servicio + '/anio/cargaranios/' + this.colegio;
    return this.http.get( this.url ); 
  }

  cargarVehiculoRuta( codanio: number, dia: number, flujo: string ) {
    this.url =  this.servicio + '/ruta/vehiculoruta';
    return this.http.get(`${ this.url }/${ this.colegio }/${ codanio }/${ dia }/'${ flujo }'`); 
  }

  cargarRutasxAnio( codanio : string ) {
    this.url =  this.servicio + '/ruta/rutasxanio';
    return this.http.get( `${this.url}/${ this.colegio }/${codanio}` );
  }

  cargarEstudianteTransporte( codanio: string, mes: string, codvehiculoruta: string, fecha: string, flujo: string ) {
    
    this.url =  this.servicio + '/ruta/estudiante/transporte';

    let colegio = this.colegio;

    const body = { codanio, mes, codvehiculoruta, fecha, flujo, colegio };

    this.headers = new HttpHeaders().set('Accept','application/json');

    return this.http.post(this.url, body, { headers: this.headers }).toPromise();
  }

  activarRutaTransporte( codruta: number, flujo: string ) {

    this.url =  this.servicio + '/ruta/activar';

    const body = { codruta, flujo };

    return this.http.post(this.url, body);

  }

  cargarRutaTransporte( codruta: number, flujo: string ) {

    this.url =  this.servicio + '/ruta/cargarpuntos';

    return this.http.get(`${ this.url }/${ codruta }/${ flujo }`);

  }

  cerrarRutaTransporte( codruta: number, flujo: string ) {

    this.url =  this.servicio + '/ruta/cerrar';

    const body = { codruta, flujo };

    const httpOptions = {
      headers: new HttpHeaders({'Content-Type': 'application/json'}),
      body
    };

    return this.http.delete(`${ this.url }`, httpOptions);

  }


}

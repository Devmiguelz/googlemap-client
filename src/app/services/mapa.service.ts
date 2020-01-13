import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MapaService {

  private url: string = "";

  constructor(
    public http: HttpClient
  ) { }

  cargarMarcadores() {
    this.url = environment.URL_SERVICIOS + '/ruta/marcadores';
    return this.http.get( this.url );
  }

  cargarRutas() {
    this.url = environment.URL_SERVICIOS + '/ruta/rutas';
    return this.http.get( this.url );
  }

  cargarRutasMarcador(id: string) {
    this.url = environment.URL_SERVICIOS + '/ruta/marcador';

    const httpOptions = {
      headers: new HttpHeaders( {
            'Accept': 'application/json'
          }),
    };

    return this.http.get(`${this.url}/${id}`, httpOptions);
  }

  limpiarRutaMarcador( id: string ) {
    this.url = environment.URL_SERVICIOS + '/ruta/eliminarmarcador';

    const httpOptions = {
      headers: new HttpHeaders( {
            'Accept': 'application/json'
          }),
    };

    return this.http.delete(`${this.url}/${id}`, httpOptions);
  }

  limpiarRutas() {
    this.url = environment.URL_SERVICIOS + '/ruta/eliminarruta';
    return this.http.delete( this.url );
  }

  cargarAnioActivo() {
    this.url = environment.URL_SERVICIOS + '/anio/anioactivo';
    return this.http.get( this.url ); 
  }

  cargarAnios() {
    this.url = environment.URL_SERVICIOS + '/anio/cargaranios';
    return this.http.get( this.url ); 
  }

  cargarVehiculoRuta( codanio: number, dia: number, flujo: string ) {
    this.url = environment.URL_SERVICIOS + '/ruta/vehiculoruta';
    return this.http.get(`${ this.url }/${ codanio }/${ dia }/'${ flujo }'`); 
  }

  cargarRutasxAnio( codanio : string ) {
    this.url = environment.URL_SERVICIOS + '/ruta/rutasxanio';
    return this.http.get( `${this.url}/${codanio}` );
  }

  cargarMultiplesRutas( arrayRutas: string[] ) {
    this.url = environment.URL_SERVICIOS + '/ruta/rutasmultiples';

    const body = { 'arrayrutas': arrayRutas };

    const httpOptions = {
      headers: new HttpHeaders({'Content-Type': 'application/json'}),
      body
    };

    return this.http.post(this.url, httpOptions);
  }

  cargarEstudianteTransporte( codanio: string, mes: string, codvehiculoruta: string, fecha: string, flujo: string ) {
    
    this.url = environment.URL_SERVICIOS + '/ruta/estudiante/transporte';

    const body = { codanio, mes, codvehiculoruta, fecha, flujo };

    return this.http.post(this.url, body).toPromise();
  }

  activarRutaTransporte( codruta: number, flujo: string ) {

    this.url = environment.URL_SERVICIOS + '/ruta/activar';

    const body = { codruta, flujo };

    return this.http.post(this.url, body);

  }

  cargarRutaTransporte( codruta: number, flujo: string ) {

    this.url = environment.URL_SERVICIOS + '/ruta/cargarpuntos';

    return this.http.get(`${ this.url }/${ codruta }/${ flujo }`);

  }

  cerrarRutaTransporte( codruta: number, flujo: string ) {

    this.url = environment.URL_SERVICIOS + '/ruta/cerrar';

    const body = { codruta, flujo };

    const httpOptions = {
      headers: new HttpHeaders({'Content-Type': 'application/json'}),
      body
    };

    return this.http.delete(this.url, httpOptions);

  }


}

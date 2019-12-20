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
    this.url = environment.URL_SERVICIOS + '/marcadores';
    return this.http.get( this.url );
  }

  cargarRutas() {
    this.url = environment.URL_SERVICIOS + '/rutas';
    return this.http.get( this.url );
  }

  cargarRutasMarcador(id: string) {
    this.url = environment.URL_SERVICIOS + '/rutas/marcador';

    const httpOptions = {
      headers: new HttpHeaders( {
            'Accept': 'application/json'
          }),
    };

    return this.http.get(`${this.url}/${id}`, httpOptions);
  }

  limpiarRutaMarcador( id: string ) {
    this.url = environment.URL_SERVICIOS + '/eliminar/rutamarcador';

    const httpOptions = {
      headers: new HttpHeaders( {
            'Accept': 'application/json'
          }),
    };

    return this.http.delete(`${this.url}/${id}`, httpOptions);
  }

  limpiarRutas() {
    this.url = environment.URL_SERVICIOS + '/eliminar/rutas';
    return this.http.delete( this.url );
  }

}

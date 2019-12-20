import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Ubicacion } from '../../model/ubicacion';
import { MapaService } from '../../services/mapa.service';
import { WebsocketService } from '../../services/websocket.service';
import { PuntoUbicacion } from '../../model/punto';

@Component({
  selector: 'app-reporteruta',
  templateUrl: './reporteruta.component.html',
  styleUrls: ['./reporteruta.component.css']
})
export class ReporterutaComponent implements OnInit, AfterViewInit {

  // ViewChild se usa para obtener un elemento de DOM
  @ViewChild('reporteRuta', { static: false }) elementoMapa: ElementRef;

  mapaReporte: google.maps.Map;
  ubicaciones: Ubicacion[] = [];
  listaDePunto: PuntoUbicacion[] = [];
  listaInfoWindows: google.maps.InfoWindow[] = [];
  rutaPolyline: google.maps.Polyline;

  constructor(
    private mapaService: MapaService,
    private websocketService: WebsocketService
  ) { }

  ngOnInit() { }

  ngAfterViewInit() {
    this.cargarMapaReporte();
    this.cargarRutaGuardada();
    this.escucharEventosRuta();
    this.pintarRuta();
  }

  escucharEventosRuta() {
    // escuchar-ruta-reporte
    this.websocketService.escucharSocket('escuchar-ruta-repote')
      .subscribe( ( puntoUbicacion: Ubicacion ) => {

        if(this.listaDePunto.length == 0){
          this.agregarMarcador( puntoUbicacion, 'Punto de Salida' );
        }
        // Agregamos los puntos nuevos
        this.listaDePunto.push( {lat:puntoUbicacion.latitud,lng: puntoUbicacion.longitud} )

        // mandamos a pintar la linea
        this.pintarRuta()

        this.centrarMapa( puntoUbicacion.latitud, puntoUbicacion.longitud );
    });
  }

  cargarRutaGuardada() {
    this.mapaService.cargarRutas().subscribe( ( listaUbicacion: Ubicacion[] ) => {

      const size = listaUbicacion.length;

      if ( size > 0 ) {

        this.agregarMarcador( listaUbicacion[0], 'Punto de Salida' );
        // Recorremos cada uno de los puntos y lo llenamos
        for (const i in listaUbicacion) {
          this.listaDePunto.push( { lat: listaUbicacion[i].latitud, lng: listaUbicacion[i].longitud } );
        }

        this.centrarMapa( listaUbicacion[ size - 1 ].latitud, listaUbicacion[ size - 1 ].longitud );
        this.agregarMarcador( listaUbicacion[ size - 1 ], 'Punto de Llegada' );
        // mandamos a pintar la linea
        this.pintarRuta()
      }
    });
  }

  centrarMapa(latitud: number, longitud: number) {
    const latLng = new google.maps.LatLng( latitud, longitud );
    this.mapaReporte.setCenter( latLng );
  }

  pintarRuta() {

    this.rutaPolyline = new google.maps.Polyline({
      path: this.listaDePunto,
      geodesic: true,
      strokeColor: '#4CAF50',
      strokeOpacity: 1.0,
      strokeWeight: 4
    });

    this.rutaPolyline.setMap(this.mapaReporte);
  }

  limpiarRutaMapa() {
    
    this.mapaService.limpiarRutas().subscribe( ( resp: any ) => {
      if( resp.ok == true){
        console.log('Rutas Elminadas');
        this.rutaPolyline.setMap( null );
      }
    });
  }

  cargarMapaReporte() {

    // De esta forma generamos una ubicacion para el mapa
    const ubicacionMapa = new google.maps.LatLng(10.9740231, -74.8044078);

    /*
      Documentacion: https://developers.google.com/maps/documentation/javascript/adding-a-google-map
    */

    // configuramos posicion, zoom, controles, ....
    const opciones: google.maps.MapOptions = {
      center: ubicacionMapa,
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    // construimos le mapa
    this.mapaReporte = new google.maps.Map( this.elementoMapa.nativeElement, opciones);

  }

  agregarMarcador(ubicacion: Ubicacion, titulo: string) {

    // Primero ubicamos la posicion del marcador
    const ubicacionMarcador = new google.maps.LatLng( ubicacion.latitud, ubicacion.longitud );

    /* Documentacion: https://developers.google.com/maps/documentation/javascript/marker-clustering */

    // creamos el marcador
    const nuevoMarcador = new google.maps.Marker({
      map: this.mapaReporte,                 // Aqui le pasamos la referecia del mapa que creamos
      animation: google.maps.Animation.DROP, // Puntico
      position: ubicacionMarcador,           // Asignamos la ubicacion del marcardor
      draggable: false,                      // Permite que se pueda mover
      title: titulo
    });

    const contenido = `<b>${ titulo }</b>`;
    const infoWindows = new google.maps.InfoWindow({
      content: contenido
    });

    // para tener una referencia de todos los InfoWindows para poder cerrarlos
    this.listaInfoWindows.push( infoWindows );

    google.maps.event.addDomListener( nuevoMarcador, 'click', () => {

      // cerramos todos los InfoWindows
      this.listaInfoWindows.forEach( info => { info.close(); });

      // Abrimos solo
      infoWindows.open( this.mapaReporte, nuevoMarcador );

    });

  }

}

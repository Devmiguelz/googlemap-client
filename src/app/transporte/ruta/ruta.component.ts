import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Ubicacion } from '../../model/ubicacion';
import { MapaService } from '../../services/mapa.service';
import { WebsocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-ruta',
  templateUrl: './ruta.component.html',
  styleUrls: ['./ruta.component.css']
})
export class RutaComponent implements OnInit, AfterViewInit {

  // ViewChild se usa para obtener un elemento de DOM
  @ViewChild('mapa', { static: false }) elementoMapa: ElementRef;

  mapa: google.maps.Map;
  listaMarcadores: google.maps.Marker[] = [];
  listaInfoWindows: google.maps.InfoWindow[] = [];

  ubicaciones: Ubicacion[] = [];

  constructor(
    private mapaService: MapaService,
    private websocketService: WebsocketService
  ) { }

  ngOnInit() { }

  ngAfterViewInit() {
    this.mapaService.cargarMarcadores().subscribe( (marcadores: Ubicacion[]) => {
      this.ubicaciones = marcadores;
      this.cargarMapa();
    });
    this.escucharEventosSocket();
  }

  escucharEventosSocket() {

    // escuchar-marcador-nuevo
    this.websocketService.escucharSocket('escuchar-marcador-nuevo')
      .subscribe( (nuevoMarcador: Ubicacion) => {
        this.agregarMarcador( nuevoMarcador );
    });

    // escuchar-marcardor-mover
    this.websocketService.escucharSocket('escuchar-marcador-mover')
      .subscribe( (marcadorMover: Ubicacion) => {

        console.log(marcadorMover);

        for ( const i in this.listaMarcadores) {

          if ( this.listaMarcadores[i].get('id') === marcadorMover.id ) {

            const posicion = new google.maps.LatLng( marcadorMover.latitud, marcadorMover.longitud );

            this.listaMarcadores[i].setPosition( posicion );

            break;
          }
        }
    });

    // escuchar-marcardor-borrar
    this.websocketService.escucharSocket('escuchar-marcador-borrar')
      .subscribe( (id: string) => {
        this.listaMarcadores.find(marcador => marcador.get('id') === id).setMap(null);
    });

  }

  cargarMapa() {
    // De esta forma generamos una ubicacion para el mapa
    const ubicacionMapa = new google.maps.LatLng(10.9740231, -74.8044078);

    /* Documentacion: https://developers.google.com/maps/documentation/javascript/adding-a-google-map */

    // configuramos posicion, zoom, controles, ....
    const opciones: google.maps.MapOptions = {
      center: ubicacionMapa,
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    // construimos le mapa
    this.mapa = new google.maps.Map( this.elementoMapa.nativeElement, opciones);

    /*  addListener agregar evento al mapa
        Documentacion: https://developers.google.com/maps/documentation/javascript/events
    */

    this.mapa.addListener('click', ( data: any ) => {

      const nuevoMarcador: Ubicacion = {
        nombre: 'nuevo-lugar',
        latitud: data.latLng.lat(),
        longitud: data.latLng.lng(),
        id: new Date().toISOString()
      };

      this.agregarMarcador( nuevoMarcador );

      // Emitir socket marcador nuevo
      this.websocketService.emitirSocket('emitir-marcador-nuevo', nuevoMarcador);

    });

    for ( const point of this.ubicaciones) {
      this.agregarMarcador( point );
    }
  }

  agregarMarcador(ubicacion: Ubicacion) {

    // Primero ubicamos la posicion del marcador
    const ubicacionMarcador = new google.maps.LatLng( ubicacion.latitud, ubicacion.longitud );

    /* Documentacion: https://developers.google.com/maps/documentation/javascript/marker-clustering */

    // creamos el marcador
    const nuevoMarcador = new google.maps.Marker({
      map: this.mapa,                        // Aqui le pasamos la referecia del mapa que creamos
      animation: google.maps.Animation.DROP, // Puntico
      position: ubicacionMarcador,           // Asignamos la ubicacion del marcardor
      draggable: true                        // Permite que se pueda mover
    });

    nuevoMarcador.set('id', ubicacion.id);

    // agregar el marcador a la lista
    this.listaMarcadores.push( nuevoMarcador );

    const contenido = `<b>${ ubicacion.nombre }</b>`;
    const infoWindows = new google.maps.InfoWindow({
      content: contenido
    });

    // para tener una referencia de todos los InfoWindows para poder cerrarlos
    this.listaInfoWindows.push( infoWindows );

    /*  addDomListener agrega evento a los elementos del mapa: dblclick, click, etc..
        Revisar documentacion : https://developers.google.com/maps/documentation/javascript/events
    */

    google.maps.event.addDomListener( nuevoMarcador, 'click', () => {

      // cerramos todos los InfoWindows
      this.listaInfoWindows.forEach( info => { info.close(); });

      // Abrimos solo
      infoWindows.open( this.mapa, nuevoMarcador );

    });

    google.maps.event.addDomListener( nuevoMarcador, 'dblclick', () => {
      nuevoMarcador.setMap( null );
      // Emitir evento socket borrar un marcador
      this.websocketService.emitirSocket('emitir-marcador-borrar', nuevoMarcador.get('id') );

    });

    google.maps.event.addDomListener( nuevoMarcador, 'drag', ( data: any ) => {

      const marcadorTemporal: Ubicacion = {
        latitud: data.latLng.lat(),
        longitud: data.latLng.lng(),
        nombre: ubicacion.nombre,
        id: nuevoMarcador.get('id')
      };
      
      // Emitir evento socket borrar un marcador
      this.websocketService.emitirSocket('emitir-marcador-mover', marcadorTemporal);

    });

  }
}

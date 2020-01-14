import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Ubicacion } from '../../model/ubicacion';
import { MapaService } from '../../services/mapa.service';
import { WebsocketService } from '../../services/websocket.service';
import { Select2OptionData } from 'ng-select2';
import { Options } from 'select2';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
declare var $: any;

@Component({
  selector: 'app-ruta',
  templateUrl: './ruta.component.html',
  styleUrls: ['./ruta.component.css']
})
export class RutaComponent implements OnInit, AfterViewInit {

  // ViewChild se usa para obtener un elemento de DOM
  @ViewChild('mapa', { static: false }) elementoMapa: ElementRef;

    // Select2 de la Rutas
  public dataRutas: Array<Select2OptionData>;  
  public options: Options;
  public arrayRutas: string[] = [];

  // Formulario Filtro
  public formFiltro: FormGroup;
  fechaInicial = new Date();
  filtroFlujo: string = '';

  // Visualizar ruta
  listaRutas: any[] = [];
  codAnioActivo:number = 0;

  // Control de Mapas
  listaMapaReporte: { codruta: number, mapa: google.maps.Map }[] = [];

  mapaTemporal: google.maps.Map;
  mapa: google.maps.Map;
  listaMarcadores: google.maps.Marker[] = [];
  listaInfoWindows: google.maps.InfoWindow[] = [];

  ubicaciones: Ubicacion[] = [];

  constructor(
    private _mapaService: MapaService,
    private _websocketService: WebsocketService,
    private _formBuilder: FormBuilder,
    private _datePipe: DatePipe
  ) { }

  ngOnInit() {
    this.cargarAnioActivo();
    this.buildFormFiltro();
   }

  ngAfterViewInit() {
    
  }

  cargarAnioActivo() {
    this._mapaService.cargarAnioActivo().subscribe( ( data: any ) => {
      if ( data.ok = true ){
        this.codAnioActivo = data.resp[0].cod;
      }
    });
  }

  buildFormFiltro() {
    this.formFiltro = this._formBuilder.group({
      fecha: [ this.fechaInicial, [ Validators.required ]],
      flujo: [ '', [ Validators.required ]],
    });
  }

  escucharEventosSocket() {

    // escuchar-marcardor-mover
    this._websocketService.escucharSocket('escuchar-marcador-mover')
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

  }

  filtrarFlujoRuta() {

    const filtro = this.formFiltro.value;
    this.filtroFlujo = filtro.flujo;
    const filtroFecha: Date = filtro.fecha;
    const dia = filtroFecha.getDay();

    this._mapaService.cargarVehiculoRuta( this.codAnioActivo, dia, this.filtroFlujo ).subscribe(( ruta: any ) =>{
      if( ruta.ok == true ) {
        this.listaRutas = ruta.resp;
      }
    });
    
  }

  cambiarEstado( ruta: any ) {

    const codruta = ruta.codruta;

    const buttom: HTMLElement = document.getElementById('btn-estado-' + codruta);

    if( this.listaMapaReporte.filter(mapa => mapa.codruta === codruta).length == 0 ) {
      this._mapaService.activarRutaTransporte( codruta, this.filtroFlujo ).subscribe((data:any) => {
        if( data.ok == true ) {
          buttom.classList.remove('btn-success');
          buttom.classList.add('btn-danger');
          buttom.textContent = 'Desactivar';
          this.cargarMapa( codruta, ruta.nroruta );
        }
      });
    }else{
      this._mapaService.cerrarRutaTransporte(codruta, this.filtroFlujo).subscribe((data:any) => {
        if( data.ok == true ) {
          buttom.classList.remove('btn-danger');
          buttom.classList.add('btn-success');
          buttom.textContent = 'Activar';
          this.cerrarMapa( codruta );
        }
      });
      
    }

  }

  cargarMapa( codruta: number, nombre: string ) {

    // De esta forma generamos una ubicacion para el mapa
    const ubicacionMapa = new google.maps.LatLng(10.969727719654152, -74.8088872968201);

    // configuramos posicion, zoom, controles, ....
    const opciones: google.maps.MapOptions = {
      center: ubicacionMapa,
      zoom: 15,
      disableDefaultUI: true,
      mapTypeId: google.maps.MapTypeId.ROADMAP
      };
      
    // obtenemos el id del div de esta Ruta
    const mapa: HTMLElement = document.getElementById('ruta-mapa-' + codruta);

    // construimos el mapa
    this.mapaTemporal = new google.maps.Map( mapa, opciones);

    this.agregarMarcador( codruta, nombre, this.mapaTemporal );

    // agregar a la lista para tenerlos temporal
    if( this.listaMapaReporte.length == 0 ){
      this.listaMapaReporte.push({ codruta: codruta, mapa: this.mapaTemporal });
    } else if( this.listaMapaReporte.filter(mapa => mapa.codruta === codruta).length == 0 ) {
      this.listaMapaReporte.push({ codruta: codruta, mapa: this.mapaTemporal });      
    } 

  }

  cerrarMapa( codruta: number ) {
    const mapa: HTMLElement = document.getElementById('ruta-mapa-' + codruta);
    mapa.innerHTML = '';
    this.listaMapaReporte = this.listaMapaReporte
      .filter(( mapa: { codruta: number, mapa: google.maps.Map }) => mapa.codruta !== codruta );
  }
 
  agregarMarcador( codruta: number, nombre: string, mapa: google.maps.Map ) {

    // De esta forma generamos una ubicacion para el mapa
    const ubicacionMarcador = new google.maps.LatLng(10.969727719654152, -74.8088872968201);

    /* Documentacion: https://developers.google.com/maps/documentation/javascript/marker-clustering */

    // creamos el marcador
    const nuevoMarcador = new google.maps.Marker({
      map: mapa,                        // Aqui le pasamos la referecia del mapa que creamos
      animation: google.maps.Animation.DROP, // Puntico
      position: ubicacionMarcador,           // Asignamos la ubicacion del marcardor
      draggable: true                        // Permite que se pueda mover
    });

    nuevoMarcador.set('id', codruta);

    // agregar el marcador a la lista
    this.listaMarcadores.push( nuevoMarcador );

    const infoWindows = new google.maps.InfoWindow({ 
      content: 'Inicio de Ruta',
    });

    /*  addDomListener agrega evento a los elementos del mapa: dblclick, click, etc..
        Revisar documentacion : https://developers.google.com/maps/documentation/javascript/events
    */

    google.maps.event.addDomListener( nuevoMarcador, 'click', () => {

      // Abrimos solo
      infoWindows.open( this.mapa, nuevoMarcador );

    });

    google.maps.event.addDomListener( nuevoMarcador, 'drag', ( data: any ) => {

      const marcadorTemporal: Ubicacion = {
        latitud: data.latLng.lat(),
        longitud: data.latLng.lng(),
        flujo: this.filtroFlujo,
        nombre: nombre,
        codruta: Number(nuevoMarcador.get('id'))
      };
      
      // Emitir evento socket borrar un marcador
      this._websocketService.emitirSocket('emit-marcador-ruta', marcadorTemporal);

    });

  }

  cerrarAllRutas() {
    for (const index in this.listaMapaReporte) {
      this.cerrarMapa( this.listaMapaReporte[index].codruta );
    }
  }
}

import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Ubicacion } from '../../model/ubicacion';
import { MapaService } from '../../services/mapa.service';
import { WebsocketService } from '../../services/websocket.service';

import { Select2OptionData } from 'ng-select2';
import { Options } from 'select2';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
declare var $: any;

@Component({
  selector: 'app-reporteruta',
  templateUrl: './reporteruta.component.html',
  styleUrls: ['./reporteruta.component.css']
})
export class ReporterutaComponent implements OnInit, AfterViewInit {

  // Select2 de la Rutas
  public dataRutas: Array<Select2OptionData>;  
  public options: Options;
  public arrayRutas: string[] = [];

  // Formulario Filtro
  public formFiltro: FormGroup;
  fechaInicial = new Date();
  filtroFlujo: string = '';
  
  // Formulario del filtro
  dataRutasTemp: any[] = [];
  listaRutas: any[] = [];
  listaAnios: any[] = [];
  codAnioActivo: string = '';

  // iconos del marcador
  iconBus: string = 'assets/Images/busescolar.png';
  iconStudent: string = 'assets/Images/studentmarker.png';

  // En esta lista tendremos la referencia de los mapas activos que estan en seguimiento
  listaMapaReporte: { 
    codruta: number, 
    flujo: string, 
    ruta: any[], 
    marcador: google.maps.Marker, 
    mapa: google.maps.Map 
    }[] = [];

  mapaTemporal: google.maps.Map;

  // se utiliza para pintar la ruta en el mapa
  rutaPolyline: google.maps.Polyline;

  constructor(
    private _mapaService: MapaService,
    private _websocketService: WebsocketService,
    private _formBuilder: FormBuilder,
    private _datePipe: DatePipe
  ) { }

  ngOnInit() { 

    this.dataRutas = [];

    this.options = {
      width: '100%',
      multiple: true,
      tags: true
    };

    this.cargarAnioActivo();
    this.buildFormFiltro();
    this.escucharEventosRuta();

  }

  ngAfterViewInit() {

  }

  buildFormFiltro() {
    this.formFiltro = this._formBuilder.group({
      fecha: [ this.fechaInicial, [ Validators.required ]],
      flujo: [ '', [ Validators.required ]],
    });
  }

  filtrarFlujoRuta() {

    const filtro = this.formFiltro.value;
    this.filtroFlujo = filtro.flujo;
    const filtroFecha: Date = filtro.fecha;
    const fecha = this._datePipe.transform(filtroFecha, 'dd-MM-yyyy'); // yyyy-dd-MM
    const dia = filtroFecha.getDay();
    const mes = ( filtroFecha.getMonth() + 1 ).toString();

    this._mapaService.cargarVehiculoRuta(Number(this.codAnioActivo), dia, this.filtroFlujo).subscribe(( ruta: any ) =>{
      if( ruta.ok == true ) {
        this.listaRutas = [];  // limpiamos la rutas
        for ( const index in ruta.resp ) {
          this._mapaService.cargarEstudianteTransporte(this.codAnioActivo, mes, ruta.resp[index].codvehiculoruta, fecha, this.filtroFlujo)
            .then((estudiante:any) => {
              
              // Cantidad de estudiantes
              ruta.resp[index].countEstu = estudiante.resp.length;
              // array datos estudiantes 
              ruta.resp[index].estudiantes = estudiante.resp;

              // array de alert
              ruta.resp[index].alerts = [];

              // estado del switch
              ruta.resp[index].seguimiento = false;

              // Progressbar value
              ruta.resp[index].progress = 0;

              this.listaRutas.push( ruta.resp[index] );
            });
        }
      }
      console.log( this.listaRutas );
    });

  }

  cargarAnioActivo() {
    this._mapaService.cargarAnioActivo().subscribe( ( data: any ) => {
      if ( data.ok = true ){
        this.codAnioActivo = data.resp[0].cod;
        this.cargarRutasSelect( this.codAnioActivo );
      }
    });
  }

  cargarRutasSelect(codanio: string){
    if( codanio !== '0' ) {
      this._mapaService.cargarRutasxAnio( codanio ).subscribe( ( data: any ) => {
        if ( data.ok == true ) {

          this.dataRutasTemp = [];

          data.resp.forEach( ( ruta: any ) => {
            this.dataRutasTemp.push({ id: ruta.cod, text: ruta.nroruta});
          });

          this.dataRutas = this.dataRutasTemp;

        }
      });
    }
  }

  cargarRutas(){
    if( this.arrayRutas.length > 0) {

      $(".divRuta").hide();

      // Mostramos las seleccionadas
      for (var i = 0; i < this.arrayRutas.length; i++) {
        $("#div-" + this.arrayRutas[i]).show();
      }
      
    }else{
      // Mostramos todas las rutas porque no hay ninguna seleccionada
      $(".divRuta").show();
    }
  }

  cargarMapaRuta(estado: boolean, ruta: any) {

    // activamos o desactivamos el swicth
    ruta.seguimiento = estado;
    // obtenemos el codruta
    const codruta = ruta.codruta;

    if ( estado == true ) {
      this._mapaService.cargarRutaTransporte( codruta, this.filtroFlujo ).subscribe((data:any) => {
        if( data.ok == true ) {
          this._websocketService.emitirSocket('emit-usuario-activo-ruta', codruta);
          ruta.alerts = [];
          this.crearMapaRuta( codruta );
        }else{
          if( ruta.alerts.length == 0) {
            ruta.alerts.push({
              type: 'danger',
              msg: `la ruta no esta activa.`
            });
          }
          setTimeout(() => {
            ruta.seguimiento = false;            
          }, 1000);
        }
      });
    }else{
      const mapa: HTMLElement = document.getElementById('mapa-' + codruta);
      mapa.innerHTML = '';
      this._websocketService.emitirSocket('emit-usuario-desactivo-ruta', codruta);
      this.listaMapaReporte = this.listaMapaReporte.filter( mapa => mapa.codruta !== codruta );
    }

    console.log(this.listaMapaReporte);
  }

  cerrarAlert(ruta: any) {
    ruta.alerts = [];
  }
  
  crearMapaRuta( codruta: number ){

    // De esta forma generamos una ubicacion para el mapa
    const ubicacionMapa = new google.maps.LatLng(10.9740231, -74.8044078);

    /*
      Documentacion: https://developers.google.com/maps/documentation/javascript/adding-a-google-map
    */

   // configuramos posicion, zoom, controles, ....
   const opciones: google.maps.MapOptions = {
     center: ubicacionMapa,
     zoom: 15,
     disableDefaultUI: true,
     mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    
    // obtenemos el id del div de esta Ruta
    const mapa: HTMLElement = document.getElementById('mapa-' + codruta);

    // construimos el mapa
    this.mapaTemporal = new google.maps.Map( mapa, opciones);

    // agregar a la lista para tenerlos temporal
    if( this.listaMapaReporte.length == 0 ){
      this.listaMapaReporte.push({ codruta: codruta, flujo: this.filtroFlujo, ruta:[], marcador: null, mapa: this.mapaTemporal });
    } else if( this.listaMapaReporte.filter(mapa => mapa.codruta === codruta).length == 0 ) {
      this.listaMapaReporte.push({ codruta: codruta, flujo: this.filtroFlujo, ruta:[], marcador: null, mapa: this.mapaTemporal });      
    } 
    
    this.cargarRutaGuardada( this.mapaTemporal, codruta, this.filtroFlujo );

  }

  buscarMapa( codruta: number, flujo: string ) {
    for (const i in this.listaMapaReporte) {
      if( this.listaMapaReporte[i].codruta === codruta && this.listaMapaReporte[i].flujo === flujo ) {
        return this.listaMapaReporte[i];
      }
    }
    return null;
  }

  agregarMarcadorMapa( codruta: number, flujo: string, marcador: google.maps.Marker ) {
    for (const i in this.listaMapaReporte) {
      if( this.listaMapaReporte[i].codruta === codruta && this.listaMapaReporte[i].flujo === flujo ) {
        this.listaMapaReporte[i].marcador = marcador;
      }
    }
    return null;
  }

  escucharEventosRuta() {
    // escuchar-ruta-reporte
    this._websocketService.escucharSocket('listen-marcador-ruta')
      .subscribe( ( puntoUbicacion: Ubicacion ) => {

        console.log( puntoUbicacion );

        let mapa = this.buscarMapa( puntoUbicacion.codruta, puntoUbicacion.flujo );

        if( mapa != null ) {

          if(mapa.ruta.length == 0){
            this.agregarMarcador( mapa.mapa, puntoUbicacion, 'Punto de Salida' );
          }
          // Agregamos los puntos nuevos
          mapa.ruta.push( {lat:puntoUbicacion.latitud,lng: puntoUbicacion.longitud} )

          if( mapa.marcador != null ) {
            mapa.marcador.setMap( null );
          }

          this.agregarMarcadorBus( mapa.mapa, puntoUbicacion.latitud, 
                                   puntoUbicacion.longitud, puntoUbicacion.codruta, 
                                   'Ubicación actual de vehiculo.' );

          // mandamos a pintar la linea
          this.pintarRuta( mapa.mapa, mapa.ruta )

          this.centrarMapa( mapa.mapa, puntoUbicacion.latitud, puntoUbicacion.longitud );

        }
    });
  }

  cargarRutaGuardada(mapa: google.maps.Map, codruta: number, flujo: string ) {

    this._mapaService.cargarRutaTransporte( codruta, flujo ).subscribe( ( data: any ) => {

      if( data.ok === true ) {

        if( data.resp.length > 0 ) { 

          const puntosUbicacion = data.resp[0].puntoUbicacion;

          if( puntosUbicacion.length > 0 ) {

            let mapa = this.buscarMapa( data.resp[0].codruta, data.resp[0].flujo );

            if( mapa != null ) {

              this.agregarMarcador( mapa.mapa, puntosUbicacion[0], 'Punto de Salida' );

              this.centrarMapa( mapa.mapa , puntosUbicacion[ puntosUbicacion.length - 1 ].latitud, puntosUbicacion[ puntosUbicacion.length - 1 ].longitud );

              for (const i in puntosUbicacion) {
                // Agregamos los puntos guardados en la base de datos
                mapa.ruta.push( {lat:puntosUbicacion[i].latitud,lng: puntosUbicacion[i].longitud} )
              }
              // mandamos a pintar la linea
              this.pintarRuta( mapa.mapa, mapa.ruta )

            }

          }

        }

      }

    });
  }

  centrarMapa(mapa: google.maps.Map , latitud: number, longitud: number) {
    const latLng = new google.maps.LatLng( latitud, longitud );
    mapa.setCenter( latLng );
  }

  pintarRuta( mapa: google.maps.Map, ruta: any[] ) {

    this.rutaPolyline = new google.maps.Polyline({
      path: ruta,
      geodesic: true,
      strokeColor: '#4CAF50',
      strokeOpacity: 1.0,
      strokeWeight: 4
    });

    this.rutaPolyline.setMap( mapa );
  }

  limpiarRutaMapa() {

    this._mapaService.limpiarRutas().subscribe( ( resp: any ) => {
      if( resp.ok == true){
        console.log('Rutas Elminadas');
        this.rutaPolyline.setMap( null );
      }
    });

  }

  agregarMarcadorBus( mapa: google.maps.Map, 
                      latitud: number, longitud: number, 
                      codruta: number, titulo: string ) {

    // Primero ubicamos la posicion del marcador
    const ubicacionMarcador = new google.maps.LatLng( latitud, longitud );

    // creamos el marcador
    const nuevoMarcador = new google.maps.Marker({
      map: mapa,                             // Aqui le pasamos la referecia del mapa que creamos
      position: ubicacionMarcador,           // Asignamos la ubicacion del marcardor
      draggable: false,                      // Permite que se pueda mover
      title: titulo,
      icon: this.iconBus
    });

    this.agregarMarcadorMapa( codruta, this.filtroFlujo, nuevoMarcador );
    
  }

  agregarMarcador(mapa: google.maps.Map, ubicacion: Ubicacion, titulo: string) {

    // Primero ubicamos la posicion del marcador
    const ubicacionMarcador = new google.maps.LatLng( ubicacion.latitud, ubicacion.longitud );

    /* Documentacion: https://developers.google.com/maps/documentation/javascript/marker-clustering */

    // creamos el marcador
    const nuevoMarcador = new google.maps.Marker({
      map: mapa,                             // Aqui le pasamos la referecia del mapa que creamos
      animation: google.maps.Animation.DROP, // Puntico
      position: ubicacionMarcador,           // Asignamos la ubicacion del marcardor
      draggable: false,                      // Permite que se pueda mover
      title: titulo
    });

    const contenido = `<b>${ titulo }</b>`;
    const infoWindows = new google.maps.InfoWindow({
      content: contenido
    });

    google.maps.event.addDomListener( nuevoMarcador, 'click', () => {

      // Abrimos solo
      infoWindows.open( mapa, nuevoMarcador );

    });

  }

}

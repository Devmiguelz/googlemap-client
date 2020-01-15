import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Ubicacion } from '../../model/ubicacion';
import { MapaService } from '../../services/mapa.service';
import { WebsocketService } from '../../services/websocket.service';

import { Select2OptionData } from 'ng-select2';
import { Options } from 'select2';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { LatLng } from '../../model/punto';
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
    ruta: LatLng[], 
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
    const flujo = ruta.flujo;

    if ( estado == true ) {
      this._mapaService.cargarRutaTransporte( codruta, this.filtroFlujo ).subscribe((data:any) => {
        if( data.ok == true ) {
          this._websocketService.emitirSocket('emit-usuario-activo-ruta', { codruta, flujo } );
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
      this._websocketService.emitirSocket('emit-usuario-desactivo-ruta',  { codruta, flujo } );
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

  escucharEventosRuta() {
    // aqui escuhamos para cuando nos emitan ubicaciones nuevas
    this._websocketService.escucharSocket('listen-marcador-ruta')
      .subscribe( ( puntos: Ubicacion ) => {

        console.log( puntos );

        let mapa = this.buscarMapa( puntos.codruta, puntos.flujo );

        if( mapa != null ) {

          const latLng = new google.maps.LatLng( puntos.latitud, puntos.longitud );

          if(mapa.ruta.length == 0){
            this.agregarMarcadorSalida( mapa.mapa, latLng, 'Punto de Salida' );
          }
          // Agregamos los puntos nuevos
          mapa.ruta.push( {lat: puntos.latitud,lng: puntos.longitud} )

          // ponemos el zoom de ruta en seguimiento
          mapa.mapa.setZoom(15);

          if( mapa.marcador != null ) {
            mapa.marcador.setPosition(latLng); 
          }else{
            mapa.marcador = this.crearMarcador(mapa.mapa, latLng, 'Ubicación actual de vehiculo.', this.iconBus);
            mapa.marcador.setPosition(latLng);
          }

          // mandamos a pintar la linea
          this.pintarRuta( mapa.mapa, mapa.ruta )
          // centramos la vista del mapa en la ultima ubicacion recibida
          mapa.mapa.setCenter(latLng);

        }
    });
  }

  cargarRutaGuardada(mapa: google.maps.Map, codruta: number, flujo: string ) {

    this._mapaService.cargarRutaTransporte( codruta, flujo ).subscribe( ( data: any ) => {

      if( data.ok === true ) {

        if( data.resp.length > 0 ) { 

          const puntos = data.resp[0].puntoUbicacion;
          const size = puntos.length;

          if( size > 0 ) {

            let mapa = this.buscarMapa( data.resp[0].codruta, data.resp[0].flujo );

            if( mapa != null ) {

              const latLngInicio = new google.maps.LatLng( puntos[0].latitud, puntos[0].longitud );
              const latLngFin = new google.maps.LatLng( puntos[ size - 1 ].latitud, puntos[ size - 1 ].longitud );

              this.agregarMarcadorSalida( mapa.mapa, latLngInicio, 'Punto de Salida' );

              if( mapa.marcador != null ) {
                mapa.marcador.setPosition(latLngFin); 
              }else{
                mapa.marcador = this.crearMarcador(mapa.mapa, latLngFin, 'Ubicación actual de vehiculo.', this.iconBus);
                mapa.marcador.setPosition(latLngFin);
              }

              // centramos la vista del mapa en la ultima ubicacion recibida
              mapa.mapa.setCenter(latLngFin);

              for (const i in puntos) {
                // Agregamos los puntos guardados en la base de datos
                mapa.ruta.push( {lat: puntos[i].latitud,lng: puntos[i].longitud} )
              }
              // mandamos a pintar la linea
              this.pintarRuta( mapa.mapa, mapa.ruta )

            }

          }

        }

      }

    });
  }

  pintarRuta( mapa: google.maps.Map, ruta: LatLng[] ) {

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

  crearMarcador( mapa: google.maps.Map, ubicacion: google.maps.LatLng, titulo: string, icono: string ) {

    // creamos el marcador
    const nuevoMarcador = new google.maps.Marker({
      map: mapa,                             // Aqui le pasamos la referecia del mapa que creamos
      position: ubicacion,           // Asignamos la ubicacion del marcardor
      draggable: false,                      // Permite que se pueda mover
      title: titulo,
      icon: icono
    });

    return nuevoMarcador;
    
  }

  agregarMarcadorSalida(mapa: google.maps.Map, ubicacion: google.maps.LatLng, titulo: string) {

    // creamos el marcador
    const nuevoMarcador = new google.maps.Marker({
      map: mapa,                             // Aqui le pasamos la referecia del mapa que creamos
      position: ubicacion,                   // Asignamos la ubicacion del marcardor
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

  logout() {
    this._websocketService.logoutSocketUsuario();
  }
}

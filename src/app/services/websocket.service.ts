import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Usuario } from '../model/usuario';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  public estadoConexion = false;
  public usuario: Usuario = null;

  constructor(private webSocket: Socket, private router: Router) { 
    this.cargarStorage();
    this.verificarConexion();
  }

  // Verificamos el estado de la conexion del servidor
  verificarConexion() {
    this.webSocket.on('connect', () => {
      console.log('Conectado al Servidor');
      this.estadoConexion = true;
      this.guardarStorage();
    });

    this.webSocket.on('disconnect', () => {
      console.log('Desconectado del Servidor');
      this.estadoConexion = false;
    });
  }
  // Utilizamos esta funcion para emitir un evento al servidor via socket
  emitirSocket(evento: string, payload?: any, callback?: Function) {
      this.webSocket.emit(evento, payload, callback);
  }
  // Se ejecuta cuando el servidor nos emite un evento via socket
  escucharSocket(evento: string) {
    return this.webSocket.fromEvent(evento);
  }

  loginSocketUsuario( nombre: string ,codsala: number) {
    return new Promise( (resolve, reject) => {
      this.emitirSocket('configurar-usuario', { nombre, codsala }, (resp: Usuario) => {
        this.usuario = resp;
        this.guardarStorage();
        resolve();
      });
    });
  }

  logoutSocketUsuario(){
    this.usuario = null;
    localStorage.removeItem('usuario');
    const payload ={
      nombre: 'sin-nombre',
      codsala: 0
    }
    this.emitirSocket('configurar-usuario', payload, () => {} );
    this.router.navigateByUrl('');
  }

  obtenerUsuario(){
    return this.usuario;
  }

  guardarStorage(){
    if(this.usuario != null){
      localStorage.setItem('usuario', JSON.stringify(this.usuario));
    }
  }

  cargarStorage(){
    if( localStorage.getItem('usuario') ){
      this.usuario = JSON.parse( localStorage.getItem('usuario') );
      this.loginSocketUsuario( this.usuario.nombre, this.usuario.codsala );
    }
  }
}

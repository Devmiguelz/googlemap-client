import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { WebsocketService } from '../services/socket/websocket.service';

@Injectable({
  providedIn: 'root'
})
export class UsuarioGuard implements CanActivate {

  constructor(
    public _websocketService:WebsocketService,
    private router:Router
  ) { }

  canActivate(){
    if( this._websocketService.obtenerUsuario() ){
      return true;
    }else{
      this.router.navigateByUrl('/');
      return false;
    }
  }  
}
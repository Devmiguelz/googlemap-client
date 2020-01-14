import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { WebsocketService } from '../services/websocket.service';
import { Router } from '@angular/router';
import { Usuario } from '../model/usuario';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  // Formulario del Chat
  public formLogin: FormGroup;

  constructor(
    public _websocketService: WebsocketService,
    private routes: Router,
    private formBuilder: FormBuilder
  ) { }

  ngOnInit() {
    this.buildFormLogin();
  }

  // Construimos todo el formulario
  buildFormLogin() {
    this.formLogin = this.formBuilder.group({
      nombre: [ '', [ Validators.required ]]
    });
  }

  validarLogin() {
    const usuario: Usuario = this.formLogin.value;
    this._websocketService.loginSocketUsuario( usuario.nombre)
      .then(() => {
        this.routes.navigateByUrl('/transporte/ruta');
      });
  }

  // Sirve para colocar el select en la primera posicion y no quede en blanco
  primeraOpcionValidate(control: AbstractControl): { [key: string]: boolean } | null {
    if (control.value !== undefined && control.value <= 0) {
        return { primeraOpcion: true };
    }
    return null;
  }
}

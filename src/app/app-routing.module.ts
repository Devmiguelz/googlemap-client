import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { UsuarioGuard } from './guards/usuario.guard';


const routes: Routes = [
  
  { path: '', component: LoginComponent  },
  {
    path: 'transporte' ,
    loadChildren: () => import('./transporte/transporte.module').then(m => m.TransporteModule),
    canActivate: [ UsuarioGuard ] 
  },
  { path: '**', redirectTo: '' }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

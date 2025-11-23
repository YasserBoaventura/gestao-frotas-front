import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { VeiculosComponent } from './components/Veiculos/veiculos/veiculos.component';
import { MarcalistComponent } from './components/marca/marcalist/marcalist.component';
import { MarcadetalhesComponent } from './components/marca/marcadetalhes/marcadetalhes.component';
import { RegisterComponent } from './components/login/register/register.component';
import { ResetSenhaComponent } from './components/login/reset-senha/reset-senha.component';

export const routes: Routes = [

{path:"", redirectTo:"login", pathMatch:"full"},
{path:"login", component: LoginComponent},
{path:"dashboard" , component: DashboardComponent},
{path:"veiculos", component: VeiculosComponent},
{path: "marcaslist", component: MarcalistComponent},
{path: "marcas", component: MarcadetalhesComponent},
{path: "register", component: RegisterComponent},
{path: "resetSenha", component: ResetSenhaComponent}

];

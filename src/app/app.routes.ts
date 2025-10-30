import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { VeiculosComponent } from './components/Veiculos/veiculos/veiculos.component';
import { MarcalistComponent } from './components/marca/marcalist/marcalist.component';

export const routes: Routes = [

{path:"", redirectTo:"login", pathMatch:"full"},
{path:"login", component: LoginComponent},
{path:"dashboard" , component: DashboardComponent},
{path:"veiculos", component: VeiculosComponent},
{path: "marcaslist", component: MarcalistComponent}

];

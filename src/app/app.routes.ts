import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { VeiculosComponent } from './components/Veiculos/veiculos/veiculos.component';
import { MarcalistComponent } from './components/marca/marcalist/marcalist.component';
import { MarcadetalhesComponent } from './components/marca/marcadetalhes/marcadetalhes.component';

import { ResetSenhaComponent } from './components/login/reset-senha/reset-senha.component';
import { MotoristadetalisComponent } from './components/motorista/motoristadetalis/motoristadetalis.component';
import { MotoristalistComponent } from './components/motorista/motoristalist/motoristalist.component';
import { UsuarioDetalisComponent } from './components/Usuario/usuario-detalis/usuario-detalis.component';
import { UsuarioListComponent } from './components/Usuario/usuario-list/usuario-list.component';
import { RotasListComponent } from './components/Rotas/rotas-list/rotas-list.component';
import { ViagenslistComponent } from './components/viagens/viagenslist/viagenslist.component';

import { RelatorioviagemComponent } from './components/relatorioViagem/relatorioviagem/relatorioviagem.component';
import { AbastecimentoListComponent } from './components/abastecimentos/abastecimentoslist/abastecimentoslist.component';
import { ManutencoesListComponent } from './components/Manutencoes/manutencoes-list/manutencoes-list.component';



export const routes: Routes = [

{path:"", redirectTo:"login", pathMatch:"full"},
{path:"login", component: LoginComponent},
{path:"dashboard" , component: DashboardComponent},
{path:"veiculos", component: VeiculosComponent},
{path: "marcaslist", component: MarcalistComponent},
{path: "marcas", component: MarcadetalhesComponent},
{path: "register", component: UsuarioDetalisComponent},
{path: "userlist", component: UsuarioListComponent},
{path: "reset-senha", component: ResetSenhaComponent},
{path:"drivers", component: MotoristalistComponent},
{path: "RotasList", component: RotasListComponent},
{path: "viagenslist", component: ViagenslistComponent},
{path: "abastecimentoslist", component: AbastecimentoListComponent},
{path: "manutencoes", component: ManutencoesListComponent},
{path: "relatoriosViagem", component: RelatorioviagemComponent},


];

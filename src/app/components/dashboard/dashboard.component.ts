import { Component, inject } from '@angular/core';

import { Router } from '@angular/router';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

  router=inject(Router);

    // Exemplo de dados da frota
 
  vehiclesAvailable = 12;
  vehiclesInUse = 5;
  vehiclesMaintenance = 3;
  upcomingRoutes = 4;

  fuelEntriesToday = 6;  // registros de abastecimento do dia
  fuelTotalLiters = 420; // total de litros abastecidos

  constructor() { }

  ngOnInit(): void {
  }


  
// implementar componentes para essa rotas 
  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}

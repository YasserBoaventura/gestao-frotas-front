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

  constructor() { }

  ngOnInit(): void {
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}

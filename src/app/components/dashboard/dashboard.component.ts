import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../auth/login.service';
import { CommonModule } from '@angular/common';
import { VeiculosService } from '../Veiculos/veiculos.service';

import { AbstecimeserviceService } from '../abastecimentos/abstecimeservice.service';

import { forkJoin, finalize } from 'rxjs';
import { RotasServiceService } from '../Rotas/rotas-service.service';
import { ViagensServiceService } from '../viagens/viagens-service.service';
import { ManutencoesServiceService } from '../Manutencoes/manutencoes-service.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  router = inject(Router);
  serviceLogin = inject(LoginService);

currentDate: Date = new Date();

  // Services
  veiculoService = inject(VeiculosService);
  rotasService = inject(RotasServiceService);
  abastecimentoService = inject(AbstecimeserviceService);
  viagemService = inject(ViagensServiceService);
  manutencaoService = inject(ManutencoesServiceService);

  // Dados da frota
  vehiclesAvailable = 0;
  vehiclesInUse = 0;
  vehiclesMaintenance = 0;
  upcomingRoutes = 0;
  fuelEntriesToday = 0;
  fuelTotalLiters = 0;
  totalViagens = 0;
  viagensConcluidas = 0;
  veiculosEmRota = 0;
  veiculosOnline = 0;

  // Loading
  carregando = false;

  constructor() { }

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    this.carregando = true;

    // Buscar todos os dados em paralelo
    forkJoin({
      veiculos: this.veiculoService.getVehicles(),
      rotas: this.rotasService.getAll(),
      abastecimentos: this.abastecimentoService.getAbastecimentos(),
      viagens: this.viagemService.getViagens(),
      manutencoes: this.manutencaoService.getAll()
    }).pipe(
      finalize(() => {
        this.carregando = false;
      })
    ).subscribe({
      next: ({ veiculos, rotas, abastecimentos, viagens, manutencoes }) => {


        // ===== VEÍCULOS =====
        const veiculosDisponiveis = veiculos?.filter(v => v.status === 'DISPONIVEL' || v.status === 'ATIVO') || [];
        const veiculosUso = veiculos?.filter(v => v.status === 'EM_VIAGEM') || [];
        const veiculosManutencao = veiculos?.filter(v => v.status === 'EM_MANUTENCAO') || [];
        const veiculosRota = veiculos?.filter(v => v.status === 'EM_ROTA' || v.status === 'EM_VIAGEM') || [];
        const veiculosOnline = veiculos?.filter(v => v.status === 'ONLINE') || [];

        this.vehiclesAvailable = veiculosDisponiveis.length;
        this.vehiclesInUse = veiculosUso.length;
        this.vehiclesMaintenance = veiculosManutencao.length;
        this.veiculosEmRota = veiculosRota.length;
        this.veiculosOnline = veiculosOnline.length || veiculosUso.length + veiculosRota.length;

        // ===== ROTAS =====
        this.upcomingRoutes = rotas?.length || 0;

        // ===== ABASTECIMENTOS =====
        const hoje = new Date();
        const dataHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

        const abastecimentosHoje = abastecimentos?.filter(a => {
          if (!a.dataAbastecimento) return false;
          const dataAbast = new Date(a.dataAbastecimento);
          return dataAbast >= dataHoje;
        }) || [];

        this.fuelEntriesToday = abastecimentosHoje.length;
        this.fuelTotalLiters = abastecimentosHoje.reduce((total, a) => total + (a.quantidadeLitros || 0), 0);

        // ===== VIAGENS =====
        const viagensHoje = viagens?.filter(v => {
          if (!v.dataHoraChegada) return false;
          const dataViagem = new Date(v.dataHoraChegada);
          return dataViagem >= dataHoje;
        }) || [];

        this.totalViagens = viagensHoje.length;
        this.viagensConcluidas = viagensHoje?.filter(v => v.status === 'CONCLUIDA' || v.status === 'FINALIZADA')?.length || 0;

     
      },
      error: (error) => {
        console.error('Erro ao carregar dados do dashboard:', error);
   
        this.carregarDadosMock();
      }
    });
  }

  /**
   * Dados mockados para fallback em caso de erro
   */
  private carregarDadosMock(): void {
    this.vehiclesAvailable = 12;
    this.vehiclesInUse = 5;
    this.vehiclesMaintenance = 3;
    this.upcomingRoutes = 4;
    this.fuelEntriesToday = 6;
    this.fuelTotalLiters = 420;
    this.totalViagens = 8;
    this.viagensConcluidas = 5;
    this.veiculosEmRota = 7;
    this.veiculosOnline = 10;
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}

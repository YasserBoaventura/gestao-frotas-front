// src/app/tracking/tracking.component.ts
import { AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocationDTO, LocationHistoryItem, VehicleLocation } from '../location.model';
import { TrackingServiceService } from '../tracking-service.service';
import { Observable, Subscription, forkJoin, combineLatest } from 'rxjs';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { VeiculosService } from '../../Veiculos/veiculos.service';
import { Veiculo } from '../../Veiculos/veiculos.model';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Abastecimento } from '../../abastecimentos/abastecimento';
import { AbastecimentoListComponent } from '../../abastecimentos/abastecimentoslist/abastecimentoslist.component';
import { AbstecimeserviceService } from '../../abastecimentos/abstecimeservice.service';

declare const google: any;

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    MatSnackBarModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    AbastecimentoListComponent
  ],
  templateUrl: './tracking.component.html',
  styleUrl: './tracking.component.css'
})
export class TrackingComponent implements OnInit, AfterViewInit, OnDestroy {



  @ViewChild('mapContainer') mapContainer!: ElementRef;

  // Services
  veiculoService = inject(VeiculosService);
  snackBar = inject(MatSnackBar);
  combustivelService = inject(AbstecimeserviceService);

  // ============ DADOS DO VEÍCULO ============
  veiculoId: number = 0;
  selectedPlate: string = '';
  vehicles: Veiculo[] = [];
  vehicleOptions: { id: number; plate: string; capacidadeTanque: number }[] = [];

  // ============ DADOS DE COMBUSTÍVEL ============
  abastecimentos: Abastecimento[] = [];
  abastecimentosDoVeiculoAtual: Abastecimento[] = [];
  ultimoAbastecimento: Abastecimento | null = null;

  // Consumo calculado
  consumoMedio: number = 10; // km/l (valor padrão)
  nivelCombustivel: number = 75; // % do tanque (valor inicial)
  autonomia: number = 0;
  capacidadeTanque: number = 50; // litros (padrão, será substituído pelo valor do veículo)

  // Estatísticas de combustível
  fuelStats = {
    totalGasto: 0,
    totalLitros: 0,
    mediaPreco: 0,
    consumoMedio: 0,
    custoPorKm: 0,
    totalAbastecimentos: 0
  };

  // Dados para gráfico
  meses: string[] = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
  consumoMensal: number[] = [45, 52, 48, 63, 58, 47];

  // ============ MAPA ============
  map: any;
  marker: any;
  historyMarkers: any[] = [];
  historyPolyline: any;

  // ============ LOCALIZAÇÕES ============
  currentLocation: VehicleLocation | null = null;
  locationHistory: VehicleLocation[] = [];
  filteredHistory: LocationHistoryItem[] = [];

  // ============ ESTADOS ============
  mapInitialized = false;
  isLoading = false;
  showHistory = false;
  showTrajectory = false;
  activeTab: number = 0; // 0: Mapa, 1: Combustível, 2: Estatísticas
  selectedPeriod: string = '1h';

  // ============ MODAL ABASTECIMENTO ============
  showAbastecimentoModal: boolean = false;
  novoAbastecimento = {
    veiculoId: 0,
    data: '',
    litros: 0,
    precoPorLitro: 0,
    valorTotal: 0,
    odometro: 0,
    posto: '',
    tipoCombustivel: 'GASOLINA'
  };

  // ============ SUBSCRIPTIONS ============
  private subscriptions: Subscription[] = [];
  private consumoSimulationInterval: any;

  constructor(private trackingService: TrackingServiceService) {}

  ngOnInit() {
    this.carregarDadosIniciais();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initMap();
    }, 500);
  }

  ngOnDestroy() {
    this.trackingService.disconnect();
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.consumoSimulationInterval) {
      clearInterval(this.consumoSimulationInterval);
    }
  }

  // ============ INICIALIZAÇÃO ============

  private carregarDadosIniciais() {
    this.isLoading = true;

    forkJoin({
      veiculos: this.veiculoService.getVehicles(),
      abastecimentos: this.combustivelService.getAbastecimentos()
    }).subscribe({
      next: ({ veiculos, abastecimentos }) => {
        this.vehicles = veiculos;
        this.abastecimentos = abastecimentos;

        console.log('📦 TODOS ABASTECIMENTOS:', abastecimentos);

        // Processar veículos para o dropdown com capacidade do tanque
        this.vehicleOptions = veiculos.map((v: Veiculo) => ({
          id: v.id,
          plate: v.matricula,
          capacidadeTanque: (v as any).capacidadeTanque || 50 // Pega do veículo ou usa 50 como padrão
        }));

        console.log('✅ Dados carregados:', {
          veiculos: this.vehicleOptions.length,
          abastecimentos: this.abastecimentos.length
        });

        if (this.vehicleOptions.length > 0) {
          this.veiculoId = this.vehicleOptions[0].id;
          this.selectedPlate = this.vehicleOptions[0].plate;
          this.capacidadeTanque = this.vehicleOptions[0].capacidadeTanque;
          this.novoAbastecimento.veiculoId = this.veiculoId;
          this.carregarDadosVeiculo();
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Erro ao carregar dados:', error);
        this.mostrarErro('Erro ao carregar dados do servidor');
        this.isLoading = false;
      }
    });
  }

  private carregarDadosVeiculo() {
    console.log(`📊 Carregando dados do veículo ID: ${this.veiculoId}`);

    // Filtrar abastecimentos do veículo atual -
    this.abastecimentosDoVeiculoAtual = this.abastecimentos.filter(a => {
      // Tenta diferentes formas de obter o ID do veículo
      const idVeiculo = (a as any).veiculo?.id || (a as any).veiculoId || (a as any).veiculo_Id;
      console.log('Comparando abastecimento:', a.id, 'veiculoId:', idVeiculo, 'com', this.veiculoId);
      return idVeiculo === this.veiculoId;
    });

    console.log(`⛽ Abastecimentos encontrados para veículo ${this.selectedPlate}:`, this.abastecimentosDoVeiculoAtual);

    if (this.abastecimentosDoVeiculoAtual.length > 0) {
      // Ordenar por data (mais recente primeiro)
      this.abastecimentosDoVeiculoAtual.sort((a, b) => {
        const dataA = new Date(a.dataAbastecimento || 0).getTime();
        const dataB = new Date(b.dataAbastecimento || 0).getTime();
        return dataB - dataA;
      });

      this.ultimoAbastecimento = this.abastecimentosDoVeiculoAtual[0];

      console.log('✅ Último abastecimento:', this.ultimoAbastecimento);

      this.calcularConsumoMedio();
      this.calcularEstatisticasCombustivel();
      this.atualizarNivelCombustivel();
    } else {
      console.log('⚠️ Nenhum abastecimento encontrado para este veículo');
      this.abastecimentosDoVeiculoAtual = [];
      this.ultimoAbastecimento = null;
      this.consumoMedio = 10; // valor padrão
      this.nivelCombustivel = 75; // valor padrão
      this.fuelStats = {
        totalGasto: 0,
        totalLitros: 0,
        mediaPreco: 0,
        consumoMedio: 0,
        custoPorKm: 0,
        totalAbastecimentos: 0
      };
    }

    // Carregar localização atual
    this.loadInitialLocation();
    this.subscribeToUpdates();

    // Iniciar simulação de consumo
    this.iniciarSimulacaoConsumo();
  }

  // ============ CÁLCULOS DE COMBUSTÍVEL ============

  private calcularConsumoMedio() {
    if (this.abastecimentosDoVeiculoAtual.length < 2) {
      console.log('⚠️ Poucos abastecimentos para calcular consumo médio');
      return;
    }

    let totalLitros = 0;
    let totalKm = 0;
    let contador = 0;

    // Calcular consumo entre abastecimentos consecutivos
    for (let i = 0; i < this.abastecimentosDoVeiculoAtual.length - 1; i++) {
      const atual = this.abastecimentosDoVeiculoAtual[i];
      const anterior = this.abastecimentosDoVeiculoAtual[i + 1];

      if (atual.kilometragemVeiculo && anterior.kilometragemVeiculo) {
        const kmPercorridos = atual.kilometragemVeiculo - anterior.kilometragemVeiculo;

        // Ignorar valores negativos ou muito grandes (erro de digitação)
        if (kmPercorridos > 0 && kmPercorridos < 2000) {
          totalLitros += anterior.quantidadeLitros;
          totalKm += kmPercorridos;
          contador++;

          console.log(`Trecho ${contador}: ${kmPercorridos}km com ${anterior.quantidadeLitros}L = ${(kmPercorridos / anterior.quantidadeLitros).toFixed(2)} km/l`);
        }
      }
    }

    if (totalLitros > 0 && totalKm > 0 && contador > 0) {
      this.consumoMedio = totalKm / totalLitros;
      console.log(`✅ Consumo médio calculado: ${this.consumoMedio.toFixed(2)} km/l (baseado em ${contador} trechos)`);
    } else {
      console.log('⚠️ Não foi possível calcular consumo médio, usando valor padrão');
    }
  }

  private calcularEstatisticasCombustivel() {
    if (this.abastecimentosDoVeiculoAtual.length === 0) {
      console.log('⚠️ Sem abastecimentos para calcular estatísticas');
      this.fuelStats = {
        totalGasto: 0,
        totalLitros: 0,
        mediaPreco: 0,
        consumoMedio: this.consumoMedio,
        custoPorKm: 0,
        totalAbastecimentos: 0
      };
      return;
    }

    let totalLitros = 0;
    let totalGasto = 0;

    this.abastecimentosDoVeiculoAtual.forEach(a => {
      const litros = Number(a.quantidadeLitros) || 0;
      const preco = Number(a.precoPorLitro) || 0;

      totalLitros += litros;
      totalGasto += litros * preco;

      console.log(`Abastecimento: ${litros}L x R$ ${preco} = R$ ${litros * preco}`);
    });

    console.log('📈 Totais calculados:', { totalLitros, totalGasto });

    this.fuelStats = {
      totalGasto: totalGasto,
      totalLitros: totalLitros,
      mediaPreco: totalLitros > 0 ? totalGasto / totalLitros : 0,
      consumoMedio: this.consumoMedio,
      custoPorKm: (this.consumoMedio > 0 && totalLitros > 0) ? (totalGasto / totalLitros) / this.consumoMedio : 0,
      totalAbastecimentos: this.abastecimentosDoVeiculoAtual.length
    };

    console.log('✅ Estatísticas calculadas:', this.fuelStats);
  }

  private atualizarNivelCombustivel() {
    if (!this.ultimoAbastecimento || !this.currentLocation) {
      // Se não tiver dados, simular nível baseado no consumo
      this.autonomia = (this.nivelCombustivel / 100) * this.capacidadeTanque * this.consumoMedio;
      return;
    }


    const litrosRestantes = this.ultimoAbastecimento.quantidadeLitros;
    this.nivelCombustivel = Math.max(0, Math.min(100, (litrosRestantes / this.capacidadeTanque) * 100));
    this.autonomia = Math.max(0, litrosRestantes * this.consumoMedio);

    console.log(`⛽ Nível calculado: ${this.nivelCombustivel.toFixed(1)}% | Autonomia: ${this.autonomia.toFixed(0)}km`);
  }

  private iniciarSimulacaoConsumo() {
    // Simular consumo baseado no movimento do veículo
    this.consumoSimulationInterval = setInterval(() => {
      if (this.currentLocation?.status === 'moving' && this.nivelCombustivel > 0) {
        // Consumir 0.1% do tanque a cada 30 segundos
        const consumo = 0.1;
        this.nivelCombustivel = Math.max(0, this.nivelCombustivel - consumo);

        // Recalcular autonomia
        const litrosRestantes = (this.nivelCombustivel / 100) * this.capacidadeTanque;
        this.autonomia = litrosRestantes * this.consumoMedio;

        console.log(`⛽ Consumindo... Nível: ${this.nivelCombustivel.toFixed(1)}%`);
      }
    }, 30000);
  }

  getNivelColor(): string {
    if (this.nivelCombustivel < 15) return '#dc3545';
    if (this.nivelCombustivel < 30) return '#ffc107';
    return '#28a745';
  }

  getBarColor(): string {
    if (this.nivelCombustivel < 15) return 'linear-gradient(90deg, #dc3545, #ff6b6b)';
    if (this.nivelCombustivel < 30) return 'linear-gradient(90deg, #ffc107, #ffdb6b)';
    return 'linear-gradient(90deg, #28a745, #34ce57)';
  }

  // ============ MODAL ABASTECIMENTO ============

  abrirModalAbastecimento() {
    const dataAtual = new Date();
    const ano = dataAtual.getFullYear();
    const mes = (dataAtual.getMonth() + 1).toString().padStart(2, '0');
    const dia = dataAtual.getDate().toString().padStart(2, '0');
    const horas = dataAtual.getHours().toString().padStart(2, '0');
    const minutos = dataAtual.getMinutes().toString().padStart(2, '0');

    this.novoAbastecimento = {
      veiculoId: this.veiculoId,
      data: `${ano}-${mes}-${dia}T${horas}:${minutos}`,
      litros: 0,
      precoPorLitro: 0,
      valorTotal: 0,
      odometro: (this.currentLocation as any)?.odometro || 0,
      posto: '',
      tipoCombustivel: 'GASOLINA'
    };

    this.showAbastecimentoModal = true;
  }

  fecharModalAbastecimento() {
    this.showAbastecimentoModal = false;
  }

  calcularValorTotal() {
    this.novoAbastecimento.valorTotal =
      this.novoAbastecimento.litros * this.novoAbastecimento.precoPorLitro;
  }

 registrarAbastecimento() {
  // Validar dados obrigatórios
  if (!this.novoAbastecimento.veiculoId || !this.novoAbastecimento.litros ||
      !this.novoAbastecimento.precoPorLitro || !this.novoAbastecimento.odometro) {
    this.mostrarErro('Preencha todos os campos obrigatórios');
    return;
  }

  // Converter data para ISO
  const dataLocal = new Date(this.novoAbastecimento.data);
  const dataISO = dataLocal.toISOString();

  
  const statusAbst = 'REALIZADA';


  const abastecimentoParaEnviar: any = {
    veiculoId: this.novoAbastecimento.veiculoId,
    dataAbastecimento: dataISO,
    quantidadeLitros: Number(this.novoAbastecimento.litros),
    precoPorLitro: Number(this.novoAbastecimento.precoPorLitro),
    tipoCombustivel: this.novoAbastecimento.tipoCombustivel,
    kilometragemVeiculo: Number(this.novoAbastecimento.odometro),
    statusAbastecimento: statusAbst, //realizado por padrao 
    posto: this.novoAbastecimento.posto || null,
    viagemId: null
  };

  console.log('📤 Enviando abastecimento:', JSON.stringify(abastecimentoParaEnviar, null, 2));

  const sub = this.combustivelService.createAbastecimento(abastecimentoParaEnviar).subscribe({
    next: (response) => {
      console.log('✅ Abastecimento registrado:', response);
      this.mostrarSucesso('Abastecimento registrado com sucesso!');
      this.fecharModalAbastecimento();

      // Recarregar dados
      setTimeout(() => {
        this.combustivelService.getAbastecimentos().subscribe({
          next: (abastecimentos) => {
            this.abastecimentos = abastecimentos;
            this.carregarDadosVeiculo();
          }
        });
      }, 500);
    },
    error: (error) => {
      console.error('❌ ERRO COMPLETO:', error);
      this.mostrarErro('Erro ao registrar abastecimento: ' + (error.error?.erro || 'Erro desconhecido'));
    }
  });

  this.subscriptions.push(sub);
}
  // ============ MAPA ============

  private initMap() {
    if (!this.mapContainer?.nativeElement) return;

    try {
      if (typeof google === 'undefined' || !google.maps) {
        console.error('❌ Google Maps não carregado');
        return;
      }

      this.map = new google.maps.Map(this.mapContainer.nativeElement, {
        center: { lat: -23.5505, lng: -46.6333 },
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true
      });

      this.mapInitialized = true;
      console.log('🗺️ Mapa inicializado');

      if (this.currentLocation) {
        this.updateMapLocation(this.currentLocation);
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar mapa:', error);
    }
  }

  private loadInitialLocation() {
    if (!this.veiculoId) return;

    this.isLoading = true;

    const sub = this.trackingService.getLastLocation(this.veiculoId).subscribe({
      next: (location) => {
        this.currentLocation = location;
        if (this.mapInitialized) {
          this.updateMapLocation(location);
        }
        this.atualizarNivelCombustivel();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Erro ao carregar localização:', error);
        this.startWithMockData();
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  private subscribeToUpdates() {
    if (!this.veiculoId) return;

    this.trackingService.subscribeToLocationUpdates(this.veiculoId, (location) => {
      this.currentLocation = location;
      if (this.mapInitialized) {
        this.updateMapLocation(location);
      }
      this.atualizarNivelCombustivel();
    });
  }

  private updateMapLocation(location: VehicleLocation) {
    if (!this.map || !this.mapInitialized) return;

    const position = { lat: location.latitude, lng: location.longitude };
    const plate = location.veiculo?.matricula || this.selectedPlate;

    if (this.marker) {
      this.marker.setPosition(position);
      this.marker.setTitle(`Veículo ${plate}`);
    } else {
      const markerIcon = {
        url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
        scaledSize: new google.maps.Size(40, 40)
      };

      this.marker = new google.maps.Marker({
        position: position,
        map: this.map,
        title: `Veículo ${plate}`,
        icon: markerIcon,
        animation: google.maps.Animation.DROP
      });

      const infoWindow = new google.maps.InfoWindow({
        content: this.createInfoWindowContent(location)
      });

      this.marker.addListener('click', () => {
        infoWindow.open(this.map, this.marker);
      });
    }

    this.map.setCenter(position);
  }

  private createInfoWindowContent(location: VehicleLocation): string {
    const statusColor = location.status === 'moving' ? '#28a745' : '#dc3545';
    const statusText = location.status === 'moving' ? 'Em movimento' : 'Parado';
    const plate = location.veiculo?.matricula || this.selectedPlate;

    return `
      <div style="padding: 12px; font-family: Arial, sans-serif; max-width: 250px;">
        <h3 style="margin: 0 0 8px 0; color: #333;">
          🚗 Veículo ${plate}
        </h3>
        <p style="margin: 5px 0;">
          <strong>Velocidade:</strong> ${location.speed?.toFixed(1) || 0} km/h
        </p>
        <p style="margin: 5px 0;">
          <strong>Status:</strong>
          <span style="color: ${statusColor};">${statusText}</span>
        </p>
        <p style="margin: 5px 0;">
          <strong>Combustível:</strong>
          <span style="color: ${this.getNivelColor()};">${this.nivelCombustivel.toFixed(1)}%</span>
        </p>
        <p style="margin: 5px 0;">
          <strong>Autonomia:</strong> ${this.autonomia.toFixed(0)} km
        </p>
        <p style="margin: 5px 0;">
          <strong>Consumo médio:</strong> ${this.consumoMedio.toFixed(1)} km/l
        </p>
        <p style="margin: 5px 0;">
          <strong>Total gasto:</strong> ${this.formatarMoeda(this.fuelStats.totalGasto)}
        </p>
        <p style="margin: 5px 0;">
          <strong>Horário:</strong> ${new Date(location.timestamp).toLocaleString()}
        </p>
      </div>
    `;
  }

  // ============ TROCAR VEÍCULO ============

  changeVehicle(event: any) {
    const selectedId = Number(event);
    const selected = this.vehicleOptions.find(v => v.id === selectedId);

    if (!selected) return;

    this.veiculoId = selectedId;
    this.selectedPlate = selected.plate;
    this.capacidadeTanque = selected.capacidadeTanque;
    this.novoAbastecimento.veiculoId = this.veiculoId;

    this.currentLocation = null;
    this.locationHistory = [];
    this.filteredHistory = [];
    this.showHistory = false;
    this.showTrajectory = false;

    if (this.marker) {
      this.marker.setMap(null);
      this.marker = null;
    }
    this.clearHistoryMarkers(true);

    this.carregarDadosVeiculo();
  }

  // ============ HISTÓRICO DE LOCALIZAÇÕES ============

  loadHistory() {
    if (!this.veiculoId) return;

    this.isLoading = true;
    this.showHistory = true;

    let historyObservable;

    switch(this.selectedPeriod) {
      case '1h':
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);
        historyObservable = this.trackingService.getLocationHistory(this.veiculoId, oneHourAgo);
        break;
      case '24h':
        historyObservable = this.trackingService.getLast24HoursHistory(this.veiculoId);
        break;
      case 'today':
        historyObservable = this.trackingService.getTodayHistory(this.veiculoId);
        break;
      default:
        historyObservable = this.trackingService.getLocationHistory(this.veiculoId);
    }

    const sub = historyObservable.subscribe({
      next: (history) => {
        this.locationHistory = history;
        this.processHistoryData();
        this.showTrajectory = true;
        this.showHistoryOnMap();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Erro ao carregar histórico:', error);
        this.loadMockHistory();
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  private processHistoryData() {
    this.filteredHistory = this.locationHistory.map((loc, index) => {
      let color = '#28a745';
      if (loc.status === 'stopped') color = '#dc3545';
      if (loc.speed && loc.speed < 10) color = '#ffc107';

      return {
        id: index + 1,
        time: new Date(loc.timestamp).toLocaleTimeString(),
        latitude: loc.latitude.toFixed(6),
        longitude: loc.longitude.toFixed(6),
        speed: loc.speed?.toFixed(1) || '0',
        status: loc.status || 'unknown',
        color: color,
        veiculoId: loc.veiculo?.id || 0,
        placa: loc.veiculo?.matricula || this.selectedPlate
      };
    }).reverse();
  }

  private showHistoryOnMap() {
    if (!this.map || !this.mapInitialized) return;

    this.clearHistoryMarkers(false);

    if (this.locationHistory.length === 0) return;

    const path = this.locationHistory.map(loc => ({
      lat: loc.latitude,
      lng: loc.longitude
    }));

    if (this.historyPolyline) {
      this.historyPolyline.setPath(path);
    } else {
      this.historyPolyline = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 3
      });
    }

    this.historyPolyline.setMap(this.map);

    if (this.showHistory) {
      this.locationHistory.forEach((loc, index) => {
        if (index % 3 === 0 || index === this.locationHistory.length - 1) {
          const marker = new google.maps.Marker({
            position: { lat: loc.latitude, lng: loc.longitude },
            map: this.map,
            icon: {
              url: index === 0 ? 'https://maps.google.com/mapfiles/ms/icons/green-dot.png' :
                   index === this.locationHistory.length - 1 ? 'https://maps.google.com/mapfiles/ms/icons/red-dot.png' :
                   'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              scaledSize: new google.maps.Size(30, 30)
            },
            title: `${new Date(loc.timestamp).toLocaleTimeString()}`
          });

          this.historyMarkers.push(marker);
        }
      });
    }

    if (this.showHistory) {
      const bounds = new google.maps.LatLngBounds();
      path.forEach(point => bounds.extend(point));
      this.map.fitBounds(bounds);
    }
  }

  private clearHistoryMarkers(clearPolyline: boolean = true) {
    this.historyMarkers.forEach(marker => marker.setMap(null));
    this.historyMarkers = [];

    if (clearPolyline && this.historyPolyline) {
      this.historyPolyline.setMap(null);
      this.historyPolyline = null;
    }
  }

  toggleTrajectory() {
    this.showTrajectory = !this.showTrajectory;

    if (this.showTrajectory && this.locationHistory.length > 0) {
      this.showHistoryOnMap();
    } else {
      this.clearHistoryMarkers(true);
    }
  }

  closeHistory() {
    this.showHistory = false;
    this.historyMarkers.forEach(marker => marker.setMap(null));
    this.historyMarkers = [];

    if (this.currentLocation && this.map) {
      this.map.setCenter({
        lat: this.currentLocation.latitude,
        lng: this.currentLocation.longitude
      });
      this.map.setZoom(15);
    }
  }

  // ============ SIMULAÇÃO ============

  simulateLocationUpdate() {
    if (!this.veiculoId) return;

    const mockLocation: LocationDTO = {
      vehicleId: this.veiculoId,
      latitude: this.currentLocation ?
        this.currentLocation.latitude + (Math.random() - 0.5) * 0.002 :
        -23.5505 + (Math.random() - 0.5) * 0.002,
      longitude: this.currentLocation ?
        this.currentLocation.longitude + (Math.random() - 0.5) * 0.002 :
        -46.6333 + (Math.random() - 0.5) * 0.002,
      speed: Math.random() * 80,
      status: Math.random() > 0.2 ? 'moving' : 'stopped'
    };

    const sub = this.trackingService.updateLocation(mockLocation).subscribe({
      next: (response) => {
        console.log('✅ Localização enviada:', response);
      },
      error: (error) => {
        console.error('❌ Erro ao enviar:', error);
      }
    });
    this.subscriptions.push(sub);
  }

  private startWithMockData() {
    const mockLocation: VehicleLocation = {
      id: 1,
      veiculo: {
        id: this.veiculoId,
        matricula: this.selectedPlate || 'ABC-1234'
      },
      latitude: -23.5505,
      longitude: -46.6333,
      speed: 0,
      status: 'stopped',
      timestamp: new Date()
    };

    this.currentLocation = mockLocation;
    if (this.mapInitialized) {
      this.updateMapLocation(mockLocation);
    }
  }

  private loadMockHistory() {
    const mockHistory: VehicleLocation[] = [];
    const startLat = -23.5505;
    const startLng = -46.6333;

    for (let i = 0; i < 20; i++) {
      mockHistory.push({
        id: i,
        veiculo: {
          id: this.veiculoId,
          matricula: this.selectedPlate
        },
        latitude: startLat + (i * 0.001),
        longitude: startLng + (i * 0.001),
        speed: Math.random() * 60,
        status: Math.random() > 0.3 ? 'moving' : 'stopped',
        timestamp: new Date(Date.now() - (19 - i) * 300000)
      });
    }

    this.locationHistory = mockHistory;
    this.processHistoryData();
    this.showTrajectory = true;
    this.showHistoryOnMap();
  }

  // ============ UTILITÁRIOS ============

  private mostrarErro(mensagem: string) {
    this.snackBar.open(mensagem, 'Fechar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private mostrarSucesso(mensagem: string) {
    this.snackBar.open(mensagem, 'Fechar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  }

  // Método para debug - chamar do console
  debugAbastecimentos() {
    console.log('🔍 DEBUG - Todos abastecimentos:', this.abastecimentos);
    console.log('🔍 DEBUG - Abastecimentos do veículo atual:', this.abastecimentosDoVeiculoAtual);
    console.log('🔍 DEBUG - fuelStats:', this.fuelStats);
    console.log('🔍 DEBUG - Veículo ID:', this.veiculoId);
  }
}


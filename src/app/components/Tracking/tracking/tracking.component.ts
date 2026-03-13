import { AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocationDTO, LocationHistoryItem, VehicleLocation } from '../location.model';
import { TrackingServiceService } from '../tracking-service.service';
import { Observable, Subscription } from 'rxjs';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { VeiculosService } from '../../Veiculos/veiculos.service';
import { Veiculo } from '../../Veiculos/veiculos.model';
declare const google: any;

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './tracking.component.html',
  styleUrl: './tracking.component.css'
})
export class TrackingComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('mapContainer') mapContainer!: ElementRef;

  veiculoService = inject(VeiculosService);

  // Dados do veículo
  veiculoId: number = 0;
  selectedPlate: string = '';
  vehicles: Veiculo[] = [];
  vehicleOptions: { id: number; plate: string }[] = [];

  // Mapa
  map: any;
  marker: any;
  historyMarkers: any[] = [];
  historyPolyline: any;

  // Controlar visibilidade do trajeto
  showTrajectory: boolean = false;

  // Localizações
  currentLocation: VehicleLocation | null = null;
  locationHistory: VehicleLocation[] = [];
  filteredHistory: LocationHistoryItem[] = [];

  // Estados
  mapInitialized = false;
  isLoading = false;
  showHistory = false;
  selectedPeriod: string = '1h';

  // Estatísticas
  totalDistance: number = 0;
  averageSpeed: number = 0;
  maxSpeed: number = 0;
  activeTime: string = '0 min';

  private subscriptions: Subscription[] = [];

  constructor(private trackingService: TrackingServiceService) {}

  ngOnInit() {
    this.getAllVehicles();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initMap();
    }, 500);
  }

  ngOnDestroy() {
    this.trackingService.disconnect();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initMap() {
    if (!this.mapContainer?.nativeElement) {
      console.error('❌ Map container não encontrado');
      return;
    }

    try {
      if (typeof google === 'undefined' || !google.maps) {
        console.error('❌ Google Maps não carregado');
        return;
      }

      console.log('🗺️ Inicializando mapa...');

      const mapOptions = {
        center: { lat: -23.5505, lng: -46.6333 },
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };

      this.map = new google.maps.Map(this.mapContainer.nativeElement, mapOptions);
      this.mapInitialized = true;
      console.log('✅ Mapa inicializado');

      if (this.currentLocation) {
        this.updateMapLocation(this.currentLocation);
      }

      if (this.locationHistory.length > 0 && this.showTrajectory) {
        this.showHistoryOnMap();
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar mapa:', error);
    }
  }

  private getAllVehicles() {
    const sub = this.veiculoService.getVehicles().subscribe({
      next: (vehicles) => {
        this.vehicles = vehicles;
        this.vehicleOptions = vehicles.map((v: Veiculo) => ({
          id: v.id,
          plate: v.matricula
        }));

        console.log('✅ Veículos carregados:', this.vehicleOptions);

        if (this.vehicleOptions.length > 0) {
          // Seleciona o primeiro veículo da lista
          this.veiculoId = this.vehicleOptions[0].id;
          this.selectedPlate = this.vehicleOptions[0].plate;
          this.loadInitialLocation();
          this.subscribeToUpdates();
        }
      },
      error: (erro) => {
        console.error('❌ Erro ao carregar veículos:', erro);
        // Fallback para dados mock
        this.vehicleOptions = [
          { id: 1, plate: 'ABC-1234' },
          { id: 2, plate: 'DEF-5678' },
          { id: 3, plate: 'GHI-9012' }
        ];
        this.veiculoId = 1;
        this.selectedPlate = 'ABC-1234';
        this.loadInitialLocation();
        this.subscribeToUpdates();
      }
    });
    this.subscriptions.push(sub);
  }

  private loadInitialLocation() {
    if (!this.veiculoId) {
      console.warn('⚠️ veiculoId não definido');
      return;
    }

    this.isLoading = true;
    console.log('📥 Carregando última localização para veículo ID:', this.veiculoId, 'Placa:', this.selectedPlate);

    const sub = this.trackingService.getLastLocation(this.veiculoId).subscribe({
      next: (location) => {
        console.log('✅ Última localização recebida:', location);
        this.currentLocation = location;
        if (this.mapInitialized) {
          this.updateMapLocation(location);
        }
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

  // ============ WEBSOCKET ============
  private subscribeToUpdates() {
    if (!this.veiculoId) return;

    console.log('🔄 Inscrevendo para atualizações do veículo ID:', this.veiculoId);

    this.trackingService.subscribeToLocationUpdates(this.veiculoId, (location) => {
      console.log('📡 Atualização em tempo real recebida para veículo:', location.veiculo?.id);

      // Só atualiza se for do veículo atual
      if (location.veiculo?.id === this.veiculoId) {
        this.currentLocation = location;
        if (this.mapInitialized) {
          this.updateMapLocation(location);
        }
      }
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
          <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span>
        </p>
        <p style="margin: 5px 0;">
          <strong>Horário:</strong> ${new Date(location.timestamp).toLocaleString()}
        </p>
      </div>
    `;
  }

  // ============ TROCAR VEÍCULO SELECIONADO ============
  changeVehicle(event: any) {
    const selectedId = Number(event);
    const selected = this.vehicleOptions.find(v => v.id === selectedId);

    if (!selected) return;

    console.log('🔄 Trocando para veículo ID:', selectedId, 'Placa:', selected.plate);

    // Atualizar dados do veículo selecionado
    this.veiculoId = selectedId;
    this.selectedPlate = selected.plate;

    // Limpar dados anteriores
    this.currentLocation = null;
    this.locationHistory = [];
    this.filteredHistory = [];
    this.showHistory = false;
    this.showTrajectory = false;

    // Limpar mapa
    if (this.marker) {
      this.marker.setMap(null);
      this.marker = null;
    }
    this.clearHistoryMarkers(true);

    // Carregar dados do novo veículo
    this.loadInitialLocation();
    this.subscribeToUpdates();
  }

  // ============ CARREGAR HISTÓRICO ============
  loadHistory() {
    if (!this.veiculoId) {
      console.warn('⚠️ veiculoId não definido');
      return;
    }

    this.isLoading = true;
    this.showHistory = true;

    console.log('📥 Carregando histórico para veículo ID:', this.veiculoId, 'Placa:', this.selectedPlate, 'período:', this.selectedPeriod);

    let historyObservable: Observable<VehicleLocation[]>;

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
        console.log(`✅ Histórico carregado: ${history.length} registros para veículo ${this.selectedPlate}`);
        this.locationHistory = history;
        this.processHistoryData();
        this.showTrajectory = true;
        this.showHistoryOnMap();
        this.calculateStatistics();
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

  private calculateStatistics() {
    if (this.locationHistory.length < 2) return;

    let totalDist = 0;
    let totalSpeed = 0;
    let maxSpd = 0;
    let movingTime = 0;

    for (let i = 1; i < this.locationHistory.length; i++) {
      const loc1 = this.locationHistory[i-1];
      const loc2 = this.locationHistory[i];

      const dist = this.calculateDistance(
        loc1.latitude, loc1.longitude,
        loc2.latitude, loc2.longitude
      );
      totalDist += dist;

      totalSpeed += loc2.speed || 0;
      if (loc2.speed && loc2.speed > maxSpd) maxSpd = loc2.speed;

      if (loc2.status === 'moving') {
        const timeDiff = (new Date(loc2.timestamp).getTime() - new Date(loc1.timestamp).getTime()) / 60000;
        movingTime += timeDiff;
      }
    }

    this.totalDistance = Number(totalDist.toFixed(2));
    this.averageSpeed = Number((totalSpeed / this.locationHistory.length).toFixed(1));
    this.maxSpeed = Number(maxSpd.toFixed(1));
    this.activeTime = this.formatTime(movingTime);
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  private formatTime(minutes: number): string {
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}min`;
  }

  // ============ SIMULAÇÃO ============
  simulateLocationUpdate() {
    if (!this.veiculoId) {
      console.warn('⚠️ veiculoId não definido');
      return;
    }

    console.log('🎮 Simulando movimento para veículo:', this.selectedPlate);

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

    console.log('📤 Enviando localização para veículo ID:', this.veiculoId);

    const sub = this.trackingService.updateLocation(mockLocation).subscribe({
      next: (response) => {
        console.log('✅ Localização enviada para o backend:', response);
      },
      error: (error) => {
        console.error('❌ Erro ao enviar para backend:', error);
        // Fallback local
        const localUpdate: VehicleLocation = {
          id: Date.now(),
          veiculo: {
            id: this.veiculoId,
            matricula: this.selectedPlate
          },
          latitude: mockLocation.latitude,
          longitude: mockLocation.longitude,
          speed: mockLocation.speed || 0,
          status: mockLocation.status || 'unknown',
          timestamp: new Date()
        };
        this.currentLocation = localUpdate;
        if (this.mapInitialized) {
          this.updateMapLocation(localUpdate);
        }
      }
    });
    this.subscriptions.push(sub);
  }

  private startWithMockData() {
    console.log('📦 Usando dados mock para veículo:', this.selectedPlate);
    const mockLocation: VehicleLocation = {
      id: 1,
      veiculo: {
        id: this.veiculoId,
        matricula: this.selectedPlate
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
    console.log('📦 Carregando histórico mock para veículo:', this.selectedPlate);
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
    this.calculateStatistics();
  }
}

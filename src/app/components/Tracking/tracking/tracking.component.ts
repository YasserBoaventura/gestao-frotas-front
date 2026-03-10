import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocationDTO, LocationHistoryItem, VehicleLocation } from '../location.model';
import { TrackingServiceService } from '../tracking-service.service';
import { Observable } from 'rxjs';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
declare const google: any;

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [CommonModule,CommonModule, FormsModule, HttpClientModule],
  templateUrl: './tracking.component.html',
  styleUrl: './tracking.component.css'
})
export class TrackingComponent implements OnInit, AfterViewInit, OnDestroy {
   @ViewChild('mapContainer') mapContainer!: ElementRef;

  // Dados do veículo
  vehicleId = 'vehicle-001';
  vehicleIds: string[] = ['vehicle-001', 'vehicle-002', 'vehicle-003'];
  
  // Mapa
  map: any;
  marker: any;
  historyMarkers: any[] = [];
  historyPolyline: any;
 
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

  constructor(private trackingService: TrackingServiceService) {}

  ngOnInit() {
    this.loadInitialLocation();
    this.subscribeToUpdates();
  }

  ngAfterViewInit() {
    setTimeout(() => this.initMap(), 500);
  }

  ngOnDestroy() {
    this.trackingService.disconnect();
  }

  // ============ INICIALIZAÇÃO ============
  private initMap() {
    if (!this.mapContainer?.nativeElement) return;

    try {
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
      console.error('Erro ao inicializar mapa:', error);
    }
  }

  // ============ CARREGAR DADOS ============
  private loadInitialLocation() {
    this.isLoading = true;

    this.trackingService.getLastLocation(this.vehicleId).subscribe({
      next: (location) => {
        this.currentLocation = location;
        if (this.mapInitialized) {
          this.updateMapLocation(location);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar localização', error);
        this.startWithMockData();
        this.isLoading = false;
      }
    });
  }

  // ============ WEBSOCKET ============
  private subscribeToUpdates() {
    this.trackingService.subscribeToLocationUpdates(this.vehicleId, (location) => {
      this.currentLocation = location;
      if (this.mapInitialized) {
        this.updateMapLocation(location);
      }
    });
  }

  // ============ ATUALIZAR MAPA ============
  private updateMapLocation(location: VehicleLocation) {
    if (!this.map || !this.mapInitialized) return;

    const position = { lat: location.latitude, lng: location.longitude };

    if (this.marker) {
      this.marker.setPosition(position);
    } else {
      // Marcador personalizado
      const markerIcon = {
        url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
        scaledSize: new google.maps.Size(40, 40)
      };

      this.marker = new google.maps.Marker({
        position: position,
        map: this.map,
        title: `Veículo ${this.vehicleId}`,
        icon: markerIcon,
        animation: google.maps.Animation.DROP
      });

      // Info window
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

    return `
      <div style="padding: 12px; font-family: Arial, sans-serif; max-width: 250px;">
        <h3 style="margin: 0 0 8px 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 5px;">
          🚗 Veículo ${location.vehicleId}
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
        <p style="margin: 5px 0; font-size: 11px; color: #666;">
          <strong>Lat:</strong> ${location.latitude.toFixed(6)}<br>
          <strong>Lng:</strong> ${location.longitude.toFixed(6)}
        </p>
      </div>
    `;
  }

  // ============ FUNCIONALIDADES NOVAS ============

  // Trocar veículo
  changeVehicle(vehicleId: string) {
    this.vehicleId = vehicleId;
    this.currentLocation = null;
    this.locationHistory = [];
    this.filteredHistory = [];
    this.showHistory = false;

    // Limpar marcadores de histórico
    this.clearHistoryMarkers();

    // Carregar dados do novo veículo
    this.loadInitialLocation();
    this.subscribeToUpdates();
  }

  // Carregar histórico
  loadHistory() {
    this.isLoading = true;
    this.showHistory = true;

    let historyObservable: Observable<VehicleLocation[]>;

    switch(this.selectedPeriod) {
      case '1h':
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);
        historyObservable = this.trackingService.getLocationHistory(this.vehicleId, oneHourAgo);
        break;
      case '24h':
        historyObservable = this.trackingService.getLast24HoursHistory(this.vehicleId);
        break;
      case 'today':
        historyObservable = this.trackingService.getTodayHistory(this.vehicleId);
        break;
      default:
        historyObservable = this.trackingService.getLocationHistory(this.vehicleId);
    }

    historyObservable.subscribe({
      next: (history) => {
        this.locationHistory = history;
        this.processHistoryData();
        this.showHistoryOnMap();
        this.calculateStatistics();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar histórico:', error);
        this.loadMockHistory(); // Mock para teste
        this.isLoading = false;
      }
    });
  }

  // Processar dados do histórico para exibição
  private processHistoryData() {
    this.filteredHistory = this.locationHistory.map((loc, index) => {
      let color = '#28a745'; // verde para moving
      if (loc.status === 'stopped') color = '#dc3545'; // vermelho para stopped
      if (loc.speed && loc.speed < 10) color = '#ffc107'; // amarelo para lento

      return {
        id: index + 1,
        time: new Date(loc.timestamp).toLocaleTimeString(),
        latitude: loc.latitude.toFixed(6),
        longitude: loc.longitude.toFixed(6),
        speed: loc.speed?.toFixed(1) || '0',
        status: loc.status || 'unknown',
        color: color
      };
    }).reverse(); // Mais recentes primeiro
  }

  // Mostrar histórico no mapa
  private showHistoryOnMap() {
    if (!this.map || !this.mapInitialized) return;

    // Limpar marcadores anteriores
    this.clearHistoryMarkers();

    if (this.locationHistory.length === 0) return;

    // Criar linha do trajeto
    const path = this.locationHistory.map(loc => ({
      lat: loc.latitude,
      lng: loc.longitude
    }));

    this.historyPolyline = new google.maps.Polyline({
      path: path,
      geodesic: true,
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 3
    });

    this.historyPolyline.setMap(this.map);

    // Adicionar marcadores para pontos importantes
    this.locationHistory.forEach((loc, index) => {
      // Mostrar apenas alguns pontos para não poluir
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

    // Ajustar zoom para mostrar todo o trajeto
    const bounds = new google.maps.LatLngBounds();
    path.forEach(point => bounds.extend(point));
    this.map.fitBounds(bounds);
  }

  // Limpar marcadores de histórico
  private clearHistoryMarkers() {
    if (this.historyPolyline) {
      this.historyPolyline.setMap(null);
    }

    this.historyMarkers.forEach(marker => marker.setMap(null));
    this.historyMarkers = [];
  }

  // Calcular estatísticas
  private calculateStatistics() {
    if (this.locationHistory.length < 2) return;

    let totalDist = 0;
    let totalSpeed = 0;
    let maxSpd = 0;
    let movingTime = 0;

    for (let i = 1; i < this.locationHistory.length; i++) {
      const loc1 = this.locationHistory[i-1];
      const loc2 = this.locationHistory[i];

      // Distância entre pontos (fórmula de Haversine simplificada)
      const dist = this.calculateDistance(
        loc1.latitude, loc1.longitude,
        loc2.latitude, loc2.longitude
      );
      totalDist += dist;

      // Velocidades
      totalSpeed += loc2.speed || 0;
      if (loc2.speed && loc2.speed > maxSpd) maxSpd = loc2.speed;

      // Tempo em movimento
      if (loc2.status === 'moving') {
        const timeDiff = (new Date(loc2.timestamp).getTime() - new Date(loc1.timestamp).getTime()) / 60000; // minutos
        movingTime += timeDiff;
      }
    }

    this.totalDistance = Number(totalDist.toFixed(2));
    this.averageSpeed = Number((totalSpeed / this.locationHistory.length).toFixed(1));
    this.maxSpeed = Number(maxSpd.toFixed(1));
    this.activeTime = this.formatTime(movingTime);
  }

  // Calcular distância entre coordenadas (km)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Raio da Terra em km
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

  // Fechar histórico
  closeHistory() {
    this.showHistory = false;
    this.clearHistoryMarkers();

    // Voltar para localização atual
    if (this.currentLocation && this.map) {
      this.map.setCenter({
        lat: this.currentLocation.latitude,
        lng: this.currentLocation.longitude
      });
      this.map.setZoom(15);
    }
  }

  // ============ MOCK DATA PARA TESTES ============
  private startWithMockData() {
    const mockLocation: VehicleLocation = {
      id: 1,
      vehicleId: this.vehicleId,
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
        vehicleId: this.vehicleId,
        latitude: startLat + (i * 0.001),
        longitude: startLng + (i * 0.001),
        speed: Math.random() * 60,
        status: Math.random() > 0.3 ? 'moving' : 'stopped',
        timestamp: new Date(Date.now() - (19 - i) * 300000)
      });
    }

    this.locationHistory = mockHistory;
    this.processHistoryData();
    this.showHistoryOnMap();
    this.calculateStatistics();
  }

  simulateLocationUpdate() {
    const mockLocation: LocationDTO = {
      vehicleId: this.vehicleId,
      latitude: this.currentLocation ?
        this.currentLocation.latitude + (Math.random() - 0.5) * 0.002 : -23.5505,
      longitude: this.currentLocation ?
        this.currentLocation.longitude + (Math.random() - 0.5) * 0.002 : -46.6333,
      speed: Math.random() * 80,
      status: Math.random() > 0.2 ? 'moving' : 'stopped'
    };

  }

}

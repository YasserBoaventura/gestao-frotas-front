import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocationDTO, VehicleLocation } from '../location.model';
import { TrackingServiceService } from '../tracking-service.service';
declare const google: any;

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tracking.component.html',
  styleUrl: './tracking.component.css'
})
export class TrackingComponent implements OnInit, AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;


  vehicleId = 'vehicle-001';
  map: any;
  marker: any;
  locations: VehicleLocation[] = [];
  currentLocation: VehicleLocation | null = null;

  constructor(private trackingService: TrackingServiceService) {}

  ngOnInit() {
    this.loadInitialLocation();
    this.subscribeToUpdates();
  }

  ngAfterViewInit() {
    this.initMap();
  }

  private initMap() {
    // Inicializar mapa com localização padrão
    this.map = new google.maps.Map(this.mapContainer.nativeElement, {
      center: { lat: -23.5505, lng: -46.6333 },
      zoom: 15
    });
  }

  private loadInitialLocation() {
    this.trackingService.getLastLocation(this.vehicleId).subscribe({
      next: (location) => {
        this.currentLocation = location;
        this.updateMapLocation(location);
      },
      error: (error) => console.error('Erro ao carregar localização', error)
    });
  }

  private subscribeToUpdates() {
    this.trackingService.subscribeToLocationUpdates(this.vehicleId, (location) => {
      this.currentLocation = location;
      this.updateMapLocation(location);
    });
  }

  private updateMapLocation(location: VehicleLocation) {
    const position = { lat: location.latitude, lng: location.longitude };

    if (this.marker) {
      this.marker.setPosition(position);
    } else {
      this.marker = new google.maps.Marker({
        position: position,
        map: this.map,
        title: `Veículo ${this.vehicleId}`
      });
    }

    this.map.setCenter(position);

    // Adicionar info window
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div>
          <h3>Veículo ${location.vehicleId}</h3>
          <p>Velocidade: ${location.speed || 0} km/h</p>
          <p>Status: ${location.status || 'Ativo'}</p>
          <p>Horário: ${new Date(location.timestamp).toLocaleTimeString()}</p>
        </div>
      `
    });

    this.marker.addListener('click', () => {
      infoWindow.open(this.map, this.marker);
    });
  }

  simulateLocationUpdate() {
    // Simular movimento do veículo
    const mockLocation: LocationDTO = {
      vehicleId: this.vehicleId,
      latitude: this.currentLocation ?
        this.currentLocation.latitude + (Math.random() - 0.5) * 0.001 : -23.5505,
      longitude: this.currentLocation ?
        this.currentLocation.longitude + (Math.random() - 0.5) * 0.001 : -46.6333,
      speed: Math.random() * 60,
      status: 'moving'
    };

    this.trackingService.updateLocation(mockLocation).subscribe();
  }
} 

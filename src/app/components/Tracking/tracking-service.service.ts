import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LocationDTO, VehicleLocation } from './location.model';

import { Client, CompatClient, Stomp } from '@stomp/stompjs';
import { Observable } from 'rxjs';
import SockJS from 'sockjs-client';
@Injectable({
  providedIn: 'root'
})
export class TrackingServiceService {
  private apiUrl = 'http://localhost:9001/api/tracking';
  private stompClient: any = null;
  private connected: boolean = false;

  constructor(private http: HttpClient) {}

  // ============ WEBSOCKET ============
  private connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve(); 
        return;
      }

      try {
        const socket = new SockJS('http://localhost:9001/ws-tracking');
        this.stompClient = Stomp.over(socket);
        this.stompClient.debug = () => {};

        this.stompClient.connect({},
          () => {
            console.log('✅ Conectado ao WebSocket');
            this.connected = true;
            resolve();
          },
          (error: any) => {
            console.error('❌ Erro na conexão WebSocket:', error);
            this.connected = false;
            reject(error);
          }
        );
      } catch (error) {
        console.error('❌ Erro ao inicializar WebSocket:', error);
        reject(error);
      }
    });
  }

  // ============ REQUISIÇÕES HTTP ============

  // POST - Enviar nova localização
  updateLocation(location: LocationDTO): Observable<VehicleLocation> {
    console.log('📤 Enviando localização para veículo ID:', location.vehicleId);
    return this.http.post<VehicleLocation>(`${this.apiUrl}/location`, location);
  }

  // GET - Buscar última localização por ID do veículo
  getLastLocation(veiculoId: number): Observable<VehicleLocation> {
    console.log('📥 Buscando última localização do veículo ID:', veiculoId);
    return this.http.get<VehicleLocation>(`${this.apiUrl}/location/${veiculoId}/last`);
  }

  // GET - Buscar última localização por placa
  getLastLocationByPlate(plate: string): Observable<VehicleLocation> {
    console.log('📥 Buscando última localização da placa:', plate);
    return this.http.get<VehicleLocation>(`${this.apiUrl}/location/plate/${plate}/last`);
  }

  // GET - Buscar histórico de localizações por ID do veículo
  getLocationHistory(veiculoId: number, since?: Date): Observable<VehicleLocation[]> {
    let url = `${this.apiUrl}/location/${veiculoId}/history`;
    if (since) {
      url += `?since=${since.toISOString()}`;
    }
    console.log('📥 Buscando histórico do veículo ID:', veiculoId);
    return this.http.get<VehicleLocation[]>(url);
  }

  // GET - Buscar histórico por placa
  getLocationHistoryByPlate(plate: string, since?: Date): Observable<VehicleLocation[]> {
    let url = `${this.apiUrl}/location/plate/${plate}/history`;
    if (since) {
      url += `?since=${since.toISOString()}`;
    }
    return this.http.get<VehicleLocation[]>(url);
  }

  // GET - Buscar histórico das últimas 24 horas
  getLast24HoursHistory(veiculoId: number): Observable<VehicleLocation[]> {
    const since = new Date();
    since.setHours(since.getHours() - 24);
    return this.getLocationHistory(veiculoId, since);
  }

  // GET - Buscar histórico de hoje
  getTodayHistory(veiculoId: number): Observable<VehicleLocation[]> {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    return this.getLocationHistory(veiculoId, since);
  }

  // ============ WEBSOCKET SUBSCRIBE ============
  subscribeToLocationUpdates(veiculoId: number, callback: (location: VehicleLocation) => void) {
    console.log('🔄 Assinando atualizações para veículo ID:', veiculoId);

    this.connectWebSocket()
      .then(() => {
        if (this.stompClient && this.connected) {
          this.stompClient.subscribe(`/topic/locations/${veiculoId}`, (message: any) => {
            try {
              const location: VehicleLocation = JSON.parse(message.body);
              console.log('📡 Nova localização recebida:', location);
              callback(location);
            } catch (error) {
              console.error('Erro ao processar mensagem:', error);
            }
          });
        }
      })
      .catch(error => {
        console.error('❌ WebSocket falhou, usando polling:', error);
        setInterval(() => {
          this.getLastLocation(veiculoId).subscribe({
            next: (location) => callback(location),
            error: (err) => console.error('Erro no fallback:', err)
          });
        }, 10000);
      });
  }

  disconnect() {
    if (this.stompClient && this.connected) {
      this.stompClient.disconnect(() => {
        console.log('🔌 Desconectado do WebSocket');
        this.connected = false;
      });
    }
  }
}

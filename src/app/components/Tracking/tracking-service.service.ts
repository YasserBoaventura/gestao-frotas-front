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
    console.log('📤 Enviando localização:', location);
    return this.http.post<VehicleLocation>(`${this.apiUrl}/location`, location);
  }

  // GET - Buscar última localização de um veículo
  getLastLocation(vehicleId: string): Observable<VehicleLocation> {
    console.log('📥 Buscando última localização do:', vehicleId);
    return this.http.get<VehicleLocation>(`${this.apiUrl}/location/${vehicleId}/last`);
  }

  // GET - Buscar histórico de localizações
  getLocationHistory(vehicleId: string, since?: Date): Observable<VehicleLocation[]> {
    let url = `${this.apiUrl}/location/${vehicleId}/history`;
    if (since) {
      url += `?since=${since.toISOString()}`;
    }
    console.log('📥 Buscando histórico do:', vehicleId);
    return this.http.get<VehicleLocation[]>(url);
  }

  // GET - Buscar histórico das últimas 24 horas
  getLast24HoursHistory(vehicleId: string): Observable<VehicleLocation[]> {
    const since = new Date();
    since.setHours(since.getHours() - 24);
    return this.getLocationHistory(vehicleId, since);
  }

  // GET - Buscar histórico de hoje
  getTodayHistory(vehicleId: string): Observable<VehicleLocation[]> {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    return this.getLocationHistory(vehicleId, since);
  }

  // ============ WEBSOCKET SUBSCRIBE ============
  subscribeToLocationUpdates(vehicleId: string, callback: (location: VehicleLocation) => void) {
    console.log('🔄 Assinando atualizações para:', vehicleId);

    this.connectWebSocket()
      .then(() => {
        if (this.stompClient && this.connected) {
          this.stompClient.subscribe(`/topic/locations/${vehicleId}`, (message: any) => {
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
        // Fallback: polling a cada 10 segundos
        setInterval(() => {
          this.getLastLocation(vehicleId).subscribe({
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

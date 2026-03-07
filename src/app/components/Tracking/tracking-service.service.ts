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

private apiUrl = 'http://localhost:8080/api/tracking';
  private stompClient: CompatClient | null = null;
  private connected = false;

  constructor(private http: HttpClient) {}

  private initWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve();
        return;
      }

      try {
        // Criar conexão SockJS
        const socket = new SockJS('http://localhost:8080/ws-tracking');
        this.stompClient = Stomp.over(socket);

        // Desabilitar logs do STOMP para produção
        this.stompClient.debug = () => {};

        // Conectar
        this.stompClient.connect({},
          () => {
            console.log('Conectado ao WebSocket');
            this.connected = true;
            resolve();
          },
          (error: any) => {
            console.error('Erro na conexão WebSocket:', error);
            this.connected = false;
            reject(error);
          }
        );
      } catch (error) {
        console.error('Erro ao inicializar WebSocket:', error);
        reject(error);
      }
    });
  }

  updateLocation(location: LocationDTO): Observable<VehicleLocation> {
    return this.http.post<VehicleLocation>(`${this.apiUrl}/location`, location);
  }

  getLastLocation(vehicleId: string): Observable<VehicleLocation> {
    return this.http.get<VehicleLocation>(`${this.apiUrl}/location/${vehicleId}/last`);
  }

  getLocationHistory(vehicleId: string, since?: Date): Observable<VehicleLocation[]> {
    let url = `${this.apiUrl}/location/${vehicleId}/history`;
    if (since) {
      url += `?since=${since.toISOString()}`;
    }
    return this.http.get<VehicleLocation[]>(url);
  }

  subscribeToLocationUpdates(vehicleId: string, callback: (location: VehicleLocation) => void) {
    this.initWebSocket()
      .then(() => {
        if (this.stompClient && this.connected) {
          this.stompClient.subscribe(`/topic/locations/${vehicleId}`, (message) => {
            try {
              const location: VehicleLocation = JSON.parse(message.body);
              callback(location);
            } catch (error) {
              console.error('Erro ao processar mensagem:', error);
            }
          });
        }
      })
      .catch(error => {
        console.error('Não foi possível conectar ao WebSocket:', error);
      });
  }

  disconnect() {
    if (this.stompClient && this.connected) {
      this.stompClient.disconnect(() => {
        console.log('Desconectado do WebSocket');
        this.connected = false;
      });
    }
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Veiculo } from './veiculos.model';
@Injectable({
  providedIn: 'root'
})
export class VeiculosService {




   private apiUrl = 'http://localhost:9000/api/veiculos';

  constructor(private http: HttpClient) {}

  getVehicles(): Observable<Veiculo[]> {
    return this.http.get<Veiculo[]>(this.apiUrl+"/findAll" );
  }

 createVehicle(vehicle: any): Observable<any> {
  return this.http.post(this.apiUrl+"/salvar", vehicle);
  // Não especifique responseType, deixe o Angular detectar como JSON (padrão)
}
  updateVehicle(vehicle: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${vehicle.id}`, vehicle);
  }

  deleteVehicle(id: number): Observable<String> {
    return this.http.delete(this.apiUrl+"/delete/"+id,{responseType: 'json' as 'text'});
  }


}

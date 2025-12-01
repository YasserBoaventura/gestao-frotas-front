import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Veiculo } from './veiculos.model';
@Injectable({
  providedIn: 'root'
})
export class VeiculosService {




   private apiUrl = 'http://localhost:9001/api/veiculos';

  constructor(private http: HttpClient) {}

  getVehicles(): Observable<Veiculo[]> {
    return this.http.get<Veiculo[]>(this.apiUrl+"/findAll" );
  }

 createVehicle(vehicle: any): Observable<any> {
  return this.http.post(this.apiUrl+"/salvar", vehicle);
  // Não especifique responseType, deixe o Angular detectar como JSON (padrão)
}
 update(veiculo: any, id: number): Observable<string>{
   return this.http.put<string>(this.apiUrl+"/update/"+id , veiculo,{responseType: 'text' as 'json'});
 }

  deleteVehicle(id: number): Observable<String> {
    return this.http.delete(this.apiUrl+"/delete/"+id,{responseType: 'json' as 'text'});
  }


}

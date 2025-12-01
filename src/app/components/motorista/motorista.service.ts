import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Motorista } from './motorista';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class MotoristaService {

   private apiUrl = 'http://localhost:9001/api/motorista';

   constructor(private http: HttpClient) {}

   //Busca os motoristas do
   getMotoristas(): Observable<Motorista[]> {
      return this.http.get<Motorista[]>(this.apiUrl+"/findAll" );
    }

   salvar(motorista: any): Observable<string> {
    return this.http.post(this.apiUrl+"/save", motorista, {
      responseType: 'text'
    });
    // Não especifique responseType, deixe o Angular detectar como JSON (padrão)
  }
 eliminar(id: number): Observable<any> {
  // Se o backend espera DELETE na rota "/delete/{id}"
  return this.http.delete(`${this.apiUrl}/delete/${id}`, {
    responseType: 'text' // Importante: esperamos texto como resposta
  });
}
//atualiza os DADOS
update(motorista: Motorista, id: number): Observable<string>{
  return this.http.put<string>(this.apiUrl+"/update/"+id , motorista,{responseType: 'text' as 'json'});
}

findByNome(nome: string): Observable<Motorista[]> {
  return this.http.get<Motorista[]>(`${this.apiUrl}/findByNome/${encodeURIComponent(nome)}`);
}
}

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Veiculo } from '../Veiculos/veiculos.model';
import { Observable } from 'rxjs';
import { Abastecimento } from './abastecimento';
import { Viagem } from '../viagens/viagem';

@Injectable({
  providedIn: 'root'
})
export class AbstecimeserviceService {

  private apiUrl = 'http://localhost:9001/api/abastecimentos';
  private veiculosUrl = 'http://localhost:9001/api/veiculos';
  private viagensUrl = 'http://localhost:9001/api/viagens';

  constructor(private http: HttpClient) { }

  // CRUD de Abastecimentos
  getAbastecimentos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl+'/findAll');
  }

  getAbastecimento(id: number): Observable<Abastecimento> {
    return this.http.get<Abastecimento>(`${this.apiUrl}/findById/${id}`);
  }

  createAbastecimento(abastecimento: Abastecimento): Observable<any> {
    return this.http.post<any>(this.apiUrl+"/save", abastecimento, {
      responseType: 'json'
    }) ;
  }

  // No seu abastecimento.service.ts
updateAbastecimento(id: number, abastecimentoDTO: any): Observable<string> {
  console.log('Atualizando abastecimento ID:', id, 'DTO:', abastecimentoDTO);

  // Remover o id do corpo se existir, pois já está na URL
  const body = { ...abastecimentoDTO };
  delete body.id;

  return this.http.put<string>(
    `${this.apiUrl}/update/${id}`,
    body,
    {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      responseType: 'text' as 'json'
    }
  );
}



  deleteAbastecimento(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`,{
      responseType: 'text' as 'json'
    });
  }

  // Listagens para associações
  getVeiculos(): Observable<Veiculo[]> {
    return this.http.get<Veiculo[]>(this.veiculosUrl+"/findAll");
  }

  getViagens(): Observable<Viagem[]> {
    return this.http.get<Viagem[]>(this.viagensUrl+"/findAll");
  }

  getViagensPorVeiculo(veiculoId: number): Observable<Viagem[]> {
    return this.http.get<Viagem[]>(`${this.viagensUrl}/veiculoss/${veiculoId}`);
  }

  calcularValorTotal(quantidadeLitros: number, precoPorLitro: number): number {
    return quantidadeLitros * precoPorLitro;
  }


}

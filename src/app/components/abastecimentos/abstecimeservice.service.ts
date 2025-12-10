import { HttpClient } from '@angular/common/http';
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
  getAbastecimentos(): Observable<Abastecimento[]> {
    return this.http.get<Abastecimento[]>(this.apiUrl+'/findAll');
  }

  getAbastecimento(id: number): Observable<Abastecimento> {
    return this.http.get<Abastecimento>(`${this.apiUrl}/findById/${id}`);
  }

  createAbastecimento(abastecimento: any): Observable<any> {
    return this.http.post<any>(this.apiUrl+"/save", abastecimento);
  }

  updateAbastecimento(abastecimento: Abastecimento): Observable<Abastecimento> {
    return this.http.put<Abastecimento>(`${this.apiUrl}/update/${abastecimento.id}`, abastecimento);
  }

  deleteAbastecimento(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
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

import { Injectable } from '@angular/core';
import { Viagem } from './viagem';
import { map, Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { RelatorioMotoristaDTO } from '../../models/relatorio-motorista-dto';
import { RelatorioVeiculoDTO } from '../../models/relatorio-veiculo-dto';

@Injectable({
  providedIn: 'root'
})
export class ViagensServiceService {

 private apiUrl = 'http://localhost:9001/api/viagens';

  constructor(private http: HttpClient) {}

  getViagens(): Observable<Viagem[]> {
    return this.http.get<Viagem[]>(this.apiUrl+"/findAll");
  }

  getViagem(id: number): Observable<Viagem> {
    return this.http.get<Viagem>(`${this.apiUrl}/${id}`);
  }

  createViagem(viagem: Viagem): Observable<Viagem> {
    return this.http.post<Viagem>(this.apiUrl+"/save", viagem);
  }

  updateViagem(viagem: Viagem): Observable<string> {
    return this.http.put<string>(`${this.apiUrl}/update/${viagem.id}`, viagem, { responseType: 'text' as 'json' });
  }

   deleteViagem(id: number): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/delete/${id}`,{
      responseType: 'text' as 'json'
    });
  }

  iniciarViagem(id: number): Observable<Viagem> {
    return this.http.patch<Viagem>(`${this.apiUrl}/${id}/iniciar`, {});
  }

  concluirViagem(dados: any, id: number ): Observable<Viagem> {
    return this.http.put<Viagem>(`${this.apiUrl}/concluir/${id}`, dados);
  }

 cancelarViagem(id: number, dados: { observacoes?: string }): Observable<Viagem> {
  return this.http.put<Viagem>(`${this.apiUrl}/cancelarViagem/${id}`, dados);
}



  // Viagens por motorista
  getViagensPorMotorista(motoristaId: number): Observable<Viagem[]> {
    return this.http.get<Viagem[]>(`${this.apiUrl}/motorista/${motoristaId}`);
  }

  // Viagens por status
  getViagensPorStatus(status: string): Observable<Viagem[]> {
    return this.http.get<Viagem[]>(`${this.apiUrl}/status/${status}`);
  }

  // Viagens por período
  getViagensPorPeriodo(dataInicio: string, dataFim: string): Observable<Viagem[]> {
    return this.http.get<Viagem[]>(`${this.apiUrl}/periodo?inicio=${dataInicio}&fim=${dataFim}`);
  }


 getRelatorioMotorista(filtros?: any): Observable<RelatorioMotoristaDTO[]> {
  // Construir parâmetros de query
  let params = new HttpParams();

  if (filtros?.dataInicio) {
    params = params.set('dataInicio', filtros.dataInicio);
  }
  if (filtros?.dataFim) {
    params = params.set('dataFim', filtros.dataFim);
  }
  if (filtros?.status) {
    params = params.set('status', filtros.status);
  }
  if (filtros?.motoristaId) {
    params = params.set('motoristaId', filtros.motoristaId);
  }
  if (filtros?.veiculoId) {
    params = params.set('veiculoId', filtros.veiculoId);
  }

  return this.http.get<RelatorioMotoristaDTO[]>(`${this.apiUrl}/motoristas`, { params }).pipe(
    map(data => data.map(item => ({
      ...item,
      // Criar aliases para os campos usados no template
      totalKm: item.totalQuilometragem || 0,
      totalKmPercorridos: item.totalQuilometragem || 0,
      totalLitrosAbastecidos: item.totalCombustivel || 0,
      mediaConsumo: item.totalCombustivel > 0 ?
        (item.totalQuilometragem / item.totalCombustivel) : 0
    })))
  );
}

getRelatorioVeiculo(filtros?: any): Observable<RelatorioVeiculoDTO[]> {
  // Construir parâmetros de query
  let params = new HttpParams();

  if (filtros?.dataInicio) {
    params = params.set('dataInicio', filtros.dataInicio);
  }
  if (filtros?.dataFim) {
    params = params.set('dataFim', filtros.dataFim);
  }
  if (filtros?.status) {
    params = params.set('status', filtros.status);
  }
  if (filtros?.motoristaId) {
    params = params.set('motoristaId', filtros.motoristaId);
  }
  if (filtros?.veiculoId) {
    params = params.set('veiculoId', filtros.veiculoId);
  }

  return this.http.get<RelatorioVeiculoDTO[]>(`${this.apiUrl}/veiculos`, { params }).pipe(
    map(data => data.map(item => ({
      ...item,
      // Criar aliases para os campos usados no template
      matriculaVeiculo: item.matriculaVeiculo || item.veiculo || 'N/A',
      totalKm: item.totalKm || 0,
     totalKmPercorridos: item.totalQuilometragem || 0,
      totalLitrosAbastecidos: item.totalCombustivel || 0,
      mediaConsumo: item.totalCombustivel > 0 ?
        (item.totalQuilometragem / item.totalCombustivel) : 0
    })))
  );
}

}

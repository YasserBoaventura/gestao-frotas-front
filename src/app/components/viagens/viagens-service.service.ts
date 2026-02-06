import { Injectable } from '@angular/core';
import { Viagem } from './viagem';
import { map, Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { RelatorioMotoristaDTO } from '../../models/relatorio-motorista-dto';
import { RelatorioVeiculoDTO } from '../../models/relatorio-veiculo-dto';
import { RelatorioGeralDTO } from '../relatorioViagem/relatorioservice';

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

  createViagem(viagem: Viagem): Observable<string> {
    return this.http.post<string>(this.apiUrl+"/save", viagem, {
      responseType: 'text' as 'json'
    });
  }

  updateViagem(viagem: Viagem): Observable<string> {
    return this.http.put<string>(`${this.apiUrl}/update/${viagem.id}`, viagem, { responseType: 'text' as 'json' });
  }

   deleteViagem(id: number): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/delete/${id}`,{
      responseType: 'text' as 'json'
    });
  }

  iniciarViagem(id: number): Observable<string> {
    return this.http.put<string>(`${this.apiUrl}/inicializarViagem/${id}`, {      responseType: 'text'

    });
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

  getPorVeiculo(veiculoId: number): Observable<Viagem[]> {
    return this.http.get<Viagem[]>(`${this.apiUrl}/veiculoss/${veiculoId}`);
  }
  // Viagens por status
  getViagensPorStatus(status: string): Observable<Viagem[]> {
    return this.http.get<Viagem[]>(`${this.apiUrl}/status/${status}`);
  }

  // Viagens por período
  getViagensPorPeriodo(dataInicio: string, dataFim: string): Observable<Viagem[]> {
    return this.http.get<Viagem[]>(`${this.apiUrl}/periodo?inicio=${dataInicio}&fim=${dataFim}`);
  }








///






  getRelatorioMotorista(filtros?: any): Observable<RelatorioMotoristaDTO[]> {
    let params = new HttpParams();

    if (filtros) {
      if (filtros.dataInicio) {
        params = params.set('dataInicio', filtros.dataInicio);
      }
      if (filtros.dataFim) {
        params = params.set('dataFim', filtros.dataFim);
      }
      if (filtros.status) {
        params = params.set('status', filtros.status);
      }
      if (filtros.motoristaId) {
        params = params.set('motoristaId', filtros.motoristaId);
      }
      if (filtros.veiculoId) {
        params = params.set('veiculoId', filtros.veiculoId);
      }
    }

    return this.http.get<RelatorioMotoristaDTO[]>(`${this.apiUrl}/motoristas`, { params });
  }

  getRelatorioVeiculo(filtros?: any): Observable<RelatorioVeiculoDTO[]> {
    let params = new HttpParams();

    if (filtros) {
      if (filtros.dataInicio) {
        params = params.set('dataInicio', filtros.dataInicio);
      }
      if (filtros.dataFim) {
        params = params.set('dataFim', filtros.dataFim);
      }
      if (filtros.status) {
        params = params.set('status', filtros.status);
      }
      if (filtros.motoristaId) {
        params = params.set('motoristaId', filtros.motoristaId);
      }
      if (filtros.veiculoId) {
        params = params.set('veiculoId', filtros.veiculoId);
      }
    }

    return this.http.get<RelatorioVeiculoDTO[]>(`${this.apiUrl}/veiculos`, { params });
  }

  getRelatorioGeral(dataInicio?: string, dataFim?: string): Observable<RelatorioGeralDTO> {
    let params = new HttpParams();

    if (dataInicio) {
      params = params.set('dataInicio', dataInicio);
    }
    if (dataFim) {
      params = params.set('dataFim', dataFim);
    }

    return this.http.get<RelatorioGeralDTO>(`${this.apiUrl}/geral`, { params });
  }

  getViagenss(filtros?: any): Observable<any[]> {
    let params = new HttpParams();

    if (filtros) {
      if (filtros.dataInicio) {
        params = params.set('dataInicio', filtros.dataInicio);
      }
      if (filtros.dataFim) {
        params = params.set('dataFim', filtros.dataFim);
      }
      if (filtros.status) {
        params = params.set('status', filtros.status);
      }
      if (filtros.motoristaId) {
        params = params.set('motoristaId', filtros.motoristaId);
      }
      if (filtros.veiculoId) {
        params = params.set('veiculoId', filtros.veiculoId);
      }
    }

    return this.http.get<any[]>(`${this.apiUrl}/viagens`, { params });
  }

getViagensPorVeiculo(veiculoId: number): Observable<Viagem[]> {
  // IMPORTANTE: Teste este endpoint no Postman primeiro!
  return this.http.get<Viagem[]>(`http://localhost:9001/api/viagens/veiculo/${veiculoId}`);
}
}

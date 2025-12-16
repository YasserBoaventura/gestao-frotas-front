import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";

export interface RelatorioMotoristaDTO {
  nome: string;
  telefone: string;
  status: string;
  quantidadeViagens: number;
  totalKilometragem: number;
  totalLitrosAbastecidos: number;
}

export interface RelatorioPorVeiculoDTO {
  matricula: string;
  modelo: string;
  quantidadeViagens: number;
  totalKilometragem: number;
  totalLitrosAbastecidos: number;
}

export interface RelatorioDiarioDTO {
  data: string;
  quantidadeViagens: number;
  totalKilometragem: number;
  totalLitrosAbastecidos: number;
}

export interface RelatorioMensalDTO {
  ano: number;
  mes: number;
  quantidadeViagens: number;
  totalKilometragem: number;
  totalLitrosAbastecidos: number;
}

export interface RelatorioGeralDTO {
  totalViagens: number;
  totalMotoristas: number;
  totalVeiculos: number;
  totalKilometragem: number;
  totalLitrosAbastecidos: number;
  mediaKilometragemPorViagem: number;
}

export interface RelatorioTopMotoristasDTO {
  nomeMotorista: string;
  totalViagens: number;
  totalKilometragem: number;
}

export interface Viagem {
  id: number;
  dataHoraPartida: string;
  dataHoraChegada: string;
  kilometragemInicial: number;
  kilometragemFinal: number;
  status: string;
  motorista: any;
  veiculo: any;
  observacoes: string;
}

@Injectable({
  providedIn: 'root'
})
export class relatorioservice {
  private apiUrl = 'http://localhost:9001/api/viagens';
  private http = inject(HttpClient);

  // Testar conexão com a API
  testarConexao(): Observable<boolean> {
    return new Observable(observer => {
      this.http.get(`${this.apiUrl}/test`, { observe: 'response' })
        .subscribe({
          next: () => observer.next(true),
          error: () => observer.next(false),
          complete: () => observer.complete()
        });
    });
  }

  // Relatório por motorista
  getRelatorioMotorista(dataInicio?: string, dataFim?: string): Observable<RelatorioMotoristaDTO[]> {
    let params = new HttpParams();
    if (dataInicio) params = params.set('dataInicio', dataInicio);
    if (dataFim) params = params.set('dataFim', dataFim);
    return this.http.get<RelatorioMotoristaDTO[]>(`${this.apiUrl}/motoristas`, { params });
  }

  // Relatório por veículo
  getRelatorioVeiculo(): Observable<RelatorioPorVeiculoDTO[]> {
    return this.http.get<RelatorioPorVeiculoDTO[]>(`${this.apiUrl}/veiculos`);
  }

  // Relatório diário
  getRelatorioDiario(dataInicio: string, dataFim: string): Observable<RelatorioDiarioDTO[]> {
    const params = new HttpParams()
      .set('dataInicio', dataInicio)
      .set('dataFim', dataFim);
    return this.http.get<RelatorioDiarioDTO[]>(`${this.apiUrl}/diario`, { params });
  }

  // Relatório mensal
  getRelatorioMensal(dataInicio: string, dataFim: string): Observable<RelatorioMensalDTO[]> {
    const params = new HttpParams()
      .set('dataInicio', dataInicio)
      .set('dataFim', dataFim);
    return this.http.get<RelatorioMensalDTO[]>(`${this.apiUrl}/mensal`, { params });
  }

  // Relatório geral
  getRelatorioGeral(dataInicio: string, dataFim: string): Observable<RelatorioGeralDTO> {
    const params = new HttpParams()
      .set('dataInicio', dataInicio)
      .set('dataFim', dataFim);
    return this.http.get<RelatorioGeralDTO>(`${this.apiUrl}/geral`, { params });
  }

  // Top motoristas
  getTopMotoristas(dataInicio: string, dataFim: string): Observable<RelatorioTopMotoristasDTO[]> {
    const params = new HttpParams()
      .set('dataInicio', dataInicio)
      .set('dataFim', dataFim);
    return this.http.get<RelatorioTopMotoristasDTO[]>(`${this.apiUrl}/top-motoristas`, { params });
  }

  // Lista de viagens
  getViagens(dataInicio?: string, dataFim?: string, status?: string): Observable<Viagem[]> {
    let params = new HttpParams();
    if (dataInicio) params = params.set('dataInicio', dataInicio);
    if (dataFim) params = params.set('dataFim', dataFim);
    if (status) params = params.set('status', status);
    return this.http.get<Viagem[]>(`${this.apiUrl}/viagens`, { params });
  }

  // Exportar relatório para Excel
  exportToExcel(dataInicio: string, dataFim: string, tipo: string): Observable<Blob> {
    const params = new HttpParams()
      .set('dataInicio', dataInicio)
      .set('dataFim', dataFim)
      .set('tipo', tipo);
    return this.http.get(`${this.apiUrl}/exportar-excel`, {
      params,
      responseType: 'blob'
    });
  }

  // Gerar PDF
  gerarPDF(dataInicio: string, dataFim: string, tipo: string): Observable<Blob> {
    const params = new HttpParams()
      .set('dataInicio', dataInicio)
      .set('dataFim', dataFim)
      .set('tipo', tipo);
    return this.http.get(`${this.apiUrl}/gerar-pdf`, {
      params,
      responseType: 'blob'
    });
  }
}

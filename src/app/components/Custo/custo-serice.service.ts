import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Custo, CustoListDTO, CustoRequestDTO, CustoUpdateDTO, CustoViagemDTO, DashboardCustosDTO, RelatorioCustosDetalhadoDTO, RelatorioFilterDTO, StatusCusto, TipoCusto, Veiculo } from './models';

@Injectable({
  providedIn: 'root'
})
export class CustoSericeService {

   private apiUrl = "http://localhost:9001/api/custo";
 //dos veicuos
  constructor(private http: HttpClient) {}

  // CRUD Básico
  criarCusto(custo: CustoRequestDTO): Observable<Custo> {
    return this.http.post<Custo>(`${this.apiUrl}/criarCusto`, custo);
  }

  atualizarCusto(id: number, custo: CustoUpdateDTO): Observable<string> {
    return this.http.put<string>(`${this.apiUrl}/update/${id}`, custo, { responseType: 'text' as 'json' });
  }

  excluirCusto(id: number): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/delete/${id}`, { responseType: 'text' as 'json' });
  }

  listarCustos(): Observable<CustoListDTO[]> {
    return this.http.get<CustoListDTO[]>(`${this.apiUrl}/findAll`);
  }

  // Custos para Viagem
  criarCustoViagem(custoViagem: CustoViagemDTO): Observable<Custo> {
    return this.http.post<Custo>(`${this.apiUrl}/criarCustoViagem`, custoViagem);
  }

  atualizarCustoViagem(id: number, custoViagem: CustoViagemDTO): Observable<string> {
    return this.http.put<string>(`${this.apiUrl}/actualizarCustoParaViagem/${id}`, custoViagem, { responseType: 'text' as 'json' });
  }

  // Dashboard e Relatórios
  getDashboard(): Observable<DashboardCustosDTO> {
    return this.http.get<DashboardCustosDTO>(`${this.apiUrl}/dashboard`);
  }

  gerarRelatorio(filtro: RelatorioFilterDTO): Observable<RelatorioCustosDetalhadoDTO> {
    return this.http.post<RelatorioCustosDetalhadoDTO>(`${this.apiUrl}/relatorio`, filtro);
  }

  relatorioPorPeriodo(inicio: Date, fim: Date): Observable<Custo[]> {
    const params = new HttpParams()
      .set('inicio', inicio.toISOString().split('T')[0])
      .set('fim', fim.toISOString().split('T')[0]);

    return this.http.get<Custo[]>(`${this.apiUrl}/relatorio-por-periodo`, { params });
  }

  // Consultas específicas
  buscarPorVeiculoPeriodo(veiculoId: number, inicio?: Date, fim?: Date): Observable<Custo[]> {
    let params = new HttpParams();
    if (inicio) params = params.set('inicio', inicio.toISOString().split('T')[0]);
    if (fim) params = params.set('fim', fim.toISOString().split('T')[0]);

    return this.http.get<Custo[]>(`${this.apiUrl}/veiculo/${veiculoId}`, { params });
  }

  getCustoMensalUltimos12Meses(): Observable<Map<string, number>> {
    return this.http.get<Map<string, number>>(`${this.apiUrl}/custoMesalUltimos12Meses`);
  }

  getVeiculosComCustoAcimaDaMedia(): Observable<Veiculo[]> {
    return this.http.get<Veiculo[]>(`${this.apiUrl}/veiculosCustosAcimaMedia`);
  }

  // Métodos auxiliares para dropdowns
  getTiposCusto(): { value: TipoCusto, label: string }[] {
    return [
      { value: TipoCusto.COMBUSTIVEL, label: 'Combustível' },
      { value: TipoCusto.MANUTENCAO_PREVENTIVA, label: 'Manutenção Preventiva' },
      { value: TipoCusto.MANUTENCAO_CORRETIVA, label: 'Manutenção Corretiva' },
      { value: TipoCusto.PEDAGIO, label: 'Pedágio' },
      { value: TipoCusto.LAVAGEM, label: 'Lavagem' },
      { value: TipoCusto.SEGURO, label: 'Seguro' },
      { value: TipoCusto.IPVA, label: 'IPVA' },
      { value: TipoCusto.LICENCIAMENTO, label: 'Licenciamento' },
      { value: TipoCusto.MULTAS, label: 'Multas' },
      { value: TipoCusto.OUTROS, label: 'Outros' }
    ];
  }

  getStatusCusto(): { value: StatusCusto, label: string }[] {
    return [
      { value: StatusCusto.PAGO, label: 'Pago' },
      { value: StatusCusto.PENDENTE, label: 'Pendente' },
      { value: StatusCusto.AGENDADO, label: 'Agendado' },
      { value: StatusCusto.CANCELADO, label: 'Cancelado' }
    ];
  }

  // Métodos de contagem
  getNumeroCustos(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/numeroCustos`);
  }

  getNumeroCustosPorStatus(status: StatusCusto): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/numeroPorStatus/${status}`);
  }

  getNumeroCustosPorTipo(tipo: TipoCusto): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/numeroPorTipo/${tipo}`);
  }
}

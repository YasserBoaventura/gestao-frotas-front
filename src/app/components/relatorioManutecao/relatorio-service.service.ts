import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { RelatorioManutencaoDTO } from './relatorio-manutencao-dto';

@Injectable({
  providedIn: 'root'
})
export class RelatorioManutencaoService {

    constructor(private http : HttpClient){

      }
private apiUrl = 'http://localhost:9001/api/manutencoes';

  // Buscar relatório por veículo
  getRelatorioPorVeiculo(): Observable<RelatorioManutencaoDTO []> {
    return this.http.get<RelatorioManutencaoDTO []>(`${this.apiUrl}/por-veiculo`);
  }

  // Buscar relatório por período
  // Buscar relatório por período - CORRIGIDO
getRelatorioPorPeriodo(dataInicio: Date, dataFim: Date): Observable<RelatorioManutencaoDTO []> {
  const params = {
    inicio: this.formatarDataISO(dataInicio),
    fim: this.formatarDataISO(dataFim)
  };

  return this.http.get<RelatorioManutencaoDTO []>(
    `${this.apiUrl}/relatorio-por-periodo`,
    { params }
  );
}

  // Método auxiliar para formatar data no padrão yyyy-MM-dd
  private formatarDataISO(data: Date): string {
    const year = data.getFullYear();
    const month = (data.getMonth() + 1).toString().padStart(2, '0');
    const day = data.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Tratamento de erros
  private handleError(error: any) {
    console.error('Erro na requisição:', error);

    let errorMessage = 'Erro desconhecido';
    if (error.error instanceof ErrorEvent) {
      // Erro do lado do cliente
      errorMessage = `Erro: ${error.error.message}`;
    } else {
      // Erro do lado do servidor
      errorMessage = `Código: ${error.status}\nMensagem: ${error.message}`;
    }

    return throwError(() => new Error(errorMessage));
  }  // Método auxiliar para formatar data
  private formatarData(data: Date): string {
    return data.toISOString().split('T')[0]; // Formato yyyy-MM-dd
  }

}

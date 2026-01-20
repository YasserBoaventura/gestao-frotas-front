import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, throwError } from 'rxjs';
import { Manutencao } from './manutencao';
import { Veiculo } from '../Veiculos/veiculos.model';



export enum TipoManutencao {
  PREVENTIVA = 'PREVENTIVA',
  CORRETIVA = 'CORRETIVA',
  TROCA_OLEO = 'TROCA_OLEO',
  REVISAO = 'REVISAO'
}

// DTOs para envio ao backend
export interface ManutencaoDTO {
  veiculo_id: number;
  dataManutencao: Date;
  tipoManutencao: TipoManutencao;
  descricao: string;
  custo: number;
  kilometragemVeiculo: number;
  proximaManutencaoKm?: number;
  proximaManutencaoData?: Date;
  status?: string;
}

export interface RelatorioManutencaoDTO {
  veiculoMatricula: string;
  veiculoModelo: string;
  totalManutencoes: number;
  ultimaManutencao: Date;
  proximaManutencao?: Date;
  custoTotal: number;
  status: string;
}

export interface AlertaManutencao {
  mensagem: string;
  tipo: 'VENCIDA' | 'PROXIMA' | 'URGENTE';
  veiculoMatricula?: string;
  veiculoId?: number;
  manutencaoId?: number;
  dataLimite?: Date;
  kmLimite?: number;
}
@Injectable({
  providedIn: 'root'
})


export class ManutencoesServiceService {

 private apiUrl = "http://localhost:9001/api/manutencoes";
 //dos veicuos
  private veiculosUrl = 'http://localhost:9001/api/veiculos';

  constructor(private http: HttpClient) {}

  // ========== HEADERS ==========


  // ========== CRUD MANUTENÇÕES ==========

  /**
   * Busca todas as manutenções
   */
  getAll(): Observable<Manutencao[]> {
    return this.http.get<Manutencao[]>(this.apiUrl+"/findAll"
    );
  }

  /**
   * Busca manutenção por ID
   */
  getById(id: number): Observable<Manutencao> {
    return this.http.get<Manutencao>(`${this.apiUrl}/${id}`,
    );
  }

  /**
   * Cria uma nova manutenção
   */
  create(manutencaoDTO: ManutencaoDTO): Observable<string> {
    return this.http.post<string>(this.apiUrl+"/save" ,manutencaoDTO, {
      responseType: 'text' as 'json'
    })
  }

  /**
   * Atualiza uma manutenção existente
   */
  update(id: number, manutencaoDTO: ManutencaoDTO): Observable<string> {
    return this.http.put<string>(`${this.apiUrl}/update/${id}`, manutencaoDTO,{
      responseType : 'text' as 'json'
    })
  }

  /**
   * Remove uma manutenção
   */
  delete(id: number): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/delete/${id}`, {

      responseType: 'text' as 'json'});

  }

  // ========== MÉTODOS ESPECÍFICOS ==========

  /**
   * Busca manutenções por veículo
   */
  getByVeiculo(veiculoId: number): Observable<Manutencao[]> {
    return this.http.get<Manutencao[]>(`${this.apiUrl}/findByIdVeiculo/${veiculoId}`)
  }


  getByTipo(tipo: string): Observable<Manutencao[]> {
    return this.http.get<Manutencao[]>(`${this.apiUrl}/tipo/${tipo}`)
  }

  /**
   * Gera relatório por veículo
   */
  getRelatorioPorVeiculo(): Observable<RelatorioManutencaoDTO[]> {
    return this.http.get<RelatorioManutencaoDTO[]>(`${this.apiUrl}/relatorio/veiculo`)
  }

  /**
   * Gera alertas de manutenção
   */
  getAlertas(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/gerarAltertas`, )
  }


  getVencidas(): Observable<Manutencao[]> {
    return this.http.get<Manutencao[]>(`${this.apiUrl}/vencidas`)
  }

  // Novas funcionalidades
  iniciarManutencao(id: number): Observable<Manutencao> {
    return this.http.put<Manutencao>(`${this.apiUrl}/iniciarManutencao/${id}`, {});
  }

  concluirManutencao(id: number, dados: any ): Observable<Manutencao> {
    return this.http.put<Manutencao>(`${this.apiUrl}/concluirManutencao/${id}`, dados);
  }

  cancelarManutencao(id: number, motivo: string): Observable<Manutencao> {
    return this.http.put<Manutencao>(`${this.apiUrl}/cancelarManutencao/${id}`, { motivo });
   }
  /**
   * Busca próximas manutenções (próximos 30 dias)
   */
  getProximas(): Observable<Manutencao[]> {
    return this.http.get<Manutencao[]>(`${this.apiUrl}/proximas`,
    );
  }

  /**
   * Busca manutenções próximas (próximos 7 dias)
   */
  getProximas7Dias(): Observable<Manutencao[]> {
    return this.http.get<Manutencao[]>(`${this.apiUrl}/proximas/7dias`, )
  }

  // ========== SERVIÇOS DE VEÍCULO ==========

  /**
   * Busca todos os veículos
   */
  getVeiculos(): Observable<Veiculo[]> {
    return this.http.get<Veiculo[]>(this.veiculosUrl+"/findAll"
    );
  }

  /**
   * Busca veículo por ID
   */
  getVeiculoById(id: number): Observable<Veiculo> {
    return this.http.get<Veiculo>(`${this.veiculosUrl}/${id}`)
  }

  /**
   * Atualiza quilometragem do veículo
   */
  updateKilometragemVeiculo(veiculoId: number, kilometragemAtual: number): Observable<Veiculo> {
    return this.http.patch<Veiculo>(`${this.veiculosUrl}/${veiculoId}/kilometragem`,{})

  }

  // ========== MÉTODOS AUXILIARES ==========

  /**
   * Verifica status da manutenção
   */
  verificarStatusManutencao(manutencao: Manutencao): 'OK' | 'PROXIMA' | 'VENCIDA' | 'URGENTE' {
    if (!manutencao) return 'OK';

    const hoje = new Date();
    const veiculo = manutencao.veiculo;

    // Verificar por data
    if (manutencao.proximaManutencaoData) {
      const dataProxima = new Date(manutencao.proximaManutencaoData);

      // Vencida por data
      if (dataProxima < hoje) {
        return 'VENCIDA';
      }

      // Próxima (30 dias)
      const diasRestantes = Math.floor((dataProxima.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      if (diasRestantes <= 30) {
        return diasRestantes <= 7 ? 'URGENTE' : 'PROXIMA';
      }
    }

    // Verificar por quilometragem
    if (manutencao.proximaManutencaoKm && veiculo && veiculo.kilometragemAtual) {
      // Vencida por km
      if (veiculo.kilometragemAtual >= manutencao.proximaManutencaoKm) {
        return 'VENCIDA';
      }

      // Próxima por km (1000km)
      const kmRestantes = manutencao.proximaManutencaoKm - veiculo.kilometragemAtual;
      if (kmRestantes <= 1000) {
        return kmRestantes <= 200 ? 'URGENTE' : 'PROXIMA';
      }
    }

    return 'OK';
  }

  /**
   * Calcula próxima manutenção com base no tipo
   */
  calcularProximaManutencao(
    tipo: TipoManutencao,
    dataAtual: Date,
    kmAtual: number
  ): { proximaKm?: number; proximaData?: Date } {
    const dataBase = new Date(dataAtual);

    switch (tipo) {
      case TipoManutencao.TROCA_OLEO:
        return {
          proximaKm: kmAtual + 10000,
          proximaData: new Date(dataBase.setMonth(dataBase.getMonth() + 6))
        };

      case TipoManutencao.PREVENTIVA:
        return {
          proximaKm: kmAtual + 15000,
          proximaData: new Date(dataBase.setMonth(dataBase.getMonth() + 12))
        };

      case TipoManutencao.REVISAO:
        return {
          proximaKm: kmAtual + 30000,
          proximaData: new Date(dataBase.setMonth(dataBase.getMonth() + 24))
        };

      case TipoManutencao.CORRETIVA:
        // Não tem periodicidade fixa
        return {};

      default:
        return {};
    }
  }

  /**
   * Obtém estatísticas gerais
   */
  getEstatisticas(): Observable<{
    total: number;
    vencidas: number;
    proximas: number;
    custoTotal: number;
    custoMedio: number;
  }> {
    return forkJoin({
      todas: this.getAll(),
      vencidas: this.getVencidas(),
      proximas: this.getProximas()
    }).pipe(
      map(({ todas, vencidas, proximas }) => {
        const custoTotal = todas.reduce((sum, m) => sum + m.custo!, 0);
        const custoMedio = todas.length > 0 ? custoTotal / todas.length : 0;

        return {
          total: todas.length,
          vencidas: vencidas.length,
          proximas: proximas.length,
          custoTotal,
          custoMedio
        };
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Gera relatório completo
   */
  gerarRelatorioCompleto(): Observable<{
    relatorioVeiculos: RelatorioManutencaoDTO[];
    estatisticas: any;
    alertas: string[];
  }> {
    return forkJoin({
      relatorioVeiculos: this.getRelatorioPorVeiculo(),
      estatisticas: this.getEstatisticas(),
      alertas: this.getAlertas()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // ========== FORMATADORES ==========

  private formatarDatasManutencoes(manutencoes: Manutencao[]): Manutencao[] {
    return manutencoes.map(m => this.formatarDataManutencao(m));
  }

  private formatarDataManutencao(manutencao: Manutencao): Manutencao {
    return {
      ...manutencao,
      dataManutencao: new Date(manutencao.dataManutencao!),
      proximaManutencaoData: manutencao.proximaManutencaoData ?
        new Date(manutencao.proximaManutencaoData) : undefined
    };
  }

  // ========== UTILITÁRIOS ==========

  getTipoManutencaoLabel(tipo: TipoManutencao): string {
    const labels: Record<TipoManutencao, string> = {
      [TipoManutencao.PREVENTIVA]: 'Preventiva',
      [TipoManutencao.CORRETIVA]: 'Corretiva',
      [TipoManutencao.TROCA_OLEO]: 'Troca de Óleo',
      [TipoManutencao.REVISAO]: 'Revisão'
    };
    return labels[tipo] || tipo;
  }

  getStatusColor(status: string): string {
    switch(status) {
      case 'VENCIDA': return '#f44336'; // Vermelho
      case 'URGENTE': return '#ff9800'; // Laranja
      case 'PROXIMA': return '#ffc107'; // Amarelo
      case 'OK': return '#4caf50'; // Verde
      default: return '#9e9e9e'; // Cinza
    }
  }

  formatarData(data: Date): string {
    return data.toLocaleDateString('pt-BR');
  }

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  // ========== MOCK DATA (para desenvolvimento) ==========


  // ========== ERROR HANDLING ==========

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocorreu um erro inesperado';

    if (error.error instanceof ErrorEvent) {
      // Erro do cliente
      errorMessage = `Erro: ${error.error.message}`;
    } else {
      // Erro do servidor
      switch (error.status) {
        case 0:
          errorMessage = 'Servidor não disponível. Verifique sua conexão.';
          break;
        case 400:
          errorMessage = 'Requisição inválida';
          break;
        case 401:
          errorMessage = 'Não autorizado';
          break;
        case 403:
          errorMessage = 'Acesso proibido';
          break;
        case 404:
          errorMessage = 'Recurso não encontrado';
          break;
        case 409:
          errorMessage = 'Conflito de dados';
          break;
        case 422:
          errorMessage = 'Dados inválidos';
          break;
        case 500:
          errorMessage = 'Erro interno do servidor';
          break;
        default:
          errorMessage = `Erro ${error.status}: ${error.message}`;
      }
    }

    console.error('Erro no ManutencaoService:', error);
    return throwError(() => new Error(errorMessage));
  }

  // ========== CACHE LOCAL ==========

  private readonly CACHE_KEY = 'manutencoes_cache';

  salvarCache(manutencoes: Manutencao[]): void {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(manutencoes));
    } catch (error) {
      console.error('Erro ao salvar cache:', error);
    }
  }

  carregarCache(): Manutencao[] | null {
    try {
      const cache = localStorage.getItem(this.CACHE_KEY);
      return cache ? JSON.parse(cache) : null;
    } catch (error) {
      console.error('Erro ao carregar cache:', error);
      return null;
    }
  }

  limparCache(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY);
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  }

  // ========== VALIDAÇÃO ==========

  validarManutencaoDTO(dto: ManutencaoDTO): { valido: boolean; erros: string[] } {
    const erros: string[] = [];

    if (!dto.veiculo_id) {
      erros.push('Veículo é obrigatório');
    }

    if (!dto.dataManutencao) {
      erros.push('Data da manutenção é obrigatória');
    }

    if (!dto.tipoManutencao) {
      erros.push('Tipo de manutenção é obrigatório');
    }

    if (!dto.descricao || dto.descricao.trim().length < 5) {
      erros.push('Descrição deve ter pelo menos 5 caracteres');
    }

    if (!dto.custo || dto.custo <= 0) {
      erros.push('Custo deve ser maior que zero');
    }

    if (!dto.kilometragemVeiculo || dto.kilometragemVeiculo < 0) {
      erros.push('Quilometragem é obrigatória');
    }

    return {
      valido: erros.length === 0,
      erros
    };
  }

}

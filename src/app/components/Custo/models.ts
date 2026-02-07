
  export interface Custo {
  id?: number;
  data: Date;
  descricao: string;
  valor: number;
  tipo: TipoCusto;
  status: StatusCusto;
  veiculoId?: number;
  viagemId?: number;
  manutencaoId?: number;
  abastecimentoId?: number;
  observacoes?: string;
  numeroDocumento?: string;
  veiculo?: Veiculo;
  viagem?: Viagem;
  dataCriacao?: Date;
  dataAtualizacao?: Date;
}

export interface Veiculo {
  id: number;
  matricula: string;
  modelo: string;
  marca: string;
  ano: number;
  kilometragemAtual?: number;
  custoTotal?: number;
  custoCombustivel?: number;
  custoManutencao?: number;
  custoMedioPorKm?: number;
}
export interface CustoDTO{
id: number;
    data: Date;
     descricao: string;
   valor: number;
    tipo:TipoCusto;
    status: StatusCusto ;
     veiculoId: number;
  veiculoMatricula: string;
observacoes: string;
 numeroDocumento: string;
} 

export interface Viagem {
  id: number;
  origem: string;
  destino: string;
  dataInicio: Date;
  dataFim: Date;
  distancia: number;
  veiculoId: number;
}

export interface CustoRequestDTO {
  veiculoId: number;
  viagemId?: number;
  manutencaoId?: number;
  abastecimentoId?: number;
  data?: Date;
  descricao: string;
  valor: number;
  tipo: TipoCusto;
  status?: StatusCusto;
  observacoes?: string;
  numeroDocumento?: string;
}

export interface CustoUpdateDTO {
  descricao?: string;
  valor?: number;
  tipo?: TipoCusto;
  status?: StatusCusto;
  observacoes?: string;
}

export interface CustoViagemDTO {
  viagemId: number;
  veiculoId: number;
  tipo: TipoCusto;
  descricao: string;
  observacoes?: string;
  valor: number;
}

export interface CustoListDTO {
  id: number;
  data: Date;
  descricao: string;
  valor: number;
  tipo: string;
  status: string;
  veiculoMatricula: string;
  veiculoModelo: string;
  numeroDocumento?: string;
}

export interface CustoDetalhadoDTO {
  id: number;
  data: Date;
  descricao: string;
  valor: number;
  tipo: string;
  veiculoMatricula: string;
}

export interface VeiculoCustoDTO {
  matricula: string;
  modelo: string;
  totalCusto: number;
}

export interface RelatorioFilterDTO {
  dataInicio: Date;
  dataFim: Date;
  veiculoId?: number;
  dataInicioTop5VeiculosMaisCarro?: Date;
  dataFimTop5VeiculosMaisCarro?: Date;
}

export interface DashboardCustosDTO {
  mensagem: string;
  totalMesAtual: number;
  totalMesAnterior: number;
  variacaoPercentual: number;
  custosPorTipo: Map<string, number>;
  veiculosMaisCaros: VeiculoCustoDTO[];
  ultimosCustos: CustoDTO[];
}

export interface RelatorioCustosDetalhadoDTO {
  periodoInicio: Date;
  periodoFim: Date;
  totalPeriodo: number;
  quantidadeCustos: number;
  totalPorVeiculo: Map<string, number>;
  totalPorTipo: Map<string, number>;
  top5VeiculosMaisCaros: VeiculoCustoDTO[];
  top5CustosMaisAltos: CustoDetalhadoDTO[];
  custosDetalhados: CustoDTO[];
}

export enum TipoCusto {
  COMBUSTIVEL = 'COMBUSTIVEL',
  MANUTENCAO_PREVENTIVA = 'MANUTENCAO_PREVENTIVA',
  MANUTENCAO_CORRETIVA = 'MANUTENCAO_CORRETIVA',
  PEDAGIO = 'PEDAGIO',
  LAVAGEM = 'LAVAGEM',
  SEGURO = 'SEGURO',
  IPVA = 'IPVA',
  LICENCIAMENTO = 'LICENCIAMENTO',
  MULTAS = 'MULTAS',
  OUTROS = 'OUTROS'
}

export enum StatusCusto {
  PAGO = 'PAGO',
  PENDENTE = 'PENDENTE',
  AGENDADO = 'AGENDADO',
  CANCELADO = 'CANCELADO'

}

export interface RelatorioMotoristaDTO {
  nome: string;
  telefone: string;
  status: string;
  quantidadeViagens: number;
  totalKilometragem: number;
  totalLitrosAbastecidos: number;
  mediaCombustivel: number;
}

export interface RelatorioPorVeiculoDTO {
  matricula: string;
  modelo: string;
  quantidadeViagens: number;
  totalKilometragem: number;
  totalLitrosAbastecidos: number;
   mediaCombustivel: number;
}
export interface RelatorioMotoristaDTO {
    nomeMotorista: string;
    telefone: string;
    status: string;
    totalViagens: number;
    totalQuilometragem: number;
    totalCombustivel: number;
}

export interface RelatorioPorVeiculoDTO {
    veiculo: string;
    modelo: string;
    totalViagens: number;
    totalKm: number;
    totalCombustivel: number;
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

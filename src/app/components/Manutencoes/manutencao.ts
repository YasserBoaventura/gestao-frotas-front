import { Veiculo } from "../Veiculos/veiculos.model";

export class Manutencao {


  id?: number;
  dataManutencao?: Date;
  tipoManutencao?: TipoManutencao;
  descricao!: string;
  custo!: number;
  kilometragemVeiculo?: number;
  proximaManutencaoKm?: number;
  proximaManutencaoData?: Date;
  veiculo! : Veiculo;
}

export enum TipoManutencao {
  PREVENTIVA = 'PREVENTIVA',
  CORRETIVA = 'CORRETIVA',
  TROCA_OLEO = 'TROCA_OLEO',
  REVISAO = 'REVISAO'

}

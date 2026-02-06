import { Veiculo } from "../Veiculos/veiculos.model";
import { Viagem } from "../viagens/viagem";

export class Abastecimento {

  id?: number;
  dataAbastecimento?: string | Date;
  quantidadeLitros!: number;
  precoPorLitro!: number;
  tipoCombustivel!: string;
  kilometragemVeiculo!: number;
  statusAbastecimento?: string;

  // IDs (usados para forms)
  veiculo_Id?: number;
  viagemId?: number | null;

  // Objetos completos (se vierem da API)
  veiculo!:  Veiculo;
  viagem!: Viagem;
}

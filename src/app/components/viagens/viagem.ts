import { Motorista } from "../motorista/motorista";
import { Rotas } from "../Rotas/rotas";
import { Veiculo } from "../Veiculos/veiculos.model";

export  class Viagem {

  id?: number;
  dataHoraPartida!: string;
  dataHoraChegada!: string
  status!: string; // "PLANEADA", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"
  kilometragemInicial?: number;
  kilometragemFinal?: number;
  observacoes?: string;
  motorista?: Motorista;
  veiculo?: Veiculo;
  rota?: Rotas;
//  abastecimentos?: Abastecimento[];
}

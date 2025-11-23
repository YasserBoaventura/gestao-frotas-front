import { Marca } from "../marca/marca";


export class Veiculo {

  id!: number;
  modelo!: string;
  matricula!: string;
  anoFabricacao!: number;
  capacidadeTanque!: number;
  kilometragemAtual!: number;
  marca!: Marca;

  abastecimentoss?: any[];
  manutencoes?: any[];
  viagens?: any[];
  constructor(){

  }
}


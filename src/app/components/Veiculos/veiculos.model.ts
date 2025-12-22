import { Marca } from "../marca/marca";
import { Motorista } from "../motorista/motorista";


export class Veiculo {

  id!: number;
  modelo!: string;
  matricula!: string;
  anoFabricacao!: number;
  capacidadeTanque!: number;
  kilometragemAtual!: number;
  status!: string;
  marca!: Marca;
  motoristas: Motorista[]=[];
  //abastecimentoss!: any[];
  manutencoes?: any[];
  viagens?: any[];
  constructor(){

  }
}


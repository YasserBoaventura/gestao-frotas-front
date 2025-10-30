

  export  class Marca {
  id!: number;
  nome!: string;

 constructor(){
  
 }
}

export class Motorista {
  id!: number;
  nome!: string;
}

export class Manutencao {
  id!: number;
  descricao!: string;
  data!: string;
  custo!: number;
}

export class Veiculo {

  id?: number;
  placa!: string;
  modelo!: string;
  ano!: number;
  tipo!: string;
  marca!: Marca;
  motorista?: Motorista;

  constructor(){

  }
}


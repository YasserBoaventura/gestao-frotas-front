import { Veiculo } from "../Veiculos/veiculos.model";
import { Viagem } from "../viagens/viagem";

export class Abastecimento {

   id!: number;
  dataAbastecimento!: string; // Alterado para string para compatibilidade com datetime-local

  quantidadeLitros!: number;
  precoPorLitro!: number;
  tipoCombustivel!: string;
  kilometragemVeiculo!: number;
   statusAbastecimento !: string;
  // ManyToOne com Veiculo (OBRIGATÓRIO)
  veiculoId!: number;
   veiculo!: Veiculo;
  // Viagem (OPCIONAL)
  viagemId!: number;
    createdAt?: Date;
  updatedAt?: Date;

  // Getter para calcular valor total
  get valorTotal(): number {
    return this.quantidadeLitros * this.precoPorLitro;
  }

  // Método estático para inicializar
  static criarNovo(): Abastecimento {
    const abastecimento = new Abastecimento();
    abastecimento.dataAbastecimento = new Date().toISOString().slice(0, 16);
    abastecimento.quantidadeLitros = 0;
    abastecimento.precoPorLitro = 0;
    abastecimento.tipoCombustivel = 'GASOLINA';
    abastecimento.kilometragemVeiculo = 0;
    // veiculo não é inicializado - deve ser selecionado no formulário
    // viagem permanece undefined (opcional)
    return abastecimento;
  }
}

// Ou se preferir uma interface em vez de classe:
export interface IAbastecimento {
  id?: number;
  dataAbastecimento: string;
  quantidadeLitros: number;
  precoPorLitro: number;
  tipoCombustivel: string;
  kilometragemVeiculo: number;
  veiculo: Veiculo;
  viagem?: Viagem;
}

// Função auxiliar para criar novo abastecimento
export function criarAbastecimentoVazio(): IAbastecimento {
  return {
    dataAbastecimento: new Date().toISOString().slice(0, 16),
    quantidadeLitros: 0,
    precoPorLitro: 0,
    tipoCombustivel: 'GASOLINA',
    kilometragemVeiculo: 0,
    veiculo: {} as Veiculo, // ou null, dependendo da sua lógica
  }
}

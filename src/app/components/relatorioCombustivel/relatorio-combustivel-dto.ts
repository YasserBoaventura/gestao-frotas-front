export class RelatorioCombustivelDTO {
  veiculo: string;
  totalLitros: number;
  totalGasto: number;
  mediaPorLitro: number;

  constructor(veiculo: string, totalLitros: number, totalGasto: number, mediaPorLitro: number) {
    this.veiculo = veiculo;
    this.totalLitros = totalLitros || 0;
    this.totalGasto = totalGasto || 0;
    this.mediaPorLitro = mediaPorLitro || 0;
  }

  getTotalLitrosFormatado(): string {
    return `${this.totalLitros.toFixed(2)} L`;
  }

  getTotalGastoFormatado(): string {
    return `R$ ${this.totalGasto.toFixed(2)}`;
  }

  getMediaPorLitroFormatado(): string {
    return `R$ ${this.mediaPorLitro.toFixed(2)}`;
  }


}

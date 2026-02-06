export class RelatorioManutencaoDTO {
    veiculo!: string;
  totalManutencoes!: number;
  custoTotal!: number;      
  custoMedio!: number;
  tipoManutencao!: string;
  status !: string;  

  getTotalGastoFormatado(): string {
    return `R$ ${this.custoTotal.toFixed(2)}`;
  }

  getMediaPorLitroFormatado(): string {
    return `R$ ${this.custoMedio.toFixed(2)}`;
  }
}

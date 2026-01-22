export class RelatorioCombustivelDTO {
  matricula: string;
  totalLitros: number;
  valorTotal: number;
  mediaPorLitro: number;
  precoMedio: number;
  status: string; 
  constructor(matricula: string, totalLitros: number,  valorTotal: number, mediaPorLitro: number , precoMedio: number, status: string) { 
    this.matricula =matricula;
    this.totalLitros = totalLitros || 0;
    this. valorTotal =  valorTotal || 0;
    this.mediaPorLitro = mediaPorLitro || 0;
    this.precoMedio = precoMedio;
    this.status = status; 
  

  }

  getTotalLitrosFormatado(): string {
    return `${this.totalLitros.toFixed(2)} L`;
  }

  getTotalGastoFormatado(): string {
    return `R$ ${this.valorTotal.toFixed(2)}`;
  } 

  getMediaPorLitroFormatado(): string {
    return `R$ ${this.mediaPorLitro.toFixed(2)}`;
  }


}

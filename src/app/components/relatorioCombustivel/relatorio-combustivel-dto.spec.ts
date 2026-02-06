import { RelatorioCombustivelDTO } from "./relatorio-combustivel-dto";


describe('RelatorioCombustivelDTO', () => {
  it('should create an instance', () => {
    expect(new RelatorioCombustivelDTO("veiculo", 100, 500, 5)).toBeTruthy();
  });
});

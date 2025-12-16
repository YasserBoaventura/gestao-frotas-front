export interface RelatorioMotoristaDTO {
  id?: number;
  nomeMotorista: string;
  telefone: string;
  totalViagens: number;
  totalQuilometragem: number;  // ← backend usa este nome
  totalCombustivel: number;    // ← backend usa este nome
  // Campos auxiliares para o frontend
  totalKm?: number;                     // alias para totalQuilometragem
  totalKmPercorridos?: number;         // alias para totalQuilometragem
  totalLitrosAbastecidos?: number;     // alias para totalCombustivel
  mediaConsumo?: number;

}

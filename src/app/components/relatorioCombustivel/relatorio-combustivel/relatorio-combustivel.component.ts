import { Component, OnInit } from '@angular/core';
import { RelatorioCombustivelDTO } from '../relatorio-combustivel-dto';
import { RelatorioCombustivelService } from '../relatorio-combustivel.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-relatorio-combustivel',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], // Adicione estes imports
  templateUrl: './relatorio-combustivel.component.html',
  styleUrl: './relatorio-combustivel.component.css'
})
export class RelatorioCombustivelComponent implements OnInit {
   relatorios: RelatorioCombustivelDTO[] = [];
  relatoriosFiltrados: RelatorioCombustivelDTO[] = [];
  dataInicio: string = '';
  dataFim: string = '';
  filtroAtivo: string = 'veiculo';
  veiculoSelecionado: string = '';
  veiculos: string[] = [];
  carregando: boolean = false;
  erro: string = '';
  hoje = new Date();

  // Variáveis para totais
  totalGeralLitros: number = 0;
  totalGeralGasto: number = 0;

  constructor(private relatorioService: RelatorioCombustivelService) { }

  ngOnInit(): void {
    console.log('Componente inicializado');
    this.carregarRelatorioPorVeiculo();
  }

  // Carregar relatório por veículo
  carregarRelatorioPorVeiculo(): void {
    this.carregando = true;
    this.erro = '';
    this.filtroAtivo = 'veiculo';

    console.log('Buscando relatório por veículo...');

    this.relatorioService.getRelatorioPorVeiculo().subscribe({
      next: (data) => {
        console.log('Dados recebidos:', data);
        this.relatorios = data;
        this.relatoriosFiltrados = [...data];
        this.extrairVeiculos();
        this.calcularTotais();
        this.carregando = false;
      },
      error: (error) => {
        console.error('Erro ao carregar relatório por veículo:', error);
        this.erro = 'Erro ao carregar relatório. Tente novamente.';
        this.carregando = false;
      },
      complete: () => {
        console.log('Requisição por veículo concluída');
      }
    });
  }

  // Carregar relatório por período
  carregarRelatorioPorPeriodo(): void {
    if (!this.dataInicio || !this.dataFim) {
      this.erro = 'Selecione ambas as datas (início e fim)';
      return;
    }

    // Converter strings para Date para validação
    const inicioDate = new Date(this.dataInicio);
    const fimDate = new Date(this.dataFim);

    if (inicioDate > fimDate) {
      this.erro = 'Data de início não pode ser maior que data de fim';
      return;
    }

    this.carregando = true;
    this.erro = '';
    this.filtroAtivo = 'periodo';

    console.log('Buscando relatório por período:', {
      inicio: this.dataInicio,
      fim: this.dataFim
    });

    this.relatorioService.getRelatorioPorPeriodo(new Date(this.dataInicio), new Date(this.dataFim)).subscribe({
      next: (data) => {
        console.log('Dados recebidos por período:', data);
        this.relatorios = data;
        this.relatoriosFiltrados = [...data];
        this.extrairVeiculos();
        this.calcularTotais();
        this.carregando = false;
      },
      error: (error) => {
        console.error('Erro detalhado:', error);
        this.erro = 'Erro ao carregar relatório. Verifique as datas e tente novamente.';
        this.carregando = false;
      },
      complete: () => {
        console.log('Requisição por período concluída');
      }
    });
  }

  // Extrair lista de veículos únicos dos dados
  extrairVeiculos(): void {
    const veiculosUnicos = new Set<string>();
    this.relatorios.forEach(relatorio => {
      if (relatorio.matricula) {
        veiculosUnicos.add(relatorio.matricula);
      }
    });
    this.veiculos = Array.from(veiculosUnicos).sort();
  }

  // Aplicar filtro por veículo selecionado
  aplicarFiltroVeiculo(): void {
    if (this.veiculoSelecionado) {
      this.relatoriosFiltrados = this.relatorios.filter(relatorio =>
        relatorio.matricula === this.veiculoSelecionado
      );
    } else {
      this.relatoriosFiltrados = [...this.relatorios];
    }
    this.calcularTotais();
  }

  // Limpar filtro de veículo
  limparFiltroVeiculo(): void {
    this.veiculoSelecionado = '';
    this.relatoriosFiltrados = [...this.relatorios];
    this.calcularTotais();
  }

  // Calcular totais
  calcularTotais(): void {
    this.totalGeralLitros = this.relatoriosFiltrados.reduce((total, relatorio) =>
      total + (relatorio.totalLitros || 0), 0);

    this.totalGeralGasto = this.relatoriosFiltrados.reduce((total, relatorio) =>
      total + (relatorio.valorTotal || 0), 0);
  }

  // Limpar todos os filtros
  limparFiltros(): void {
    this.dataInicio = '';
    this.dataFim = '';
    this.veiculoSelecionado = '';
    this.erro = '';
    this.relatoriosFiltrados = [...this.relatorios];
    this.calcularTotais();
  }

  // Formatar data para exibição
  formatarData(data: string | Date | null): string {
    if (!data) return '';

    let dataObj: Date;
    if (typeof data === 'string') {
      dataObj = new Date(data);
    } else {
      dataObj = data;
    }

    return dataObj.toLocaleDateString('pt-BR');
  }

  // Obter a data de hoje no formato YYYY-MM-DD para o input
  get hojeString(): string {
    return this.formatarDataParaInput(this.hoje);
  }

  // Formatar data para input (YYYY-MM-DD)
  formatarDataParaInput(data: Date | null): string {
    if (!data) return '';
    const year = data.getFullYear();
    const month = (data.getMonth() + 1).toString().padStart(2, '0');
    const day = data.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Ordenar tabela
  ordenarPor(coluna: string): void {
    this.relatoriosFiltrados.sort((a, b) => {
      switch(coluna) {
        case 'veiculo':
          return a.matricula.localeCompare(b.matricula);
        case 'totalLitros':
          return (b.totalLitros || 0) - (a.totalLitros || 0);
        case 'totalGasto':
          return (b.valorTotal || 0) - (a.valorTotal || 0);
        case 'mediaPorLitro':
          return (b.mediaPorLitro || 0) - (a.mediaPorLitro || 0);
        default:
          return 0;
      }
    });
  }

  // Imprimir relatório
  imprimirRelatorio(): void {
    window.print();
  }
  exportarParaExcel(): void {
  if (this.relatoriosFiltrados.length === 0) return;

  const data = this.relatoriosFiltrados.map(item => ({
    'Veículo': item.matricula || 'Não informado',
    'Total Litros': item.totalLitros,
    'Total Gasto': item.valorTotal,
    'Média por Litro': item.mediaPorLitro,
    'Total Litros Formatado': item.getTotalLitrosFormatado(),
    'Total Gasto Formatado': item.getTotalGastoFormatado(),
    'Média por Litro Formatado': item.getMediaPorLitroFormatado()
  }));

  console.log('Exportando para Excel:', data);
  alert('Funcionalidade de exportação para Excel em desenvolvimento');
}

// Método para exportar para PDF
exportarParaPDF(): void {
  if (this.relatoriosFiltrados.length === 0) return;


  console.log('Exportando para PDF');
  alert('Funcionalidade de exportação para PDF em desenvolvimento');
}

// Método para verificar tendência positiva
temTendenciaPositiva(): boolean {
  // Implemente sua lógica de tendência aqui
  return true;
}

// Método para contar veículos únicos
getVeiculosUnicos(): number {
  const veiculos = new Set(this.relatoriosFiltrados.map(r => r.matricula));
  return veiculos.size;
}  

// Método para mudança no tipo de relatório
onTipoRelatorioChange(): void {
  if (this.filtroAtivo === 'veiculo') {
    this.carregarRelatorioPorVeiculo();
  } else {
    this.dataInicio = '';
    this.dataFim = '';
  }
  this.veiculoSelecionado = '';
}
}

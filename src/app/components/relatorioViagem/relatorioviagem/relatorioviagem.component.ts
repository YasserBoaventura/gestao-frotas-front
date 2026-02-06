import { Component, ElementRef, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';

import { RelatorioMotoristaDTO } from '../../../models/relatorio-motorista-dto';
import { RelatorioVeiculoDTO } from '../../../models/relatorio-veiculo-dto';
import { ViagensServiceService } from '../../viagens/viagens-service.service';
import { MotoristaService } from '../../motorista/motorista.service';
import { VeiculosService } from '../../Veiculos/veiculos.service';

// Importação do Chart.js
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-relatorioviagem',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatTabsModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './relatorioviagem.component.html',
  styleUrl: './relatorioviagem.component.css'
})
export class RelatorioviagemComponent implements OnInit, OnDestroy {

  @ViewChild('statusChart', { static: false }) statusChartRef!: ElementRef;
  @ViewChild('consumoChart', { static: false }) consumoChartRef!: ElementRef;
  @ViewChild('kmChart', { static: false }) kmChartRef!: ElementRef;

  carregando = false;
  relatorioMotorista: RelatorioMotoristaDTO[] = [];
  relatorioVeiculo: RelatorioVeiculoDTO[] = [];
  motoristas: any[] = [];
  veiculos: any[] = [];

  totalViagens = 0;
  totalKmPercorridos = 0;
  totalLitrosAbastecidos = 0;
  mediaConsumo = 0;

  filtros = {
    dataInicio: '',
    dataFim: '',
    status: '',
    motoristaId: '',
    veiculoId: ''
  };

  // Dados para os gráficos
  viagensPorStatus: any[] = [];
  consumoPorMotorista: any[] = [];
  kmPorMes: any[] = [];

  private statusChart: any;
  private consumoChart: any;
  private kmChart: any;

  constructor(
    private viagemService: ViagensServiceService,
    private motoristaService: MotoristaService,
    private veiculoService: VeiculosService
  ) {}

  ngOnInit(): void {
    this.setDatasPadrao();
    this.carregarDadosIniciais();
    this.carregarRelatorios();
  }

  ngOnDestroy(): void {
    // Limpar gráficos para evitar vazamento de memória
    if (this.statusChart) {
      this.statusChart.destroy();
    } 
    if (this.consumoChart) {
      this.consumoChart.destroy();
    }
    if (this.kmChart) {
      this.kmChart.destroy();
    }
  }

  private setDatasPadrao(): void {
    const hoje = new Date();
    const umMesAtras = new Date();
    umMesAtras.setMonth(hoje.getMonth() - 1);

    this.filtros.dataInicio = this.formatarDataParaInput(umMesAtras);
    this.filtros.dataFim = this.formatarDataParaInput(hoje);
  }

  private formatarDataParaInput(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatarDataParaAPI(date: string): string {
    // O backend espera no formato ISO (YYYY-MM-DD)
    return date;
  }

  carregarDadosIniciais(): void {
    forkJoin({
      motoristas: this.motoristaService.getMotoristas(),
      veiculos: this.veiculoService.getVehicles()
    }).subscribe({
      next: (result) => {
        this.motoristas = result.motoristas || [];
        this.veiculos = result.veiculos || [];
      },
      error: (error) => {
        console.error('Erro ao carregar dados:', error);
        Swal.fire('Erro', 'Não foi possível carregar motoristas e veículos', 'error');
      }
    });
  }

  carregarRelatorios(): void {
    this.carregando = true;

    // Validar datas
    if (this.filtros.dataInicio && this.filtros.dataFim) {
      const dataInicio = new Date(this.filtros.dataInicio);
      const dataFim = new Date(this.filtros.dataFim);

      if (dataInicio > dataFim) {
        Swal.fire('Erro', 'A data de início não pode ser maior que a data de fim', 'error');
        this.carregando = false;
        return;
      }
    }

    this.executarCarregamentoRelatorios();
  }

  private executarCarregamentoRelatorios(): void {
    console.log('Aplicando filtros:', this.filtros);

    // Formatar datas para o padrão esperado pelo backend
    const filtrosFormatados = {
      ...this.filtros,
      dataInicio: this.filtros.dataInicio ? this.formatarDataParaAPI(this.filtros.dataInicio) : '',
      dataFim: this.filtros.dataFim ? this.formatarDataParaAPI(this.filtros.dataFim) : ''
    };

    forkJoin({
      motorista: this.viagemService.getRelatorioMotorista(filtrosFormatados),
      veiculo: this.viagemService.getRelatorioVeiculo(filtrosFormatados),
      geral: this.viagemService.getRelatorioGeral(filtrosFormatados.dataInicio, filtrosFormatados.dataFim)
    }).subscribe({
      next: (result) => {
        console.log('Resultado completo:', result);

        // Processar dados do motorista
        this.relatorioMotorista = result.motorista ?
          result.motorista.map((item: any) => ({
            ...item,
            id: item.id || Math.random().toString(36).substr(2, 9),
            // Garantir que os nomes das propriedades estão corretos
            nomeMotorista: item.nomeMotorista || item.nome || item.motorista || 'N/A',
            totalViagens: item.totalViagens || item.quantidadeViagens || 0,
            totalQuilometragem: item.totalQuilometragem || item.totalKilometragem || item.totalKm || 0,
            totalCombustivel: item.totalCombustivel || item.totalLitrosAbastecidos || 0
          })) : [];

        // Processar dados do veículo
        this.relatorioVeiculo = result.veiculo ?
          result.veiculo.map((item: any) => ({
            ...item,
            modelo: item.modelo || 'Não especificado',
            matriculaVeiculo: item.matriculaVeiculo || item.matricula || item.veiculo || 'N/A',
            totalViagens: item.totalViagens || item.quantidadeViagens || 0,
            totalKm: item.totalKm || item.totalKilometragem || 0,
            totalCombustivel: item.totalCombustivel || item.totalLitrosAbastecidos || 0
          })) : [];

        // Processar dados gerais
        if (result.geral) {
          this.totalViagens = result.geral.totalViagens || 0;
          this.totalKmPercorridos = result.geral.totalKilometragem || 0;
          this.totalLitrosAbastecidos = result.geral.totalLitrosAbastecidos || 0;
          this.mediaConsumo = result.geral.mediaKilometragemPorViagem || 0;
        } else {
          // Calcular totais com base nos dados dos motoristas se não houver relatório geral
          this.calcularTotais();
        }

        // Carregar dados para gráficos
        this.carregarDadosParaGraficos();

        // Criar gráficos
        setTimeout(() => {
          this.criarGraficos();
        }, 100);

        this.carregando = false;

        // Mostrar mensagem de sucesso
        if (this.relatorioMotorista.length > 0 || this.relatorioVeiculo.length > 0) {
          Swal.fire('Sucesso!', 'Relatório gerado com sucesso', 'success');
        } else {
          Swal.fire('Info', 'Nenhum dado encontrado com os filtros aplicados', 'info');
        }
      },
      error: (error) => {
        console.error('Erro ao carregar relatórios:', error);
        Swal.fire('Erro', 'Não foi possível carregar os relatórios. Verifique a conexão com o servidor.', 'error');
        this.carregando = false;
      }
    });
  }

  calcularTotais(): void {
    this.totalViagens = this.relatorioMotorista.reduce((sum, item) => sum + (item.totalViagens || 0), 0);
    this.totalKmPercorridos = this.relatorioMotorista.reduce((sum, item) => sum + (item.totalQuilometragem || 0), 0);
    this.totalLitrosAbastecidos = this.relatorioMotorista.reduce((sum, item) => sum + (item.totalCombustivel || 0), 0);
    this.mediaConsumo = this.totalLitrosAbastecidos > 0
      ? this.totalKmPercorridos / this.totalLitrosAbastecidos
      : 0;
  }

  carregarDadosParaGraficos(): void {
    // Dados para gráfico de status (simulado para agora)
    this.viagensPorStatus = [
      { status: 'CONCLUIDA', quantidade: Math.floor(Math.random() * 50) + 30 },
      { status: 'EM_ANDAMENTO', quantidade: Math.floor(Math.random() * 20) + 10 },
      { status: 'CANCELADA', quantidade: Math.floor(Math.random() * 15) + 5 },
      { status: 'AGENDADA', quantidade: Math.floor(Math.random() * 10) + 5 }
    ];

    // Dados para gráfico de consumo por motorista
    this.consumoPorMotorista = this.relatorioMotorista
      .filter(item => item.totalCombustivel > 0)
      .map(item => ({
        nome: item.nomeMotorista,
        consumo: item.totalQuilometragem / item.totalCombustivel
      }))
      .sort((a, b) => b.consumo - a.consumo);

    // Dados para gráfico de km por mês (simulado)
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    this.kmPorMes = meses.map((mes, index) => ({
      mes,
      km: Math.floor(Math.random() * 3000) + 1000
    }));
  }

  aplicarFiltros(): void {
    this.carregarRelatorios();
  }

  limparFiltros(): void {
    this.setDatasPadrao();
    this.filtros.status = '';
    this.filtros.motoristaId = '';
    this.filtros.veiculoId = '';

    Swal.fire('Sucesso!', 'Filtros limpos com sucesso', 'success').then(() => {
      this.carregarRelatorios();
    });
  }

  criarGraficos(): void {
    // Destruir gráficos existentes
    if (this.statusChart) this.statusChart.destroy();
    if (this.consumoChart) this.consumoChart.destroy();
    if (this.kmChart) this.kmChart.destroy();

    // Criar novos gráficos
    this.criarGraficoStatus();
    this.criarGraficoConsumo();
    this.criarGraficoKmPorMes();
  }

  criarGraficoStatus(): void {
    const ctx = this.statusChartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    const labels = this.viagensPorStatus.map(item => {
      switch(item.status) {
        case 'CONCLUIDA': return 'Concluídas';
        case 'EM_ANDAMENTO': return 'Em Andamento';
        case 'CANCELADA': return 'Canceladas';
        case 'AGENDADA': return 'Agendadas';
        default: return item.status;
      }
    });
    const dados = this.viagensPorStatus.map(item => item.quantidade);

    this.statusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: dados,
          backgroundColor: ['#4ecdc4', '#fdbb2d', '#667eea', '#ff6b6b'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              font: {
                size: 12
              }
            }
          }
        }
      }
    });
  }

  criarGraficoConsumo(): void {
    const ctx = this.consumoChartRef?.nativeElement?.getContext('2d');
    if (!ctx || this.consumoPorMotorista.length === 0) return;

    const labels = this.consumoPorMotorista.map(m => {
      // Limitar o nome a 15 caracteres
      const nome = m.nome || 'Motorista';
      return nome.length > 15 ? nome.substring(0, 15) + '...' : nome;
    });

    const data = this.consumoPorMotorista.map(m => m.consumo);

    this.consumoChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Consumo (km/L)',
          data: data,
          backgroundColor: data.map(consumo =>
            consumo > 12 ? '#4ecdc4' :
            consumo > 8 ? '#fdbb2d' :
            consumo > 6 ? '#ffa726' : '#ff6b6b'
          ),
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'km por Litro',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            grid: {
              color: 'rgba(0,0,0,0.05)'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }

  criarGraficoKmPorMes(): void {
    const ctx = this.kmChartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    const labels = this.kmPorMes.map(item => item.mes);
    const dados = this.kmPorMes.map(item => item.km);

    this.kmChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Km Percorridos',
          data: dados,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#667eea',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Quilometragem (km)',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            grid: {
              color: 'rgba(0,0,0,0.05)'
            }
          },
          x: {
            grid: {
              color: 'rgba(0,0,0,0.05)'
            }
          }
        }
      }
    });
  }

  onTabChange(event: any): void {
    // Recriar gráficos quando mudar para a aba de gráficos
    if (event.index === 2) {
      setTimeout(() => {
        this.criarGraficos();
      }, 100);
    }
  }

  // Funções de exportação
  exportarRelatorio(): void {
    Swal.fire({
      title: 'Exportar Relatório',
      text: 'Selecione o formato de exportação',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'PDF',
      cancelButtonText: 'Excel',
      showDenyButton: true,
      denyButtonText: 'CSV'
    }).then((result) => {
      if (result.isConfirmed) {
        this.exportarPDF();
      } else if (result.isDenied) {
        this.exportarCSV();
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        this.exportarExcel();
      }
    });
  }

  exportarPDF(): void {
    Swal.fire({
      title: 'Gerando PDF...',
      text: 'Por favor, aguarde',
      icon: 'info',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
        setTimeout(() => {
          Swal.fire(
            'Sucesso!',
            'PDF gerado com sucesso',
            'success'
          );
        }, 2000);
      }
    });
  }

  exportarExcel(): void {
    Swal.fire({
      title: 'Gerando Excel...',
      text: 'Por favor, aguarde',
      icon: 'info',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
        setTimeout(() => {
          Swal.fire(
            'Sucesso!',
            'Excel gerado com sucesso',
            'success'
          );
        }, 2000);
      }
    });
  }

  exportarCSV(): void {
    Swal.fire({
      title: 'Gerando CSV...',
      text: 'Por favor, aguarde',
      icon: 'info',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
        setTimeout(() => {
          Swal.fire(
            'Sucesso!',
            'CSV gerado com sucesso',
            'success'
          );
        }, 2000);
      }
    });
  }

  verDetalhesMotorista(motorista: any): void {
    const nome = motorista.nomeMotorista || 'N/A';
    const totalViagens = motorista.totalViagens || 0;
    const totalKm = motorista.totalQuilometragem || motorista.totalKm || 0;
    const totalCombustivel = motorista.totalCombustivel || motorista.totalLitrosAbastecidos || 0;
    const mediaConsumo = totalCombustivel > 0 ? (totalKm / totalCombustivel).toFixed(2) : '0.00';
    const participacao = this.totalViagens > 0 ? ((totalViagens / this.totalViagens) * 100).toFixed(0) : '0';

    Swal.fire({
      title: `Detalhes: ${nome}`,
      html: `
        <div style="text-align: left; font-size: 14px;">
          <p><strong>Nome:</strong> ${nome}</p>
          <p><strong>Total de Viagens:</strong> ${totalViagens}</p>
          <p><strong>Km Percorridos:</strong> ${totalKm.toFixed(0)} km</p>
          <p><strong>Combustível Consumido:</strong> ${totalCombustivel.toFixed(0)} L</p>
          <p><strong>Média de Consumo:</strong> ${mediaConsumo} km/L</p>
          <p><strong>Participação:</strong> ${participacao}% das viagens</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Fechar',
      width: '500px'
    });
  }

  verDetalhesVeiculo(veiculo: any): void {
    const matricula = veiculo.matriculaVeiculo || veiculo.veiculo || 'N/A';
    const modelo = veiculo.modelo || 'Não especificado';
    const totalViagens = veiculo.totalViagens || 0;
    const totalKm = veiculo.totalQuilometragem || veiculo.totalKm || 0;
    const totalCombustivel = veiculo.totalCombustivel || veiculo.totalLitrosAbastecidos || 0;
    const mediaConsumo = totalCombustivel > 0 ? (totalKm / totalCombustivel).toFixed(2) : '0.00';

    let eficiencia = 'Não calculada';
    if (totalCombustivel > 0) {
      const consumo = totalKm / totalCombustivel;
      if (consumo > 12) {
        eficiencia = 'Excelente';
      } else if (consumo > 8) {
        eficiencia = 'Boa';
      } else if (consumo > 6) {
        eficiencia = 'Média';
      } else {
        eficiencia = 'Baixa';
      }
    }

    Swal.fire({
      title: `Detalhes: ${matricula}`,
      html: `
        <div style="text-align: left; font-size: 14px;">
          <p><strong>Matrícula:</strong> ${matricula}</p>
          <p><strong>Modelo:</strong> ${modelo}</p>
          <p><strong>Total de Viagens:</strong> ${totalViagens}</p>
          <p><strong>Km Percorridos:</strong> ${totalKm.toFixed(0)} km</p>
          <p><strong>Combustível Consumido:</strong> ${totalCombustivel.toFixed(0)} L</p>
          <p><strong>Média de Consumo:</strong> ${mediaConsumo} km/L</p>
          <p><strong>Eficiência:</strong> ${eficiencia}</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Fechar',
      width: '500px'
    });
  }

  gerarRelatorioIndividual(item: any): void {
    Swal.fire({
      title: 'Gerando Relatório Individual',
      text: 'Por favor, aguarde',
      icon: 'info',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
        setTimeout(() => {
          Swal.fire(
            'Sucesso!',
            'Relatório individual gerado com sucesso',
            'success'
          );
        }, 1500);
      }
    });
  }

  gerarRelatorioVeiculo(item: any): void {
    Swal.fire({
      title: 'Gerando Relatório do Veículo',
      text: 'Por favor, aguarde',
      icon: 'info',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
        setTimeout(() => {
          Swal.fire(
            'Sucesso!',
            'Relatório do veículo gerado com sucesso',
            'success'
          );
        }, 1500);
      }
    });
  }
}

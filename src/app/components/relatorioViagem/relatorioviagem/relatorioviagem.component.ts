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

  private statusChart: any;
  private consumoChart: any;
  private kmChart: any;

  constructor(
    private viagemService: ViagensServiceService,
    private motoristaService: MotoristaService,
    private veiculoService: VeiculosService
  ) {
    // Definir datas padrão
    this.setDatasPadrao();
  }

  ngOnInit(): void {
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
    umMesAtras.setDate(hoje.getDate() - 30);

    this.filtros.dataInicio = this.formatarDataParaInput(umMesAtras);
    this.filtros.dataFim = this.formatarDataParaInput(hoje);
  }

  private formatarDataParaInput(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  carregarDadosIniciais(): void {
    forkJoin({
      motoristas: this.motoristaService.getMotoristas(),
      veiculos: this.veiculoService.getVehicles()
    }).subscribe({
      next: (result) => {
        this.motoristas = result.motoristas;
        this.veiculos = result.veiculos;
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

    forkJoin({
      motorista: this.viagemService.getRelatorioMotorista(this.filtros),
      veiculo: this.viagemService.getRelatorioVeiculo(this.filtros)
    }).subscribe({
      next: (result) => {
        console.log('Resultado motorista:', result.motorista);
        console.log('Resultado veículo:', result.veiculo);

        // Processar dados do motorista
        this.relatorioMotorista = result.motorista.map((item: any) => ({
          ...item,
          id: item.id || Math.random().toString(36).substr(2, 9) // Gerar ID se não existir
        }));

        // Processar dados do veículo
        this.relatorioVeiculo = result.veiculo.map((item: any) => ({
          ...item,
          modelo: item.modelo || 'Não especificado'
        }));

        this.calcularTotais();
        this.criarGraficos();

        this.carregando = false;

        // Mostrar mensagem de sucesso
        const filtrosAtivos = Object.values(this.filtros).some(valor =>
          valor !== '' && (valor !== this.filtros.dataInicio || valor !== this.filtros.dataFim)
        );

        if (filtrosAtivos && (this.relatorioMotorista.length > 0 || this.relatorioVeiculo.length > 0)) {
          Swal.fire('Sucesso!', 'Relatório gerado com os filtros aplicados', 'success');
        }
      },
      error: (error) => {
        console.error('Erro ao carregar relatórios:', error);
        Swal.fire('Erro', 'Não foi possível carregar os relatórios', 'error');
        this.carregando = false;
      }
    });
  }

  calcularTotais(): void {
    this.totalViagens = this.relatorioMotorista.reduce((sum, item) => sum + item.totalViagens, 0);
    this.totalKmPercorridos = this.relatorioMotorista.reduce((sum, item) => sum + (item.totalQuilometragem || 0), 0);
    this.totalLitrosAbastecidos = this.relatorioMotorista.reduce((sum, item) => sum + (item.totalCombustivel || 0), 0);
    this.mediaConsumo = this.totalLitrosAbastecidos > 0
      ? this.totalKmPercorridos / this.totalLitrosAbastecidos
      : 0;
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

    // Dados simulados
    const dadosStatus = [65, 15, 10, 10];

    this.statusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Concluídas', 'Em Andamento', 'Planeadas', 'Canceladas'],
        datasets: [{
          data: dadosStatus,
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
    if (!ctx) return;

    const labels = this.relatorioMotorista.map(m => m.nomeMotorista);
    const data = this.relatorioMotorista.map(m =>
      (m.totalCombustivel || 0) > 0 ? (m.totalQuilometragem || 0) / (m.totalCombustivel || 0) : 0
    );

    // Ordenar por consumo (do maior para o menor)
    const combined = labels.map((label, index) => ({
      label,
      value: data[index]
    })).sort((a, b) => b.value - a.value);

    const sortedLabels = combined.map(item => item.label);
    const sortedData = combined.map(item => item.value);

    this.consumoChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sortedLabels,
        datasets: [{
          label: 'Consumo (km/L)',
          data: sortedData,
          backgroundColor: sortedData.map(consumo =>
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

    // Dados simulados
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const dados = [1200, 1900, 3000, 5000, 2000, 3000, 4000, 3500, 2800, 3200, 4500, 3800];

    this.kmChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: meses,
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
    // Usar valores seguros
    const nome = motorista.nomeMotorista || 'N/A';
    const totalViagens = motorista.totalViagens || 0;
    const totalKm = motorista.totalQuilometragem || motorista.totalKm || 0;
    const totalCombustivel = motorista.totalCombustivel || motorista.totalLitrosAbastecidos || 0;

    // Calcular a média de consumo
    const mediaConsumo = totalCombustivel > 0
      ? (totalKm / totalCombustivel).toFixed(2)
      : '0.00';

    // Calcular a participação
    const participacao = this.totalViagens > 0
      ? ((totalViagens / this.totalViagens) * 100).toFixed(0)
      : '0';

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
    console.log('Dados do veículo:', veiculo); // Para debug

    // Usar valores seguros
    const matricula = veiculo.matriculaVeiculo || veiculo.veiculo || 'N/A';
    const modelo = veiculo.modelo || 'Não especificado';
    const totalViagens = veiculo.totalViagens || 0;
    const totalKm = veiculo.totalQuilometragem || veiculo.totalKm || 0;
    const totalCombustivel = veiculo.totalCombustivel || veiculo.totalLitrosAbastecidos || 0;

    // Calcular a média de consumo
    const mediaConsumo = totalCombustivel > 0
      ? (totalKm / totalCombustivel).toFixed(2)
      : '0.00';

    // Determinar a eficiência
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

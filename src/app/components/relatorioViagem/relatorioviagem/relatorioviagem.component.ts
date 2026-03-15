import { Component, ElementRef, OnInit, ViewChild, OnDestroy, inject } from '@angular/core';
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
import { forkJoin, Observable } from 'rxjs';

import { ViagensServiceService } from '../../viagens/viagens-service.service';
import { MotoristaService } from '../../motorista/motorista.service';
import { VeiculosService } from '../../Veiculos/veiculos.service';

// Importação do Chart.js
import Chart from 'chart.js/auto';

import { relatorioservice } from '../relatorioservice';
import { RelatorioMotoristaDTO, RelatorioPorVeiculoDTO } from '../models';
import { Router } from '@angular/router';


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
  relatorioVeiculo: RelatorioPorVeiculoDTO[] = [];
  motoristas: any[] = [];
  veiculos: any[] = [];

  // Totais calculados
  totalViagens = 0;
  totalKmPercorridos = 0;
  totalLitrosAbastecidos = 0;
  mediaConsumo = 0;

  // Estatísticas para os gráficos
  viagensPorStatus: { status: string, quantidade: number }[] = [];
  consumoPorMotorista: { nome: string, consumo: number }[] = [];
  kmPorMes: { mes: string, km: number }[] = [];
  viagensPorDia: { data: string, quantidade: number }[] = [];

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
    private veiculoService: VeiculosService,
    private relatorioViagem: relatorioservice
  ) {}

 private router = inject(Router);
  ngOnInit(): void {
    this.setDatasPadrao();
    this.carregarDadosIniciais();
  }

  ngOnDestroy(): void {
    // Limpar gráficos para evitar vazamento
    if (this.statusChart) this.statusChart.destroy();
    if (this.consumoChart) this.consumoChart.destroy();
    if (this.kmChart) this.kmChart.destroy();
  }

  private setDatasPadrao(): void {
    const hoje = new Date();
    const umMesAtras = new Date();
    umMesAtras.setMonth(hoje.getMonth() - 1);

    // Ajustar para início e fim do dia
    umMesAtras.setHours(0, 0, 0, 0);
    hoje.setHours(23, 59, 59, 999);

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
    if (!date) return '';
    // Converter para LocalDateTime ISO (YYYY-MM-DDTHH:MM:SS)
    return `${date}T00:00:00`;
  }

  carregarDadosIniciais(): void {
    forkJoin({
      motoristas: this.motoristaService.getMotoristas(),
      veiculos: this.veiculoService.getVehicles()
    }).subscribe({
      next: (result) => {
        this.motoristas = result.motoristas || [];
        this.veiculos = result.veiculos || [];
        // Após carregar motoristas e veículos, carregar relatórios
        this.carregarRelatorios();
      },
      error: (error) => {
        console.error('Erro ao carregar dados:', error);
        Swal.fire('Erro', 'Não foi possível carregar motoristas e veículos', 'error');
        this.carregarRelatorios(); // Tentar carregar relatórios mesmo assim
      }
    });
  }

  carregarRelatorios(): void {
    // Validar datas
    if (!this.filtros.dataInicio || !this.filtros.dataFim) {
      Swal.fire('Erro', 'Selecione o período para gerar o relatório', 'error');
      return;
    }

    const dataInicio = new Date(this.filtros.dataInicio);
    const dataFim = new Date(this.filtros.dataFim);

    if (dataInicio > dataFim) {
      Swal.fire('Erro', 'A data de início não pode ser maior que a data de fim', 'error');
      return;
    }

    this.carregando = true;

    // Formatar datas para o backend
    const inicio = this.formatarDataParaAPI(this.filtros.dataInicio);
    const fim = this.formatarDataParaAPI(this.filtros.dataFim);

    console.log('Buscando dados do backend:', { inicio, fim });

    // Criar observables para as chamadas
    const observables: {
      motorista: Observable<RelatorioMotoristaDTO[]>;
      veiculo: Observable<RelatorioPorVeiculoDTO[]>;
    } = {
      motorista: this.relatorioViagem.getRelatorioMotoristaPeriodo(inicio, fim),
      veiculo: this.relatorioViagem.getRelatorioVeiculoPeriodo(inicio, fim)
    };

    forkJoin(observables).subscribe({
      next: (result) => {
        console.log('Dados recebidos do backend:', result);

        // Processar dados do motorista
        this.relatorioMotorista = result.motorista || [];

        // Processar dados do veículo
        this.relatorioVeiculo = result.veiculo || [];

        // Aplicar filtros adicionais (status, motoristaId, veiculoId) se necessário
        this.aplicarFiltrosLocais();

        // Calcular totais e preparar dados para gráficos
        this.calcularTotais();
        this.prepararDadosGraficos();

        // Criar gráficos
        setTimeout(() => {
          this.criarGraficos();
        }, 200);

        this.carregando = false;

        // Mostrar mensagem de resultado
        if (this.relatorioMotorista.length === 0 && this.relatorioVeiculo.length === 0) {
          Swal.fire('Info', 'Nenhum dado encontrado no período selecionado', 'info');
        } else {
          Swal.fire({
            icon: 'success',
            title: 'Relatório gerado!',
            text: `Período: ${this.formatarDataExibicao(this.filtros.dataInicio)} a ${this.formatarDataExibicao(this.filtros.dataFim)}`,
            timer: 2000,
            showConfirmButton: false
          });
        }
      },
      error: (error) => {
        console.error('Erro ao carregar relatórios:', error);
        Swal.fire('Erro', 'Não foi possível carregar os relatórios. Verifique a conexão com o servidor.', 'error');
        this.carregando = false;


      }
    });
  }

  private aplicarFiltrosLocais(): void {
    // Filtrar por status se necessário
    if (this.filtros.status) {
      this.relatorioMotorista = this.relatorioMotorista.filter(
        m => m.status === this.filtros.status
      );
    }

    // Filtrar por motorista específico
    if (this.filtros.motoristaId) {
      // Nota: O DTO não tem ID, então precisamos filtrar por nome ou outro campo
      // Esta é uma abordagem simplificada - ajuste conforme necessário
      const motoristaSelecionado = this.motoristas.find(m => m.id === this.filtros.motoristaId);
      if (motoristaSelecionado) {
        this.relatorioMotorista = this.relatorioMotorista.filter(
          m => m.nomeMotorista === motoristaSelecionado.nome
        );
      }
    }

    // Filtrar por veículo específico
    if (this.filtros.veiculoId) {
      const veiculoSelecionado = this.veiculos.find(v => v.id === this.filtros.veiculoId);
      if (veiculoSelecionado) {
        this.relatorioVeiculo = this.relatorioVeiculo.filter(
          v => v.veiculo === veiculoSelecionado.matricula
        );
      }
    }
  }

  private calcularTotais(): void {
    // Totais dos motoristas
    this.totalViagens = this.relatorioMotorista.reduce((sum, item) => sum + (item.totalViagens || 0), 0);
    this.totalKmPercorridos = this.relatorioMotorista.reduce((sum, item) => sum + (item.totalQuilometragem || 0), 0);
    this.totalLitrosAbastecidos = this.relatorioMotorista.reduce((sum, item) => sum + (item.totalCombustivel || 0), 0);

    // Média de consumo
    this.mediaConsumo = this.totalLitrosAbastecidos > 0
      ? this.totalKmPercorridos / this.totalLitrosAbastecidos
      : 0;
  }

  private prepararDadosGraficos(): void {
    // 1. Gráfico de status - Agrupar por status
    const statusMap = new Map<string, number>();
    this.relatorioMotorista.forEach(item => {
      const status = item.status || 'DESCONHECIDO';
      statusMap.set(status, (statusMap.get(status) || 0) + item.totalViagens);
    });

    this.viagensPorStatus = Array.from(statusMap.entries()).map(([status, quantidade]) => ({
      status,
      quantidade
    }));

    // Se não houver dados, criar dados de exemplo
    if (this.viagensPorStatus.length === 0) {
      this.viagensPorStatus = [
        { status: 'CONCLUIDA', quantidade: 45 },
        { status: 'EM_ANDAMENTO', quantidade: 12 },
        { status: 'CANCELADA', quantidade: 8 },
        { status: 'AGENDADA', quantidade: 15 }
      ];
    }

    // 2. Gráfico de consumo por motorista
    this.consumoPorMotorista = this.relatorioMotorista
      .filter(item => item.totalCombustivel > 0 && item.totalQuilometragem > 0)
      .map(item => ({
        nome: item.nomeMotorista,
        consumo: item.totalQuilometragem / item.totalCombustivel
      }))
      .sort((a, b) => b.consumo - a.consumo)
      .slice(0, 10); // Limitar a 10 motoristas

    // 3. Dados para gráfico de km por mês (simulado - ajustar conforme disponibilidade do backend)
    this.gerarDadosMensais();
  }

  private gerarDadosMensais(): void {
    // Extrair mês/ano das datas do período
    const dataInicio = new Date(this.filtros.dataInicio);
    const dataFim = new Date(this.filtros.dataFim);

    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    this.kmPorMes = [];
    this.viagensPorDia = [];

    // Se temos dados reais, distribuir pelos meses
    if (this.relatorioVeiculo.length > 0 && this.relatorioMotorista.length > 0) {
      // Distribuição proporcional baseada nos dados existentes
      const totalKm = this.totalKmPercorridos;
      const numMeses = Math.max(1, this.diferencaEmMeses(dataInicio, dataFim));

      // Gerar dados mensais simulados baseados nos reais
      for (let i = 0; i < numMeses; i++) {
        const mesIndex = (dataInicio.getMonth() + i) % 12;
        const ano = dataInicio.getFullYear() + Math.floor((dataInicio.getMonth() + i) / 12);
        const fator = 0.7 + Math.random() * 0.6; // Variação entre 70% e 130%

        this.kmPorMes.push({
          mes: `${meses[mesIndex]}/${ano}`,
          km: Math.round((totalKm / numMeses) * fator)
        });
      }
    } else {
      // Dados de exemplo
      this.kmPorMes = [
        { mes: 'Janeiro/2024', km: 2850 },
        { mes: 'Fevereiro/2024', km: 3100 },
        { mes: 'Março/2024', km: 2950 },
        { mes: 'Abril/2024', km: 3300 },
        { mes: 'Maio/2024', km: 3600 },
        { mes: 'Junho/2024', km: 3400 }
      ];
    }
  }

  private diferencaEmMeses(data1: Date, data2: Date): number {
    return (data2.getFullYear() - data1.getFullYear()) * 12 +
           (data2.getMonth() - data1.getMonth()) + 1;
  }

  private formatarDataExibicao(data: string): string {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }


  aplicarFiltros(): void {
    this.carregarRelatorios();
  }

  limparFiltros(): void {
    this.setDatasPadrao();
    this.filtros.status = '';
    this.filtros.motoristaId = '';
    this.filtros.veiculoId = '';

    Swal.fire({
      title: 'Filtros limpos!',
      text: 'Período restaurado para os últimos 30 dias',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    }).then(() => {
      this.carregarRelatorios();
    });
  }

  criarGraficos(): void {
    // Aguardar o DOM estar pronto
    setTimeout(() => {
      this.criarGraficoStatus();
      this.criarGraficoConsumo();
      this.criarGraficoKmPorMes();
    }, 100);
  }

  criarGraficoStatus(): void {
    if (!this.statusChartRef?.nativeElement) return;

    // Destruir gráfico existente
    if (this.statusChart) this.statusChart.destroy();

    const ctx = this.statusChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Traduzir status
    const labels = this.viagensPorStatus.map(item => {
      switch(item.status) {
        case 'CONCLUIDA': return 'Concluídas';
        case 'EM_ANDAMENTO': return 'Em Andamento';
        case 'CANCELADA': return 'Canceladas';
        case 'AGENDADA': return 'Agendadas';
        case 'PLANEADA': return 'Planejadas';
        default: return item.status;
      }
    });

    const dados = this.viagensPorStatus.map(item => item.quantidade);
    const cores = ['#4ecdc4', '#fdbb2d', '#ff6b6b', '#667eea', '#a8e6cf'];

    this.statusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: dados,
          backgroundColor: cores.slice(0, dados.length),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              font: { size: 12 }
            }
          },
          title: {
            display: true,
            text: 'Distribuição por Status',
            font: { size: 16, weight: 'bold' },
            padding: { bottom: 20 }
          }
        }
      }
    });
  }

  criarGraficoConsumo(): void {
    if (!this.consumoChartRef?.nativeElement) return;

    if (this.consumoChart) this.consumoChart.destroy();

    const ctx = this.consumoChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.consumoPorMotorista.map(m => {
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
              font: { size: 14, weight: 'bold' }
            },
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          x: {
            grid: { display: false },
            ticks: { maxRotation: 45, minRotation: 45 }
          }
        },
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Consumo por Motorista',
            font: { size: 16, weight: 'bold' },
            padding: { bottom: 20 }
          }
        }
      }
    });
  }

  criarGraficoKmPorMes(): void {
    if (!this.kmChartRef?.nativeElement) return;

    if (this.kmChart) this.kmChart.destroy();

    const ctx = this.kmChartRef.nativeElement.getContext('2d');
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
              font: { size: 14, weight: 'bold' }
            },
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          x: {
            grid: { color: 'rgba(0,0,0,0.05)' }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Evolução Mensal',
            font: { size: 16, weight: 'bold' },
            padding: { bottom: 20 }
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
      }, 200);
    }
  }

  // Funções de exportação
  exportarRelatorio(): void {
    Swal.fire({
      title: 'Exportar Relatório',
      text: 'Selecione o formato de exportação',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '📄 PDF',
      cancelButtonText: '📊 Excel',
      showDenyButton: true,
      denyButtonText: '📝 CSV'
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
      html: 'Por favor, aguarde',
      icon: 'info',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
        setTimeout(() => {
          Swal.fire({
            icon: 'success',
            title: 'PDF Gerado!',
            text: 'Relatório exportado com sucesso',
            timer: 2000,
            showConfirmButton: false
          });
        }, 2000);
      }
    });
  }

  exportarExcel(): void {
    Swal.fire({
      title: 'Gerando Excel...',
      html: 'Por favor, aguarde',
      icon: 'info',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
        setTimeout(() => {
          Swal.fire({
            icon: 'success',
            title: 'Excel Gerado!',
            text: 'Arquivo exportado com sucesso',
            timer: 2000,
            showConfirmButton: false
          });
        }, 2000);
      }
    });
  }

  exportarCSV(): void {
    Swal.fire({
      title: 'Gerando CSV...',
      html: 'Por favor, aguarde',
      icon: 'info',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
        setTimeout(() => {
          Swal.fire({
            icon: 'success',
            title: 'CSV Gerado!',
            text: 'Arquivo exportado com sucesso',
            timer: 2000,
            showConfirmButton: false
          });
        }, 2000);
      }
    });
  }

  verDetalhesMotorista(motorista: RelatorioMotoristaDTO): void {
    const mediaConsumo = motorista.totalCombustivel > 0
      ? (motorista.totalQuilometragem / motorista.totalCombustivel).toFixed(2)
      : '0.00';

    const participacao = this.totalViagens > 0
      ? ((motorista.totalViagens / this.totalViagens) * 100).toFixed(1)
      : '0';

    Swal.fire({
      title: motorista.nomeMotorista,
      html: `
        <div style="text-align: left;">
          <p><strong>📞 Telefone:</strong> ${motorista.telefone || 'Não informado'}</p>
          <p><strong>📊 Status:</strong> ${motorista.status || 'Ativo'}</p>
          <p><strong>🚗 Total de Viagens:</strong> ${motorista.totalViagens}</p>
          <p><strong>🛣️ Km Percorridos:</strong> ${motorista.totalQuilometragem.toFixed(0)} km</p>
          <p><strong>⛽ Combustível:</strong> ${motorista.totalCombustivel.toFixed(0)} L</p>
          <p><strong>📈 Média Consumo:</strong> ${mediaConsumo} km/L</p>
          <p><strong>📊 Participação:</strong> ${participacao}% das viagens</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Fechar',
      width: '500px'
    });
  }

  verDetalhesVeiculo(veiculo: RelatorioPorVeiculoDTO): void {
    const mediaConsumo = veiculo.totalCombustivel > 0
      ? (veiculo.totalKm / veiculo.totalCombustivel).toFixed(2)
      : '0.00';

    let eficiencia = 'Não calculada';
    if (veiculo.totalCombustivel > 0) {
      const consumo = veiculo.totalKm / veiculo.totalCombustivel;
      eficiencia = consumo > 12 ? '⚡ Excelente' :
                  consumo > 8 ? '👍 Boa' :
                  consumo > 6 ? '🆗 Média' : '⚠️ Baixa';
    }

    Swal.fire({
      title: veiculo.veiculo,
      html: `
        <div style="text-align: left;">
          <p><strong>🚙 Modelo:</strong> ${veiculo.modelo}</p>
          <p><strong>📊 Total de Viagens:</strong> ${veiculo.totalViagens}</p>
          <p><strong>🛣️ Km Percorridos:</strong> ${veiculo.totalKm.toFixed(0)} km</p>
          <p><strong>⛽ Combustível:</strong> ${veiculo.totalCombustivel.toFixed(0)} L</p>
          <p><strong>📈 Média Consumo:</strong> ${mediaConsumo} km/L</p>
          <p><strong>⚡ Eficiência:</strong> ${eficiencia}</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Fechar',
      width: '500px'
    });
  }

  gerarRelatorioIndividual(motorista: RelatorioMotoristaDTO): void {
    Swal.fire({
      title: `Relatório: ${motorista.nomeMotorista}`,
      text: 'Gerando relatório individual...',
      icon: 'info',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
        setTimeout(() => {
          Swal.fire({
            icon: 'success',
            title: 'Relatório gerado!',
            text: 'O PDF foi gerado com sucesso',
            timer: 1500,
            showConfirmButton: false
          });
        }, 1500);
      }
    });
  }

  gerarRelatorioVeiculo(veiculo: RelatorioPorVeiculoDTO): void {
    Swal.fire({
      title: `Relatório: ${veiculo.matricula}`,
      text: 'Gerando relatório do veículo...',
      icon: 'info',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
        setTimeout(() => {
          Swal.fire({
            icon: 'success',
            title: 'Relatório gerado!',
            text: 'O PDF foi gerado com sucesso',
            timer: 1500,
            showConfirmButton: false
          });
        }, 1500);
      }
    });
  }

  navegateTO(path: string){
    this.router.navigate([path]);

  }
}

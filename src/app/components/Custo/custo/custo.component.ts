import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule, NgIf, NgFor, NgClass } from '@angular/common';
import {
  Custo,
  CustoListDTO,
  CustoRequestDTO,
  CustoUpdateDTO,
  CustoViagemDTO,
  DashboardCustosDTO,
  RelatorioCustosDetalhadoDTO,
  RelatorioFilterDTO,
  StatusCusto
} from '../models';
import { CustoSericeService } from '../custo-serice.service';
import { VeiculosService } from '../../Veiculos/veiculos.service';
import { ViagensServiceService } from '../../viagens/viagens-service.service';
import { Veiculo } from '../../Veiculos/veiculos.model';
import { Viagem } from '../../viagens/viagem';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-custo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './custo.component.html',
  styleUrls: ['./custo.component.css']
})
export class CustoComponent implements OnInit {
  // Dados principais
  custos: CustoListDTO[] = [];
  custoSelecionado: CustoListDTO | null = null;
  dashboard: DashboardCustosDTO | null = null;
  relatorio: RelatorioCustosDetalhadoDTO | null = null;
  veiculos: Veiculo[] = [];
  viagens: Viagem[] = [];

  // Listas para dropdowns
  tiposCusto: any[] = [];
  statusCusto: any[] = [];

  // Notification properties
  notificationMessage: string = '';
  notificationType: 'success' | 'error' | 'warning' | 'info' = 'info';
  showNotification: boolean = false;

  // Forms
  custoForm!: FormGroup;
  custoUpdateForm!: FormGroup;
  custoViagemForm!: FormGroup;
  relatorioForm!: FormGroup;

  // Estados
  loading = false;
  showCriarForm = false;
  showUpdateForm = false;
  showViagemForm = false;
  showRelatorio = false;
  showDashboard = true;

  // Dados processados para dashboard
  custosPorTipo: { tipo: string, valor: number, porcentagem: number }[] = [];
  tiposCustoCompletos: any[] = [];

  constructor(
    private custoService: CustoSericeService,
    private veiculoService: VeiculosService,
    private viagemService: ViagensServiceService,
    private fb: FormBuilder,
      private snackBar: MatSnackBar,
  ) {
    this.initializeForms();
  }

  private initializeForms(): void {
    // Formulário de criação
    this.custoForm = this.fb.group({
      veiculoId: ['', Validators.required],
      viagemId: [''],
      manutencaoId: [''],
      abastecimentoId: [''],
      data: [this.getDataAtual()],
      descricao: ['', [Validators.required, Validators.maxLength(200)]],
      valor: ['', [Validators.required, Validators.min(0)]],
      tipo: ['', Validators.required],
      status: [StatusCusto.PAGO],
      observacoes: [''],
      numeroDocumento: ['']
    });

    // Formulário de atualização
    this.custoUpdateForm = this.fb.group({
      descricao: ['', Validators.required],
      valor: ['', [Validators.required, Validators.min(0)]],
      tipo: ['', Validators.required],
      status: [StatusCusto.PAGO],
      observacoes: ['']
    });

    // Formulário de custo para viagem
    this.custoViagemForm = this.fb.group({
      viagemId: ['', Validators.required],
      veiculoId: ['', Validators.required],
      tipo: ['', Validators.required],
      descricao: ['', Validators.required],
      observacoes: [''],
      valor: ['', [Validators.required, Validators.min(0)]]
    });

    // Formulário de relatório
    this.relatorioForm = this.fb.group({
      dataInicio: [this.getDataInicioMes(), Validators.required],
      dataFim: [this.getDataAtual(), Validators.required],
      veiculoId: [''],
      dataInicioTop5VeiculosMaisCarro: [''],
      dataFimTop5VeiculosMaisCarro: ['']
    });
  }

  ngOnInit(): void {
    this.carregarDadosIniciais();
  }

  // ============ NOTIFICAÇÕES ============
  showSuccess(message: string): void {
    this.notificationMessage = message;
    this.notificationType = 'success';
    this.showNotification = true;
    setTimeout(() => this.hideNotification(), 3000);
  }

  showError(message: string): void {
    this.notificationMessage = message;
    this.notificationType = 'error';
    this.showNotification = true;
    setTimeout(() => this.hideNotification(), 4000);
  }

  showWarning(message: string): void {
    this.notificationMessage = message;
    this.notificationType = 'warning';
    this.showNotification = true;
    setTimeout(() => this.hideNotification(), 3000);
  }

  showInfo(message: string): void {
    this.notificationMessage = message;
    this.notificationType = 'info';
    this.showNotification = true;
    setTimeout(() => this.hideNotification(), 3000);
  }

  hideNotification(): void {
    this.showNotification = false;
  }

  getNotificationClass(): string {
    switch (this.notificationType) {
      case 'success': return 'alert-success';
      case 'error': return 'alert-danger';
      case 'warning': return 'alert-warning';
      case 'info': return 'alert-info';
      default: return 'alert-info';
    }
  }

  // ============ CARREGAMENTO DE DADOS ============
  carregarDadosIniciais(): void {
    this.loading = true;

    Promise.all([
      this.carregarVeiculos(),
      this.carregarViagens(),
      this.carregarCustos(),
      this.carregarDashboard()
    ]).finally(() => {
      this.loading = false;
    });

    // Configurar dropdowns
    this.tiposCusto = this.getTiposCusto();
    this.statusCusto = this.getStatusCusto();
    this.tiposCustoCompletos = this.getTiposCustoCompletos();
  }

  carregarCustos(): void {
    this.custoService.listarCustos().subscribe({
      next: (custos) => {
        this.custos = custos;
      },
      error: (error) => {
        console.error('Erro ao carregar custos:', error);
        this.showError('Erro ao carregar custos');
      }
    });
  }

  carregarDashboard(): void {
    this.custoService.getDashboard().subscribe({
      next: (dashboard) => {
        this.dashboard = dashboard;
        this.processarDashboardData();
      },
      error: (error) => {
        console.error('Erro ao carregar dashboard:', error);
        this.showWarning('Erro ao carregar dashboard');
      }
    });
  }

  carregarVeiculos(): Promise<void> {
    return new Promise((resolve) => {
      this.veiculoService.getVehicles().subscribe({
        next: (veiculos) => {
          this.veiculos = veiculos;
          resolve();
        },
        error: (error) => {
          console.error('Erro ao carregar veículos:', error);
          this.showWarning('Erro ao carregar veículos');
          resolve();
        }
      });
    });
  }

  carregarViagens(): Promise<void> {
    return new Promise((resolve) => {
      this.viagemService.getViagens().subscribe({
        next: (viagens) => {
          this.viagens = viagens;
          resolve();
        },
        error: (error) => {
          console.error('Erro ao carregar viagens:', error);
          this.showWarning('Erro ao carregar viagens');
          resolve();
        }
      });
    });
  }

  // ============ CRUD ============
  criarCusto(): void {
    if (this.custoForm.valid) {
      this.loading = true;
      const custoData: CustoRequestDTO = this.custoForm.value;

      this.custoService.criarCusto(custoData).subscribe({
        next: (custo) => {
          this.showSuccess('Custo criado com sucesso!');
          this.carregarCustos();
          this.carregarDashboard();
          this.custoForm.reset({
            data: this.getDataAtual(),
            status: StatusCusto.PAGO
          });
          this.toggleForm('dashboard');
          this.loading = false;
        },
        error: (error) => {
          console.error('Erro ao criar custo:', error);
          this.showError('Erro ao criar custo: ' + error.message);
          this.loading = false;
        }
      });
    } else {
      this.showWarning('Preencha todos os campos obrigatórios');
      this.marcarCamposInvalidos(this.custoForm);
    }
  }

  editarCusto(custo: CustoListDTO): void {
    this.custoSelecionado = custo;
    this.custoUpdateForm.patchValue({
      descricao: custo.descricao,
      valor: custo.valor,
      tipo: custo.tipo,
      status: custo.status,
      observacoes: custo.descricao
    });
    this.toggleForm('atualizar');
  }

  atualizarCusto(id: number): void {
    if (this.custoUpdateForm.valid && id) {
      this.loading = true;
      const updateData: CustoUpdateDTO = this.custoUpdateForm.value;

      this.custoService.atualizarCusto(id, updateData).subscribe({
        next: (mensagem) => {
          this.showSuccess('Custo atualizado com sucesso!');
          this.carregarCustos();
          this.carregarDashboard();
          this.toggleForm('dashboard');
          this.custoSelecionado = null;
          this.loading = false;
        },
        error: (error) => {
          console.error('Erro ao atualizar custo:', error);
          this.showError('Erro ao atualizar custo: ' + error.message);
          this.loading = false;
        }
      });
    } else {
      this.showWarning('Preencha todos os campos obrigatórios');
    }
  }


  excluirCusto(custo: any): void {
      Swal.fire({
        title: 'Tem certeza?',
        text: `Deseja excluir o custo do veículo ${custo.veiculo?.matricula || 'N/A'}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sim, excluir!',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed && custo.id) {
        this.loading = true;
        this.custoService.excluirCusto(custo.id!).subscribe({
          next: (mensagem) => {
            this.showSuccess('Custo excluído com sucesso!');
          this.carregarCustos();
          this.carregarDashboard();
          this.loading = false;
          },
          error: (error) => {
        console.error('Erro ao excluir custo:', error);
          this.showError('Erro ao excluir custo: ' + error.message);
          this.loading = false;
          }
        });
      }
    });

  }
  // ============ CUSTOS DE VIAGEM ============
  criarCustoViagem(): void {
    if (this.custoViagemForm.valid) {
      this.loading = true;
      const custoViagemData: CustoViagemDTO = this.custoViagemForm.value;

      this.custoService.criarCustoViagem(custoViagemData).subscribe({
        next: (custo) => {
          this.showSuccess('Custo de viagem criado com sucesso!');
          this.carregarCustos();
          this.carregarDashboard();
          this.custoViagemForm.reset();
          this.toggleForm('dashboard');
          this.loading = false;
        },
        error: (error) => {
          console.error('Erro ao criar custo de viagem:', error);
          this.showError('Erro ao criar custo de viagem: ' + error.message);
          this.loading = false;
        }
      });
    } else {
      this.showWarning('Preencha todos os campos obrigatórios');
    }
  }

  // ============ RELATÓRIOS ============
  gerarRelatorio(): void {
    if (this.relatorioForm.valid) {
      this.loading = true;
      const filtro: RelatorioFilterDTO = this.relatorioForm.value;

      this.custoService.gerarRelatorio(filtro).subscribe({
        next: (relatorio) => {
          this.relatorio = relatorio;
          this.loading = false;
          this.showSuccess('Relatório gerado com sucesso!');
        },
        error: (error) => {
          console.error('Erro ao gerar relatório:', error);
          this.showError('Erro ao gerar relatório: ' + error.message);
          this.loading = false;
        }
      });
    } else {
      this.showWarning('Preencha as datas de início e fim');
    }
  }

  // ============ MÉTODOS AUXILIARES ============
  toggleForm(formType: string): void {
    this.showCriarForm = formType === 'criar';
    this.showUpdateForm = formType === 'atualizar';
    this.showViagemForm = formType === 'viagem';
    this.showRelatorio = formType === 'relatorio';
    this.showDashboard = formType === 'dashboard';

    if (formType === 'dashboard') {
      this.custoSelecionado = null;
      this.relatorio = null;
    }

    this.hideNotification();
  }

  private marcarCamposInvalidos(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      if (control?.invalid) {
        control.markAsTouched();
      }
    });
  }

  // ============ FORMATAÇÃO ============
  formatarData(data: any): string {
    if (!data) return '--';

    try {
      let date: Date;

      if (Array.isArray(data)) {
        const [year, month, day] = data;
        date = new Date(year, month - 1, day);
      } else if (typeof data === 'string') {
        date = new Date(data);
      } else if (data instanceof Date) {
        date = data;
      } else {
        return '--';
      }

      if (isNaN(date.getTime())) {
        return '--';
      }

      const dia = date.getDate().toString().padStart(2, '0');
      const mes = (date.getMonth() + 1).toString().padStart(2, '0');
      const ano = date.getFullYear();

      return `${dia}/${mes}/${ano}`;
    } catch (error) {
      console.error('Erro ao formatar data:', data, error);
      return '--';
    }
  }

  formatarMoeda(valor: number | undefined): string {
    if (valor === undefined || valor === null) {
      return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  formatarTipoCusto(tipo: string): string {
    const tipoEncontrado = this.tiposCusto.find(t => t.value === tipo);
    return tipoEncontrado ? tipoEncontrado.label : tipo;
  }

  formatarStatusCusto(status: string): string {
    const statusEncontrado = this.statusCusto.find(s => s.value === status);
    return statusEncontrado ? statusEncontrado.label : status;
  }

  getVariacaoColor(variacao: number | undefined): string {
    if (variacao === undefined) return 'text-secondary';
    return variacao >= 0 ? 'text-danger' : 'text-success';
  }

  getVariacaoIcon(variacao: number | undefined): string {
    if (variacao === undefined) return '';
    return variacao >= 0 ? '↑' : '↓';
  }

  // ============ DASHBOARD ============
  private processarDashboardData(): void {
    if (!this.dashboard) return;
    this.processarCustosPorTipo();
  }

  private processarCustosPorTipo(): void {
    if (!this.dashboard?.custosPorTipo) {
      this.custosPorTipo = [];
      return;
    }

    const total = this.dashboard.totalMesAtual || 1;
    const custosArray = this.dashboard.custosPorTipo as any[];

    this.custosPorTipo = custosArray
      .filter(item => item.valor > 0)
      .map(item => ({
        tipo: item.tipo,
        valor: item.valor,
        porcentagem: (item.valor / total) * 100
      }))
      .sort((a, b) => b.valor - a.valor);
  }

  // ============ CONFIGURAÇÕES ============
  private getTiposCusto(): any[] {
    return [
      { value: 'COMBUSTIVEL', label: 'Combustível' },
      { value: 'MANUTENCAO_PREVENTIVA', label: 'Manutenção Preventiva' },
      { value: 'MANUTENCAO_CORRETIVA', label: 'Manutenção Corretiva' },
      { value: 'PEDAGIO', label: 'Pedágio' },
      { value: 'LAVAGEM', label: 'Lavagem' },
      { value: 'SEGURO', label: 'Seguro' },
      { value: 'IPVA', label: 'IPVA' },
      { value: 'LICENCIAMENTO', label: 'Licenciamento' },
      { value: 'MULTAS', label: 'Multas' },
      { value: 'OUTROS', label: 'Outros' }
    ];
  }

  private getStatusCusto(): any[] {
    return [
      { value: StatusCusto.PAGO, label: 'Pago' },
      { value: StatusCusto.PENDENTE, label: 'Pendente' },
      { value: StatusCusto.AGENDADO, label: 'Agendado' },
      { value: StatusCusto.CANCELADO, label: 'Cancelado' }
    ];
  }

  private getTiposCustoCompletos(): any[] {
    return [
      { value: 'COMBUSTIVEL', label: 'Combustível', cor: '#ff6b6b', icone: 'bi-fuel-pump' },
      { value: 'MANUTENCAO_PREVENTIVA', label: 'Manutenção Preventiva', cor: '#4ecdc4', icone: 'bi-tools' },
      { value: 'MANUTENCAO_CORRETIVA', label: 'Manutenção Corretiva', cor: '#45b7d1', icone: 'bi-wrench' },
      { value: 'PEDAGIO', label: 'Pedágio', cor: '#96ceb4', icone: 'bi-signpost' },
      { value: 'LAVAGEM', label: 'Lavagem', cor: '#feca57', icone: 'bi-droplet' },
      { value: 'SEGURO', label: 'Seguro', cor: '#ff9ff3', icone: 'bi-shield-check' },
      { value: 'IPVA', label: 'IPVA', cor: '#54a0ff', icone: 'bi-file-text' },
      { value: 'LICENCIAMENTO', label: 'Licenciamento', cor: '#5f27cd', icone: 'bi-card-checklist' },
      { value: 'MULTAS', label: 'Multas', cor: '#ff9f43', icone: 'bi-exclamation-triangle' },
      { value: 'OUTROS', label: 'Outros', cor: '#c8d6e5', icone: 'bi-three-dots' }
    ];
  }

  getCorPorTipo(tipo: string): string {
    const tipoEncontrado = this.tiposCustoCompletos.find(t => t.value === tipo);
    return tipoEncontrado ? tipoEncontrado.cor : '#c8d6e5';
  }

  getIconePorTipo(tipo: string): string {
    const tipoEncontrado = this.tiposCustoCompletos.find(t => t.value === tipo);
    return tipoEncontrado ? tipoEncontrado.icone : 'bi-three-dots';
  }

  // ============ CÁLCULOS ============
  calcularTotalCustos(): number {
    return this.custos.reduce((sum, c) => sum + (c.valor || 0), 0);
  }

  calcularTotalUltimosCustos(): number {
    if (!this.dashboard?.ultimosCustos) return 0;
    return this.dashboard.ultimosCustos.reduce((sum, c) => sum + (c.valor || 0), 0);
  }

  // ============ DATAS ============
  getDataAtual(): string {
    return new Date().toISOString().split('T')[0];
  }

  getDataInicioMes(): string {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
  }

  getDataAtualFormatada(): string {
    const agora = new Date();
    const dia = agora.getDate().toString().padStart(2, '0');
    const mes = (agora.getMonth() + 1).toString().padStart(2, '0');
    const ano = agora.getFullYear();
    const hora = agora.getHours().toString().padStart(2, '0');
    const minuto = agora.getMinutes().toString().padStart(2, '0');
    return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
  }
}

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, NgIf, NgFor, NgClass } from '@angular/common';  // CORRIGIDO
import { Custo, CustoListDTO, CustoRequestDTO, CustoUpdateDTO, CustoViagemDTO, DashboardCustosDTO, RelatorioCustosDetalhadoDTO, RelatorioFilterDTO, StatusCusto } from '../models';
import { CustoSericeService } from '../custo-serice.service';
import { VeiculosService } from '../../Veiculos/veiculos.service';
import { ViagensServiceService } from '../../viagens/viagens-service.service';
import { Veiculo } from '../../Veiculos/veiculos.model';
import { Viagem } from '../../viagens/viagem';

@Component({
  selector: 'app-custo',
  standalone: true,
  imports: [
    CommonModule,          // Para *ngIf, *ngFor, *ngClass
    ReactiveFormsModule,   // Para formulários reativos
  ],
  templateUrl: './custo.component.html',
  styleUrl: './custo.component.css'
})
export class CustoComponent implements OnInit {
  custos: CustoListDTO[] = [];
  custoSelecionado: Custo | null = null;
  dashboard: DashboardCustosDTO | null = null;
  relatorio: RelatorioCustosDetalhadoDTO | null = null;
  veiculos: Veiculo[] = [];
  viagens: Viagem[] = [];
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

  // Filtros
  filtroDataInicio: Date | null = null;
  filtroDataFim: Date | null = null;
  filtroVeiculoId: number | null = null;

  constructor(
    private custoService: CustoSericeService,
    private veiculoService: VeiculosService,
    private viagemService: ViagensServiceService,
    private fb: FormBuilder
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
      data: [new Date().toISOString().split('T')[0]],
      descricao: ['', [Validators.required, Validators.maxLength(200)]],
      valor: ['', [Validators.required, Validators.min(0)]],
      tipo: ['', Validators.required],
      status: [StatusCusto.PAGO],
      observacoes: [''],
      numeroDocumento: ['']
    });

    // Formulário de atualização
    this.custoUpdateForm = this.fb.group({
      descricao: [''],
      valor: ['', Validators.min(0)],
      tipo: [''],
      status: [''],
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
      dataInicio: ['', Validators.required],
      dataFim: ['', Validators.required],
      veiculoId: [''],
      dataInicioTop5VeiculosMaisCarro: [''],
      dataFimTop5VeiculosMaisCarro: ['']
    });
  }

  ngOnInit(): void {
    this.carregarDadosIniciais();
  }

  // Métodos de notificação customizados
  showSuccess(message: string): void {
    this.notificationMessage = message;
    this.notificationType = 'success';
    this.showNotification = true;
    console.log('✅ ' + message);
    setTimeout(() => this.hideNotification(), 3000);
  }

  showError(message: string): void {
    this.notificationMessage = message;
    this.notificationType = 'error';
    this.showNotification = true;
    console.error('❌ ' + message);
    setTimeout(() => this.hideNotification(), 4000);
  }

  showWarning(message: string): void {
    this.notificationMessage = message;
    this.notificationType = 'warning';
    this.showNotification = true;
    console.warn('⚠️ ' + message);
    setTimeout(() => this.hideNotification(), 3000);
  }

  showInfo(message: string): void {
    this.notificationMessage = message;
    this.notificationType = 'info';
    this.showNotification = true;
    console.info('ℹ️ ' + message);
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

  carregarDadosIniciais(): void {
    this.loading = true;

    // Carregar dados iniciais
    this.carregarCustos();
    this.carregarDashboard();
    this.carregarVeiculos();
    this.carregarViagens();

    // Configurar dropdowns
    this.tiposCusto = this.getTiposCusto();
    this.statusCusto = this.getStatusCusto();

    this.loading = false;
  }

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

  carregarCustos(): void {
    this.custoService.listarCustos().subscribe({
      next: (custos) => {
        this.custos = custos;
      },
      error: (error) => {
        console.error('Erro ao carregar custos:', error);
        this.showError('Erro ao carregar custos: ' + error.message);
      }
    });
  }

  carregarDashboard(): void {
    this.custoService.getDashboard().subscribe({
      next: (dashboard) => {
        this.dashboard = dashboard;
      },
      error: (error) => {
        console.error('Erro ao carregar dashboard:', error);
        this.showWarning('Erro ao carregar dashboard');
      }
    });
  }

  carregarVeiculos(): void {
    this.veiculoService.getVehicles().subscribe({
      next: (veiculos) => {
        this.veiculos = veiculos;
      },
      error: (error) => {
        console.error('Erro ao carregar veículos:', error);
        this.showWarning('Erro ao carregar veículos');
      }
    });
  }

  carregarViagens(): void {
    this.viagemService.getViagens().subscribe({
      next: (viagens) => {
        this.viagens = viagens;
      },
      error: (error) => {
        console.error('Erro ao carregar viagens:', error);
        this.showWarning('Erro ao carregar viagens');
      }
    });
  }

  // Métodos CRUD
  criarCusto(): void {
    if (this.custoForm.valid) {
      this.loading = true;
      const custoData: CustoRequestDTO = this.custoForm.value;

      this.custoService.criarCusto(custoData).subscribe({
        next: (custo) => {
        console.log(custo);
          this.showSuccess('Custo criado com sucesso!');
          this.carregarCustos();
          this.carregarDashboard();
          this.resetForm();
          this.showCriarForm = false;
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
    }
  }

  selecionarCusto(custo: any): void {
    this.custoUpdateForm.patchValue({
      descricao: custo.descricao,
      valor: custo.valor
    });
    this.showUpdateForm = true;
  }

  atualizarCusto(id: number): void {
    if (this.custoUpdateForm.valid && id) {
      this.loading = true;
      const updateData: CustoUpdateDTO = this.custoUpdateForm.value;

      this.custoService.atualizarCusto(id, updateData).subscribe({
        next: (mensagem) => {
          this.showSuccess(mensagem);
          this.carregarCustos();
          this.carregarDashboard();
          this.resetForm();
          this.showUpdateForm = false;
          this.loading = false;
        },
        error: (error) => {
          console.error('Erro ao atualizar custo:', error);
          this.showError('Erro ao atualizar custo: ' + error.message);
          this.loading = false;
        }
      });
    }
  }

  excluirCusto(id: number): void {
    if (confirm('Tem certeza que deseja excluir este custo?')) {
      this.loading = true;
      this.custoService.excluirCusto(id).subscribe({
        next: (mensagem) => {
          this.showSuccess(mensagem);
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
  }

  // Métodos para custos de viagem
  criarCustoViagem(): void {
    if (this.custoViagemForm.valid) {
      this.loading = true;
      const custoViagemData: CustoViagemDTO = this.custoViagemForm.value;

      this.custoService.criarCustoViagem(custoViagemData).subscribe({
        next: (custo) => {
          this.showSuccess('Custo de viagem criado com sucesso!');
          this.carregarCustos();
          this.carregarDashboard();
          this.resetForm();
          this.showViagemForm = false;
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

  // Métodos de relatório
  gerarRelatorio(): void {
    if (this.relatorioForm.valid) {
      this.loading = true;
      const filtro: RelatorioFilterDTO = this.relatorioForm.value;

      this.custoService.gerarRelatorio(filtro).subscribe({
        next: (relatorio) => {
          this.relatorio = relatorio;
          this.showRelatorio = true;
          this.showDashboard = false;
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

  // Métodos auxiliares
  resetForm(): void {
    this.custoForm.reset({
      data: new Date().toISOString().split('T')[0],
      status: StatusCusto.PAGO
    });
    this.custoUpdateForm.reset();
    this.custoViagemForm.reset();
    this.relatorioForm.reset();
  }

  toggleForm(formType: string): void {
    this.showCriarForm = formType === 'criar';
    this.showUpdateForm = formType === 'atualizar';
    this.showViagemForm = formType === 'viagem';
    this.showRelatorio = formType === 'relatorio';
    this.showDashboard = formType === 'dashboard';
    this.hideNotification();
  }

  formatarData(data: any): string {
    if (!data) return '--';

    try {
      let date: Date;

      if (Array.isArray(data)) {
        const [year, month, day, hour = 0, minute = 0] = data;
        date = new Date(year, month - 1, day, hour, minute);
      } else if (typeof data === 'string') {
        if (data.trim() === '') return '--';
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

  getVariacaoColor(variacao: number | undefined): string {
    if (variacao === undefined) return 'text-secondary';
    return variacao >= 0 ? 'text-danger' : 'text-success';
  }

  getVariacaoIcon(variacao: number | undefined): string {
    if (variacao === undefined) return '';
    return variacao >= 0 ? '↑' : '↓';
  }
}

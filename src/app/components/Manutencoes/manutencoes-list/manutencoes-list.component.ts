import { Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import Swal from 'sweetalert2';

// Importar o service e interfaces
import {
  ManutencoesServiceService,
  TipoManutencao,
  ManutencaoDTO
} from '../manutencoes-service.service';
import { Manutencao, RelatorioManutencaoDTO } from '../manutencao';
import { Veiculo } from '../../Veiculos/veiculos.model';
import { Router } from '@angular/router';
import { LoginService } from '../../auth/login.service';
import { RelatorioManutencaoService } from '../../relatorioManutecao/relatorio-service.service';


@Component({
  selector: 'app-manutencoes-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatChipsModule
  ],
  templateUrl: './manutencoes-list.component.html',
  styleUrls: ['./manutencoes-list.component.css']
})
export class ManutencoesListComponent implements OnInit {
router = inject(Router);
  loginService = inject(LoginService);

  // Abas
  abaAtiva: 'lista' | 'relatorio' = 'lista';

  // Dados principais
  manutencoes: Manutencao[] = [];
  veiculos: Veiculo[] = [];
  dataSource = new MatTableDataSource<Manutencao>([]);
  carregando: boolean = false;
  carregandoModal: boolean = false;

  // Filtros da lista
  filtroVeiculo: string = '';
  filtroTipo: string = '';
  filtroStatus: string = '';

  // Tipos e Status
  tiposManutencao: string[] = ['PREVENTIVA', 'CORRETIVA', 'URGENTE'];
  statusLista: string[] = ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'];

  // Alertas
  alertas: string[] = [];

  // Modal
  mostrarModal: boolean = false;
  mostrarModalAcao: boolean = false;
  editando: boolean = false;
  manutencaoSelecionada: Manutencao | null = null;
  tipoAcao: 'iniciar' | 'concluir' | 'cancelar' | null = null;
  observacoes: string = '';
  motivoCancelamento: string = '';
  tentouConfirmar: boolean = false;

  // Formulário
  manutencaoForm!: FormGroup;

  // Variáveis do Relatório
  relatorios: any[] = [];
  relatoriosFiltrados: any[] = [];
  veiculosRelatorio: string[] = [];
  veiculoSelecionado: string = '';
  filtroAtivo: string = 'veiculo';
  dataInicio: string = '';
  dataFim: string = '';
  hoje: Date = new Date();
  erroRelatorio: string = '';
  totalGeralGasto: number = 0;
  totalGeralManutencoes: number = 0;

  // Paginação
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private fb: FormBuilder,
    private manutencaoService: ManutencoesServiceService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.carregarDados();
    this.carregarVeiculos();
  }

  // Inicializar formulário
  initForm(): void {
    this.manutencaoForm = this.fb.group({
      veiculo_id: ['', Validators.required],
      tipoManutencao: ['', Validators.required],
      dataManutencao: ['', Validators.required],
      kilometragemVeiculo: ['', Validators.required],
      custo: ['', Validators.required],
      status: ['PENDENTE'],
      proximaManutencaoKm: [''],
      proximaManutencaoData: [''],
      descricao: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  // Carregar veículos
  carregarVeiculos(): void {
    this.manutencaoService.getVeiculos().subscribe({
      next: (data) => {
        this.veiculos = data;
      },
      error: (error) => {
        console.error('Erro ao carregar veículos:', error);
      }
    });
  }

  // Carregar manutenções
  carregarDados(): void {
    this.carregando = true;
    this.manutencaoService.getAll().subscribe({
      next: (data) => {
        this.manutencoes = data;
        this.dataSource.data = data;
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
        this.calcularAlertas();
        this.carregando = false;
      },
      error: (error) => {
        console.error('Erro ao carregar manutenções:', error);
        this.carregando = false;
      }
    });
  }

  // Calcular alertas
  calcularAlertas(): void {
    this.alertas = [];
    const hoje = new Date();
    this.manutencoes.forEach(m => {
      if (m.proximaManutencaoData) {
        const proxima = new Date(m.proximaManutencaoData);
        const diffDias = Math.ceil((proxima.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDias <= 7 && diffDias >= 0) {
          this.alertas.push(`Manutenção próxima para ${m.veiculo?.matricula} em ${diffDias} dias`);
        }
      }
    });
  }

  // Salvar manutenção
  salvarManutencao(): void {
    if (this.manutencaoForm.invalid) {
      Object.keys(this.manutencaoForm.controls).forEach(key => {
        this.manutencaoForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.carregandoModal = true;
    const dados = this.manutencaoForm.value;

    if (this.editando && this.manutencaoSelecionada) {
      this.manutencaoService.update(this.manutencaoSelecionada.id!, dados).subscribe({
        next: () => {
          this.carregarDados();
          this.fecharModal();
          this.carregandoModal = false;
        },
        error: (error) => {
          console.error('Erro ao atualizar manutenção:', error);
          this.carregandoModal = false;
        }
      });
    } else {
      this.manutencaoService.create(dados).subscribe({
        next: () => {
          this.carregarDados();
          this.fecharModal();
          this.carregandoModal = false;
        },
        error: (error) => {
          console.error('Erro ao criar manutenção:', error);
          this.carregandoModal = false;
        }
      });
    }
  }

  // Calcular próxima manutenção
  calcularProximaManutencao(): void {
    const kmAtual = this.manutencaoForm.get('kilometragemVeiculo')?.value;
    if (kmAtual) {
      const proximaKm = kmAtual + 5000;
      this.manutencaoForm.patchValue({ proximaManutencaoKm: proximaKm });
    }
  }

  // Abrir modal de cadastro
  abrirModalCadastro(manutencao?: Manutencao): void {
    this.editando = !!manutencao;
    
    if (manutencao) {
      this.manutencaoSelecionada = manutencao;
      this.manutencaoForm.patchValue({
        veiculo_id: manutencao.veiculo?.id,
        tipoManutencao: manutencao.tipoManutencao!,
        dataManutencao: manutencao.dataManutencao!,
        kilometragemVeiculo: manutencao.kilometragemVeiculo,
        custo: manutencao.custo,
        status: manutencao.status,
        proximaManutencaoKm: manutencao.proximaManutencaoKm,
        proximaManutencaoData: manutencao.proximaManutencaoData,
        descricao: manutencao.descricao
      });
    } else {
      this.manutencaoForm.reset({
        status: 'PENDENTE'
      });
      this.manutencaoSelecionada = null;
    }
    
    this.mostrarModal = true;
  }

  // Fechar modal
  fecharModal(): void {
    this.mostrarModal = false;
    this.mostrarModalAcao = false;
    this.manutencaoSelecionada = null;
    this.tipoAcao = null;
    this.observacoes = '';
    this.motivoCancelamento = '';
    this.tentouConfirmar = false;
    this.manutencaoForm.reset();
  }

  // Abrir modal de ação
  abrirModalAcao(tipo: 'iniciar' | 'concluir' | 'cancelar', manutencao: Manutencao): void {
    this.tipoAcao = tipo;
    this.manutencaoSelecionada = manutencao;
    this.observacoes = '';
    this.motivoCancelamento = '';
    this.tentouConfirmar = false;
    this.mostrarModalAcao = true;
  }

  // Confirmar ação
  confirmarAcao(): void {
    if (this.tipoAcao === 'cancelar' && !this.motivoCancelamento?.trim()) {
      this.tentouConfirmar = true;
      return;
    }

    this.carregando = true;

    switch (this.tipoAcao) {
      case 'iniciar':
        this.manutencaoService.iniciarManutencao(this.manutencaoSelecionada!.id).subscribe({
          next: () => {
            this.carregarDados();
            this.carregarRelatorioPorVeiculo();
            this.fecharModal();
            this.carregando = false;
          },
          error: (error) => {
            console.error('Erro ao iniciar manutenção:', error);
            this.carregando = false;
          }
        });
        break;
      case 'concluir':
        this.manutencaoService.concluirManutencao(this.manutencaoSelecionada!.id, this.observacoes).subscribe({
          next: () => {
            this.carregarDados();
            this.carregarRelatorioPorVeiculo();
            this.fecharModal();
            this.carregando = false;
          },
          error: (error) => {
            console.error('Erro ao concluir manutenção:', error);
            this.carregando = false;
          }
        });
        break;
      case 'cancelar':
        this.manutencaoService.cancelarManutencao(this.manutencaoSelecionada!.id, this.motivoCancelamento).subscribe({
          next: () => {
            this.carregarDados();
            this.carregarRelatorioPorVeiculo();
            this.fecharModal();
            this.carregando = false;
          },
          error: (error) => {
            console.error('Erro ao cancelar manutenção:', error);
            this.carregando = false;
          }
        });
        break;
    }
  }

  // Ver detalhes
  verDetalhes(manutencao: Manutencao): void {
    alert(`Detalhes da manutenção:\n\n` +
          `Veículo: ${manutencao.veiculo?.matricula || 'N/A'}\n` +
          `Tipo: ${this.getTipoManutencaoLabel(manutencao.tipoManutencao!)}\n` +
          `Custo: ${this.formatarMoeda(manutencao.custo)}\n` +
          `Status: ${this.getStatusLabel(manutencao.status!)}`);
  }

  // Excluir manutenção
  excluirManutencao(manutencao: Manutencao): void {
    if (confirm(`Deseja excluir a manutenção do veículo ${manutencao.veiculo?.matricula}?`)) {
      this.manutencaoService.delete(manutencao.id!).subscribe({
        next: () => {
          this.carregarDados();
          this.carregarRelatorioPorVeiculo();
        },
        error: (error) => {
          console.error('Erro ao excluir manutenção:', error);
        }
      });
    }
  }

  // Aplicar filtros
  aplicarFiltros(): void {
    let filtrados = [...this.manutencoes];

    if (this.filtroVeiculo) {
      filtrados = filtrados.filter(m =>
        m.veiculo?.matricula?.toLowerCase().includes(this.filtroVeiculo.toLowerCase()) ||
        m.veiculo?.modelo?.toLowerCase().includes(this.filtroVeiculo.toLowerCase())
      );
    }

    if (this.filtroTipo) {
      filtrados = filtrados.filter(m => m.tipoManutencao === this.filtroTipo);
    }

    if (this.filtroStatus) {
      filtrados = filtrados.filter(m => m.status === this.filtroStatus);
    }

    this.dataSource.data = filtrados;
  }

  limparFiltros(): void {
    this.filtroVeiculo = '';
    this.filtroTipo = '';
    this.filtroStatus = '';
    this.dataSource.data = this.manutencoes;
  }

  // ========== MÉTODOS DO RELATÓRIO ==========

  carregarRelatorioPorVeiculo(): void {
    this.carregando = true;
    this.erroRelatorio = '';
    this.filtroAtivo = 'veiculo';

    // Agrupar manutenções por veículo
    const relatorioMap = new Map();
    
    this.manutencoes.forEach(manutencao => {
      const veiculoNome = manutencao.veiculo?.matricula || 'Sem veículo';
      
      if (!relatorioMap.has(veiculoNome)) {
        relatorioMap.set(veiculoNome, {
          veiculo: veiculoNome,
          totalManutencoes: 0,
          custoTotal: 0,
          custoMedio: 0,
          status: manutencao.status
        });
      }
      
      const item = relatorioMap.get(veiculoNome);
      item.totalManutencoes++;
      item.custoTotal += manutencao.custo || 0;
      item.custoMedio = item.custoTotal / item.totalManutencoes;
    });
    
    this.relatorios = Array.from(relatorioMap.values());
    this.relatoriosFiltrados = [...this.relatorios];
    this.extrairVeiculosRelatorio();
    this.calcularTotaisRelatorio();
    this.carregando = false;
  }

  carregarRelatorioPorPeriodo(): void {
    if (!this.dataInicio || !this.dataFim) {
      this.erroRelatorio = 'Selecione ambas as datas (início e fim)';
      return;
    }

    const inicioDate = new Date(this.dataInicio);
    const fimDate = new Date(this.dataFim);

    if (inicioDate > fimDate) {
      this.erroRelatorio = 'Data de início não pode ser maior que data de fim';
      return;
    }

    this.carregando = true;
    this.erroRelatorio = '';
    this.filtroAtivo = 'periodo';

    const manutencoesFiltradas = this.manutencoes.filter(m => {
      const dataManu = new Date(m.dataManutencao!);
      return dataManu >= inicioDate && dataManu <= fimDate;
    });
    
    const relatorioMap = new Map();
    
    manutencoesFiltradas.forEach(manutencao => {
      const veiculoNome = manutencao.veiculo?.matricula || 'Sem veículo';
      
      if (!relatorioMap.has(veiculoNome)) {
        relatorioMap.set(veiculoNome, {
          veiculo: veiculoNome,
          totalManutencoes: 0,
          custoTotal: 0,
          custoMedio: 0,
          status: manutencao.status
        });
      }
      
      const item = relatorioMap.get(veiculoNome);
      item.totalManutencoes++;
      item.custoTotal += manutencao.custo || 0;
      item.custoMedio = item.custoTotal / item.totalManutencoes;
    });
    
    this.relatorios = Array.from(relatorioMap.values());
    this.relatoriosFiltrados = [...this.relatorios];
    this.extrairVeiculosRelatorio();
    this.calcularTotaisRelatorio();
    this.carregando = false;
  }

  extrairVeiculosRelatorio(): void {
    const veiculosUnicos = new Set<string>();
    this.relatorios.forEach(relatorio => {
      if (relatorio.veiculo) {
        veiculosUnicos.add(relatorio.veiculo);
      }
    });
    this.veiculosRelatorio = Array.from(veiculosUnicos).sort();
  }

  aplicarFiltroVeiculo(): void {
    if (this.veiculoSelecionado) {
      this.relatoriosFiltrados = this.relatorios.filter(relatorio =>
        relatorio.veiculo === this.veiculoSelecionado
      );
    } else {
      this.relatoriosFiltrados = [...this.relatorios];
    }
    this.calcularTotaisRelatorio();
  }

  limparFiltrosRelatorio(): void {
    this.veiculoSelecionado = '';
    this.dataInicio = '';
    this.dataFim = '';
    this.filtroAtivo = 'veiculo';
    this.erroRelatorio = '';
    this.carregarRelatorioPorVeiculo();
  }

  calcularTotaisRelatorio(): void {
    this.totalGeralManutencoes = this.relatoriosFiltrados.reduce((total, relatorio) =>
      total + (relatorio.totalManutencoes || 0), 0);
    this.totalGeralGasto = this.relatoriosFiltrados.reduce((total, relatorio) =>
      total + (relatorio.custoTotal || 0), 0);
  }

  getVeiculosUnicos(): number {
    const veiculos = new Set(this.relatoriosFiltrados.map(r => r.veiculo));
    return veiculos.size;
  }

  onTipoRelatorioChange(): void {
    if (this.filtroAtivo === 'veiculo') {
      this.carregarRelatorioPorVeiculo();
    }
  }

  ordenarPor(coluna: string): void {
    this.relatoriosFiltrados.sort((a, b) => {
      switch(coluna) {
        case 'veiculo':
          return (a.veiculo || '').localeCompare(b.veiculo || '');
        case 'totalManutencoes':
          return (b.totalManutencoes || 0) - (a.totalManutencoes || 0);
        case 'totalGasto':
          return (b.custoTotal || 0) - (a.custoTotal || 0);
        case 'mediaPorManutencao':
          return (b.custoMedio || 0) - (a.custoMedio || 0);
        default:
          return 0;
      }
    });
  }

  imprimirRelatorio(): void {
    window.print();
  }

  exportarParaExcel(): void {
    if (this.relatoriosFiltrados.length === 0) return;
    alert('Funcionalidade de exportação para Excel em desenvolvimento');
  }

  exportarParaPDF(): void {
    if (this.relatoriosFiltrados.length === 0) return;
    alert('Funcionalidade de exportação para PDF em desenvolvimento');
  }

  // ========== MÉTODOS AUXILIARES ==========

  get hojeString(): string {
    return this.formatarDataParaInput(this.hoje);
  }

  formatarDataParaInput(data: Date | null): string {
    if (!data) return '';
    const year = data.getFullYear();
    const month = (data.getMonth() + 1).toString().padStart(2, '0');
    const day = data.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatarData(data: string | Date): string {
    if (!data) return '';
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR');
  }

  formatarDataConclusao(data: string | Date): string {
    if (!data) return '-';
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR');
  }

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  }

  getTipoManutencaoLabel(tipo: string): string {
    const labels: Record<string, string> = {
      'PREVENTIVA': 'Preventiva',
      'CORRETIVA': 'Corretiva',
      'URGENTE': 'Urgente'
    };
    return labels[tipo] || tipo;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'PENDENTE': 'Pendente',
      'EM_ANDAMENTO': 'Em Andamento',
      'CONCLUIDA': 'Concluída',
      'CANCELADA': 'Cancelada',
      'ATRASADA': 'Atrasada',
      'AGENDADA': 'Agendada'
    };
    return labels[status] || status;
  }

  getTotalCount(): number {
    return this.manutencoes.length;
  }

  getTotalCusto(): number {
    return this.manutencoes.reduce((sum, m) => sum + (m.custo || 0), 0);
  }

  getVencidasCount(): number {
    const hoje = new Date();
    return this.manutencoes.filter(m => {
      if (m.dataManutencao) {
        return new Date(m.dataManutencao) < hoje && m.status !== 'CONCLUIDA';
      }
      return false;
    }).length;
  }

  getProximasCount(): number {
    const hoje = new Date();
    return this.manutencoes.filter(m => {
      if (m.proximaManutencaoData) {
        const proxima = new Date(m.proximaManutencaoData);
        const diffDias = Math.ceil((proxima.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        return diffDias <= 7 && diffDias >= 0;
      }
      return false;
    }).length;
  }

  getCustoMedio(): number {
    if (this.manutencoes.length === 0) return 0;
    return this.getTotalCusto() / this.manutencoes.length;
  }

  getPercentualOK(): number {
    const concluidas = this.manutencoes.filter(m => m.status === 'CONCLUIDA').length;
    if (this.manutencoes.length === 0) return 0;
    return Math.round((concluidas / this.manutencoes.length) * 100);
  }

  navegateTO(path: string): void {
    this.router.navigate([path]);
  }
}
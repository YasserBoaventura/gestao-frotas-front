import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
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
import { Manutencao } from '../manutencao';
import { Veiculo } from '../../Veiculos/veiculos.model';

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
export class ManutencoesListComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Tabela
  displayedColumns: string[] = [
    'veiculo',
    'tipo',
    'data',
    'kilometragem',
    'custo',
    'proximaManutencao',
    'status',
    'acoes'
  ];
  dataSource = new MatTableDataSource<Manutencao>([]);

  // Dados
  manutencoes: Manutencao[] = [];
  veiculos: Veiculo[] = [];
  tiposManutencao = Object.values(TipoManutencao);

  // Modal de Cadastro/Edição
  mostrarModal = false;
  editando = false;
  manutencaoSelecionada: Manutencao | null = null;
  carregandoModal = false;

  // Formulário
  manutencaoForm!: FormGroup;

  // Modal de Ações
  mostrarModalAcao = false;
  tipoAcao: 'iniciar' | 'concluir' | 'cancelar' | null = null;
  observacoes = '';
  motivoCancelamento = '';

  // Filtros
  filtroVeiculo: string = '';
  filtroTipo: string = '';
  filtroStatus: string = '';
  filtroDataInicio: Date | null = null;
  filtroDataFim: Date | null = null;

  // Loading
  carregando = false;

  // Alertas
  alertas: string[] = [];

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private manutencaoService: ManutencoesServiceService
  ) {
    this.criarFormulario();
  }

  ngOnInit(): void {
    this.carregarDados();
    this.carregarAlertas();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  criarFormulario(): void {
    this.manutencaoForm = this.fb.group({
      veiculo_id: ['', Validators.required],
      tipoManutencao: ['', Validators.required],
      dataManutencao: [new Date(), Validators.required],
      descricao: ['', [Validators.required, Validators.minLength(5)]],
      custo: [0, [Validators.required, Validators.min(0)]],
      kilometragemVeiculo: [0, [Validators.required, Validators.min(0)]],
      proximaManutencaoKm: [null],
      proximaManutencaoData: [null],
      status: ['PENDENTE']
    });
  }

  carregarDados(): void {
    this.carregando = true;

    // Carregar manutenções do backend
    this.manutencaoService.getAll().subscribe({
      next: (manutencoes) => {
        console.log('Manutenções recebidas:', manutencoes);
        this.manutencoes = this.mapearManutencoes(manutencoes);
        this.dataSource.data = this.manutencoes;
        this.carregando = false;
      },
      error: (error) => {
        console.error('Erro ao carregar manutenções:', error);
        this.mostrarErro('Erro ao carregar manutenções');
        this.carregando = false;
      }
    });

    // Carregar veículos
    this.manutencaoService.getVeiculos().subscribe({
      next: (veiculos) => {
        console.log('Veículos recebidos:', veiculos);
        this.veiculos = veiculos;
      },
      error: (error) => {
        console.error('Erro ao carregar veículos:', error);
        this.mostrarErro('Erro ao carregar veículos');
      }
    });
  }

  private mapearManutencoes(manutencoes: any[]): Manutencao[] {
    return manutencoes.map(manutencao => ({
      id: manutencao.id,
      dataManutencao: manutencao.dataManutencao ? new Date(manutencao.dataManutencao) : undefined,
      tipoManutencao: manutencao.tipoManutencao,
      descricao: manutencao.descricao,
      custo: manutencao.custo,
      kilometragemVeiculo: manutencao.kilometragemVeiculo || manutencao.kilometragemVeiculo,
      proximaManutencaoKm: manutencao.proximaManutencaoKm,
      proximaManutencaoData: manutencao.proximaManutencaoData ? new Date(manutencao.proximaManutencaoData) : undefined,
      status: manutencao.status,
      veiculo: manutencao.veiculo || {
        id: manutencao.veiculoId,
        matricula: manutencao.veiculoMatricula,
        modelo: manutencao.veiculoModelo,
        marca: manutencao.veiculoMarca || { nome: manutencao.veiculoMarca },
        kilometragemAtual: manutencao.kilometragemAtual
      }
    }));
  }

  carregarAlertas(): void {
    this.manutencaoService.getAlertas().subscribe({
      next: (alertas) => {
        this.alertas = alertas;
      },
      error: (error) => {
        console.error('Erro ao carregar alertas:', error);
        this.alertas = ['⚠️ Não foi possível carregar os alertas'];
      }
    });
  }

  // ============ MODAL CADASTRO/EDIÇÃO ============
  abrirModalCadastro(manutencao?: Manutencao): void {
    this.editando = !!manutencao;
    this.manutencaoSelecionada = manutencao || null;
    this.mostrarModal = true;
    this.carregandoModal = false;

    if (manutencao) {
      // Preencher formulário para edição
      this.manutencaoForm.patchValue({
        veiculo_id: manutencao.veiculo?.id || '',
        tipoManutencao: manutencao.tipoManutencao,
        dataManutencao: manutencao.dataManutencao ? new Date(manutencao.dataManutencao) : new Date(),
        descricao: manutencao.descricao || '',
        custo: manutencao.custo || 0,
        kilometragemVeiculo: manutencao.kilometragemVeiculo || 0,
        proximaManutencaoKm: manutencao.proximaManutencaoKm || null,
        proximaManutencaoData: manutencao.proximaManutencaoData ? new Date(manutencao.proximaManutencaoData) : null,
        status: manutencao.status || 'PENDENTE'
      });
    } else {
      // Resetar formulário para novo cadastro
      this.manutencaoForm.reset({
        dataManutencao: new Date(),
        custo: 0,
        kilometragemVeiculo: 0,
        status: 'PENDENTE'
      });
    }
  }

  fecharModal(): void {
    this.mostrarModal = false;
    this.mostrarModalAcao = false;
    this.editando = false;
    this.manutencaoSelecionada = null;
    this.tipoAcao = null;
    this.observacoes = '';
    this.motivoCancelamento = '';
    this.manutencaoForm.reset();
  }

  salvarManutencao(): void {
    if (this.manutencaoForm.invalid) {
      this.marcarCamposTocados();
      this.mostrarErro('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    this.carregandoModal = true;
    const formValue = this.manutencaoForm.value;

    const manutencaoDTO: ManutencaoDTO = {
      veiculo_id: formValue.veiculo_id,
      tipoManutencao: formValue.tipoManutencao,
      dataManutencao: formValue.dataManutencao,
      descricao: formValue.descricao,
      custo: formValue.custo,
      kilometragemVeiculo: formValue.kilometragemVeiculo,
      proximaManutencaoKm: formValue.proximaManutencaoKm,
      proximaManutencaoData: formValue.proximaManutencaoData,
      status: formValue.status

    };

    if (this.editando && this.manutencaoSelecionada?.id) {
      // Atualizar manutenção existente
      this.manutencaoService.update(this.manutencaoSelecionada.id, manutencaoDTO).subscribe({
        next: () => {
          this.carregarDados();
          this.mostrarSucesso('Manutenção atualizada com sucesso!');
          this.fecharModal();
          this.carregandoModal = false;
        },
        error: (error) => {
          console.error('Erro ao atualizar manutenção:', error);
          this.mostrarErro('Erro ao atualizar manutenção');
          this.carregandoModal = false;
        }
      });
    } else {
      // Criar nova manutenção
      this.manutencaoService.create(manutencaoDTO).subscribe({
        next: () => {
          this.carregarDados();
          this.mostrarSucesso('Manutenção cadastrada com sucesso!');
          this.fecharModal();
          this.carregandoModal = false;
        },
        error: (error) => {
          console.error('Erro ao criar manutenção:', error);
          this.mostrarErro('Erro ao criar manutenção');
          this.carregandoModal = false;
        }
      });
    }
  }

  // ============ MODAL AÇÕES ============
  abrirModalAcao(tipo: 'iniciar' | 'concluir' | 'cancelar', manutencao: Manutencao): void {
    this.tipoAcao = tipo;
    this.manutencaoSelecionada = manutencao;
    this.mostrarModalAcao = true;
    this.observacoes = '';
    this.motivoCancelamento = '';
  }

  confirmarAcao(): void {
    if (!this.manutencaoSelecionada?.id || !this.tipoAcao) return;

    this.carregando = true;

    switch(this.tipoAcao) {
      case 'iniciar':
        this.manutencaoService.iniciarManutencao(this.manutencaoSelecionada.id).subscribe({
          next: () => {
            this.carregarDados();
            this.mostrarSucesso('Manutenção iniciada com sucesso!');
            this.fecharModal();
          },
          error: (error) => {
            console.error('Erro ao iniciar manutenção:', error);
            this.mostrarErro('Erro ao iniciar manutenção');
            this.carregando = false;
          }
        });
        break;

      case 'concluir':
        this.manutencaoService.concluirManutencao(this.manutencaoSelecionada.id,
        this.observacoes
        ).subscribe({
          next: () => {
            this.carregarDados();
            this.mostrarSucesso('Manutenção concluída com sucesso!');
            this.fecharModal();
          },
          error: (error) => {
            console.error('Erro ao concluir manutenção:', error);
            this.mostrarErro('Erro ao concluir manutenção');
            this.carregando = false;
          }
        });
        break;

      case 'cancelar':
        if (!this.motivoCancelamento.trim()) {
          this.mostrarErro('Informe o motivo do cancelamento');
          this.carregando = false;
          return;
        }

        this.manutencaoService.cancelarManutencao(this.manutencaoSelecionada.id, this.motivoCancelamento).subscribe({
          next: () => {
            this.carregarDados();
            this.mostrarSucesso('Manutenção cancelada com sucesso!');
            this.fecharModal();
          },
          error: (error) => {
            console.error('Erro ao cancelar manutenção:', error);
            this.mostrarErro('Erro ao cancelar manutenção');
            this.carregando = false;
          }
        });
        break;
    }
  }

  getTituloAcao(): string {
    switch(this.tipoAcao) {
      case 'iniciar': return 'Iniciar Manutenção';
      case 'concluir': return 'Concluir Manutenção';
      case 'cancelar': return 'Cancelar Manutenção';
      default: return 'Ação';
    }
  }

  getIconeAcao(): string {
    switch(this.tipoAcao) {
      case 'iniciar': return 'play_arrow';
      case 'concluir': return 'check_circle';
      case 'cancelar': return 'cancel';
      default: return 'info';
    }
  }

  getCorAcao(): string {
    switch(this.tipoAcao) {
      case 'iniciar': return '#2196f3';
      case 'concluir': return '#4caf50';
      case 'cancelar': return '#f44336';
      default: return '#667eea';
    }
  }

  // ============ FILTROS ============
  aplicarFiltros(): void {
    let dadosFiltrados = this.manutencoes;

    if (this.filtroVeiculo && this.filtroVeiculo.trim() !== '') {
      const termo = this.filtroVeiculo.toLowerCase().trim();
      dadosFiltrados = dadosFiltrados.filter(m => {
        if (!m.veiculo) return false;
        const matricula = (m.veiculo.matricula || '').toLowerCase();
        const modelo = (m.veiculo.modelo || '').toLowerCase();
        const marca = m.veiculo.marca ?
          (typeof m.veiculo.marca.nome === 'string' ? m.veiculo.marca.nome.toLowerCase() : '') : '';
        return matricula.includes(termo) || modelo.includes(termo) || marca.includes(termo);
      });
    }

    if (this.filtroTipo && this.filtroTipo !== '') {
      dadosFiltrados = dadosFiltrados.filter(m => m.tipoManutencao === this.filtroTipo);
    }

    if (this.filtroStatus && this.filtroStatus !== '') {
      dadosFiltrados = dadosFiltrados.filter(m => m.status === this.filtroStatus);
    }

    if (this.filtroDataInicio) {
      dadosFiltrados = dadosFiltrados.filter(m => {
        if (!m.dataManutencao) return false;
        return new Date(m.dataManutencao) >= this.filtroDataInicio!;
      });
    }

    if (this.filtroDataFim) {
      dadosFiltrados = dadosFiltrados.filter(m => {
        if (!m.dataManutencao) return false;
        return new Date(m.dataManutencao) <= this.filtroDataFim!;
      });
    }

    this.dataSource.data = dadosFiltrados;
    this.dataSource._updateChangeSubscription();
  }

  limparFiltros(): void {
    this.filtroVeiculo = '';
    this.filtroTipo = '';
    this.filtroStatus = '';
    this.filtroDataInicio = null;
    this.filtroDataFim = null;
    this.dataSource.data = this.manutencoes;
    this.dataSource._updateChangeSubscription();
    this.mostrarSucesso('Filtros limpos com sucesso!');
  }

  // ============ OUTRAS AÇÕES ============
  excluirManutencao(manutencao: Manutencao): void {
    Swal.fire({
      title: 'Tem certeza?',
      text: `Deseja excluir a manutenção do veículo ${manutencao.veiculo?.matricula || 'N/A'}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && manutencao.id) {
        this.carregando = true;
        this.manutencaoService.delete(manutencao.id).subscribe({
          next: (mensagem) => {
            this.carregarDados();
            this.mostrarSucesso(mensagem || 'Manutenção excluída com sucesso!');
          },
          error: (error) => {
            console.error('Erro ao excluir manutenção:', error);
            this.mostrarErro('Erro ao excluir manutenção: ' + error.message);
            this.carregando = false;
          }
        });
      }
    });
  }

  verDetalhes(manutencao: Manutencao): void {
    Swal.fire({
      title: `Detalhes da Manutenção`,
      html: `
        <div style="text-align: left; font-size: 14px;">
          <p><strong>Veículo:</strong> ${manutencao.veiculo?.marca?.nome || manutencao.veiculo?.marca} ${manutencao.veiculo?.modelo || ''} (${manutencao.veiculo?.matricula || 'N/A'})</p>
          <p><strong>Tipo:</strong> ${this.getTipoManutencaoLabel(manutencao.tipoManutencao)}</p>
          <p><strong>Data:</strong> ${manutencao.dataManutencao ? new Date(manutencao.dataManutencao).toLocaleDateString('pt-BR') : 'Não informada'}</p>
          <p><strong>Quilometragem:</strong> ${(manutencao.kilometragemVeiculo || 0).toLocaleString('pt-BR')} km</p>
          <p><strong>Custo:</strong> R$ ${(manutencao.custo || 0).toFixed(2)}</p>
          <p><strong>Descrição:</strong> ${manutencao.descricao || 'Não informada'}</p>
          <p><strong>Status:</strong> <span style="color: ${this.getStatusColor(manutencao.status!)}; font-weight: bold">${this.getStatusLabel(manutencao.status!)}</span></p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Fechar',
      width: '600px'
    });
  }

  calcularProximaManutencao(): void {
    const formValue = this.manutencaoForm.value;
    if (formValue.tipoManutencao && formValue.kilometragemVeiculo) {
      const veiculo = this.veiculos.find(v => v.id === formValue.veiculo_id);
      if (veiculo) {
        const hoje = new Date();
        const kmAtual = formValue.kilometragemVeiculo;

        let proximaKm;
        let proximaData = new Date();

        switch(formValue.tipoManutencao) {
          case 'PREVENTIVA':
            proximaKm = kmAtual + 15000;
            proximaData.setMonth(proximaData.getMonth() + 12);
            break;
          case 'TROCA_OLEO':
            proximaKm = kmAtual + 10000;
            proximaData.setMonth(proximaData.getMonth() + 6);
            break;
          case 'REVISAO':
            proximaKm = kmAtual + 30000;
            proximaData.setMonth(proximaData.getMonth() + 24);
            break;
          default:
            this.mostrarSucesso('Manutenções corretivas não possuem periodicidade fixa');
            return;
        }

        this.manutencaoForm.patchValue({
          proximaManutencaoKm: proximaKm,
          proximaManutencaoData: proximaData
        });
        this.mostrarSucesso('Próxima manutenção calculada automaticamente!');
      }
    }
  }

  // ============ MÉTODOS AUXILIARES ============
  getTipoManutencaoLabel(tipo: any): string {
    if (!tipo) return 'Desconhecido';
    const labels: { [key: string]: string } = {
      'PREVENTIVA': 'Preventiva',
      'CORRETIVA': 'Corretiva',
      'TROCA_OLEO': 'Troca de Óleo',
      'REVISAO': 'Revisão'
    };
    return labels[tipo] || tipo;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'PENDENTE': 'Pendente',
      'EM_ANDAMENTO': 'Em Andamento',
      'CONCLUIDA': 'Concluída',
      'CANCELADA': 'Cancelada'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'PENDENTE': '#ff9800',
      'EM_ANDAMENTO': '#2196f3',
      'CONCLUIDA': '#4caf50',
      'CANCELADA': '#f44336'
    };
    return colors[status] || '#9e9e9e';
  }

  formatarData(data?: Date): string {
    if (!data) return 'Não definida';
    return data.toLocaleDateString('pt-BR');
  }

  formatarMoeda(valor?: number): string {
    if (!valor) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  marcarCamposTocados(): void {
    Object.values(this.manutencaoForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  mostrarSucesso(mensagem: string): void {
    this.snackBar.open(mensagem, 'Fechar', {
      duration: 3000,
      panelClass: ['snackbar-success']
    });
  }

  mostrarErro(mensagem: string): void {
    this.snackBar.open(mensagem, 'Fechar', {
      duration: 3000,
      panelClass: ['snackbar-error']
    });
  }

  // Métodos para o resumo (mantidos do código original)
  getTotalCount(): number {
    return this.dataSource.data?.length || 0;
  }

  getTotalCusto(): number {
    const dados = this.dataSource.data || [];
    if (dados.length === 0) return 0;
    return dados.reduce((sum, m) => sum + (m.custo || 0), 0);
  }

  getVencidasCount(): number {
    const dados = this.dataSource.data || [];
    if (dados.length === 0) return 0;
    return dados.filter(m => this.verificarStatusManutencao(m) === 'VENCIDA').length;
  }

  getProximasCount(): number {
    const dados = this.dataSource.data || [];
    if (dados.length === 0) return 0;
    return dados.filter(m => {
      const status = this.verificarStatusManutencao(m);
      return status === 'PROXIMA';
    }).length;
  }

  getCustoMedio(): number {
    const total = this.getTotalCount();
    if (total === 0) return 0;
    return this.getTotalCusto() / total;
  }

  getStatusGeral(): string {
    const vencidas = this.getVencidasCount();
    const proximas = this.getProximasCount();
    const total = this.getTotalCount();

    if (total === 0) return 'VAZIO';
    if (vencidas > 0) return 'CRITICO';
    if (proximas > 0) return 'ATENCAO';
    return 'OK';
  }

  getStatusGeralText(): string {
    const status = this.getStatusGeral();
    switch(status) {
      case 'OK': return 'Em Dia';
      case 'ATENCAO': return 'Atenção';
      case 'CRITICO': return 'Crítico';
      default: return 'Sem Dados';
    }
  }

  getPercentualOK(): number {
    const dados = this.dataSource.data || [];
    if (dados.length === 0) return 0;
    const okCount = dados.filter(m => this.verificarStatusManutencao(m) === 'OK').length;
    return Math.round((okCount / dados.length) * 100);
  }

  verificarStatusManutencao(manutencao: Manutencao): string {
    const hoje = new Date();
    const kmAtual = manutencao.veiculo?.kilometragemAtual || 0;

    if (manutencao.proximaManutencaoData && new Date(manutencao.proximaManutencaoData) < hoje) {
      return 'VENCIDA';
    }

    if (manutencao.proximaManutencaoKm && kmAtual >= manutencao.proximaManutencaoKm) {
      return 'VENCIDA';
    }

    if (manutencao.proximaManutencaoData) {
      const diasParaVencimento = Math.floor(
        (new Date(manutencao.proximaManutencaoData).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diasParaVencimento <= 30 && diasParaVencimento > 0) {
        return 'PROXIMA';
      }
    }

    if (manutencao.proximaManutencaoKm) {
      const kmRestantes = manutencao.proximaManutencaoKm - kmAtual;
      if (kmRestantes <= 1000 && kmRestantes > 0) {
        return 'PROXIMA';
      }
    }

    return 'OK';
  }

  getTiposDistribuicao(): any[] {
    const dados = this.dataSource.data || [];
    if (dados.length === 0) return [];

    const tipos = this.tiposManutencao.map(tipo => ({
      key: tipo,
      label: this.getTipoManutencaoLabel(tipo),
      count: 0,
      percentual: 0
    }));

    dados.forEach(m => {
      const tipo = tipos.find(t => t.key === m.tipoManutencao);
      if (tipo) tipo.count++;
    });

    tipos.forEach(tipo => {
      tipo.percentual = Math.round((tipo.count / dados.length) * 100);
    });

    return tipos.filter(t => t.count > 0);
  }

  temFiltrosAtivos(): boolean {
    return !!this.filtroVeiculo ||
           !!this.filtroTipo ||
           !!this.filtroStatus ||
           !!this.filtroDataInicio ||
           !!this.filtroDataFim;
  }
}

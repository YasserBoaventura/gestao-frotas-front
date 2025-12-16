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
  styleUrl: './manutencoes-list.component.css'
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

  // Formulário
  manutencaoForm!: FormGroup;
  editando = false;
  manutencaoSelecionada: Manutencao | null = null;
  mostrarFormulario = false;

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
      proximaManutencaoData: [null]
    });
  }

  carregarDados(): void {
    this.carregando = true;

    // Carregar manutenções do backend
    this.manutencaoService.getAll().subscribe({
      next: (manutencoes) => {
        console.log('Manutenções recebidas:', manutencoes); // Para debug
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
        console.log('Veículos recebidos:', veiculos); // Para debug
        this.veiculos = veiculos;
      },
      error: (error) => {
        console.error('Erro ao carregar veículos:', error);
        this.mostrarErro('Erro ao carregar veículos');
      }
    });
  }

  // Método para mapear os dados recebidos do backend
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
      veiculo: manutencao.veiculo || {
        id: manutencao.veiculoId,
        matricula: manutencao.veiculoMatricula,
        modelo: manutencao.veiculoModelo,
        marca: manutencao.veiculoMarca,
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

aplicarFiltros(): void {
  let dadosFiltrados = this.manutencoes;

  if (this.filtroVeiculo && this.filtroVeiculo.trim() !== '') {
    const termo = this.filtroVeiculo.toLowerCase().trim();
    dadosFiltrados = dadosFiltrados.filter(m => {
      // Verifica se existe veículo e suas propriedades
      if (!m.veiculo) return false;

      const matricula = (m.veiculo.matricula || '').toLowerCase();
      const modelo = (m.veiculo.modelo || '').toLowerCase();
      const marca = (m.veiculo.marca.nome || '').toLowerCase();

      return matricula.includes(termo) ||
             modelo.includes(termo) ||
             marca.includes(termo);
    });
  }

  if (this.filtroTipo && this.filtroTipo !== '') {
    dadosFiltrados = dadosFiltrados.filter(m => m.tipoManutencao === this.filtroTipo);
  }

  if (this.filtroStatus && this.filtroStatus !== '') {
    dadosFiltrados = dadosFiltrados.filter(m => this.verificarStatusManutencao(m) === this.filtroStatus);
  }

  if (this.filtroDataInicio) {
    dadosFiltrados = dadosFiltrados.filter(m => {
      if (!m.dataManutencao) return false;
      const dataManutencao = new Date(m.dataManutencao);
      return dataManutencao >= this.filtroDataInicio!;
    });
  }

  if (this.filtroDataFim) {
    dadosFiltrados = dadosFiltrados.filter(m => {
      if (!m.dataManutencao) return false;
      const dataManutencao = new Date(m.dataManutencao);
      return dataManutencao <= this.filtroDataFim!;
    });
  }

  this.dataSource.data = dadosFiltrados;
}

  limparFiltros(): void {
    this.filtroVeiculo = '';
    this.filtroTipo = '';
    this.filtroStatus = '';
    this.filtroDataInicio = null;
    this.filtroDataFim = null;
    this.dataSource.data = this.manutencoes;
  }

  verificarStatusManutencao(manutencao: Manutencao): string {
    const hoje = new Date();
    const kmAtual = manutencao.veiculo?.kilometragemAtual || 0;

    // Verificar se está vencida por data
    if (manutencao.proximaManutencaoData && new Date(manutencao.proximaManutencaoData) < hoje) {
      return 'VENCIDA';
    }

    // Verificar se está vencida por quilometragem
    if (manutencao.proximaManutencaoKm && kmAtual >= manutencao.proximaManutencaoKm) {
      return 'VENCIDA';
    }

    // Verificar se está próxima (30 dias ou 1000 km)
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

  getStatusColor(status: string): string {
    switch(status) {
      case 'VENCIDA': return '#f44336'; // Vermelho
      case 'PROXIMA': return '#ff9800'; // Laranja
      case 'OK': return '#4caf50';      // Verde
      default: return '#9e9e9e';        // Cinza
    }
  }

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

  novaManutencao(): void {
    this.editando = false;
    this.manutencaoSelecionada = null;
    this.mostrarFormulario = true;
    this.manutencaoForm.reset({
      dataManutencao: new Date(),
      custo: 0,
      kilometragemVeiculo: 0
    });
  }

  editarManutencao(manutencao: Manutencao): void {
    this.editando = true;
    this.manutencaoSelecionada = manutencao;
    this.mostrarFormulario = true;

    this.manutencaoForm.patchValue({
      veiculo_id: manutencao.veiculo?.id,
      tipoManutencao: manutencao.tipoManutencao,
      dataManutencao: manutencao.dataManutencao ? new Date(manutencao.dataManutencao) : new Date(),
      descricao: manutencao.descricao || '',
      custo: manutencao.custo || 0,
      kilometragemVeiculo: manutencao.kilometragemVeiculo || 0,
      proximaManutencaoKm: manutencao.proximaManutencaoKm || null,
      proximaManutencaoData: manutencao.proximaManutencaoData ? new Date(manutencao.proximaManutencaoData) : null
    });
  }

  salvarManutencao(): void {
    if (this.manutencaoForm.invalid) {
      this.mostrarErro('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const formValue = this.manutencaoForm.value;
    const manutencaoDTO: ManutencaoDTO = {
      veiculo_id: formValue.veiculo_id,
      tipoManutencao: formValue.tipoManutencao,
      dataManutencao: formValue.dataManutencao,
      descricao: formValue.descricao,
      custo: formValue.custo,
      kilometragemVeiculo: formValue.kilometragemVeiculo,
      proximaManutencaoKm: formValue.proximaManutencaoKm,
      proximaManutencaoData: formValue.proximaManutencaoData
    };

    this.carregando = true;

    if (this.editando && this.manutencaoSelecionada?.id) {
      // Atualizar manutenção existente
      this.manutencaoService.update(this.manutencaoSelecionada.id, manutencaoDTO).subscribe({
        next: (manutencaoAtualizada) => {
          const index = this.manutencoes.findIndex(m => m.id === this. manutencaoSelecionada!.id);
          if (index !== -1) {
            this.manutencoes[index] = this.mapearManutencaoIndividual(manutencaoAtualizada);
            this.dataSource.data = [...this.manutencoes];
          }
     this.mostrarSucesso(manutencaoAtualizada);
          this.cancelarEdicao();
          this.carregando = false;
        },
        error: (error) => {
          console.error('Erro ao atualizar manutenção:', error);
          this.mostrarErro('Erro ao atualizar manutenção: ' + error.message);
          this.carregando = false;
        }
      });
    } else {
      // Criar nova manutenção
      this.manutencaoService.create(manutencaoDTO).subscribe({
        next: (novaManutencao) => {
          this.manutencoes.push(this.mapearManutencaoIndividual(novaManutencao));
          this.dataSource.data = [...this.manutencoes];
          this.mostrarSucesso('Manutenção registrada com sucesso!');
          this.cancelarEdicao();
          this.carregando = false;
        },
        error: (error) => {
          console.error('Erro ao criar manutenção:', error);
          this.mostrarErro('Erro ao criar manutenção: ' + error.message);
          this.carregando = false;
        }
      });
    }
  }

  private mapearManutencaoIndividual(manutencao: any): Manutencao {
    return {
      id: manutencao.id,
      dataManutencao: manutencao.dataManutencao ? new Date(manutencao.dataManutencao) : undefined,
      tipoManutencao: manutencao.tipoManutencao,
      descricao: manutencao.descricao,
      custo: manutencao.custo,
      kilometragemVeiculo: manutencao.kilometragemVeiculo,
      proximaManutencaoKm: manutencao.proximaManutencaoKm,
      proximaManutencaoData: manutencao.proximaManutencaoData ? new Date(manutencao.proximaManutencaoData) : undefined,
      veiculo: manutencao.veiculo
    };
  }

  cancelarEdicao(): void {
    this.manutencaoForm.reset();
    this.editando = false;
    this.manutencaoSelecionada = null;
    this.mostrarFormulario = false;
  }

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
            this.manutencoes = this.manutencoes.filter(m => m.id !== manutencao.id);
            this.dataSource.data = this.manutencoes;
            this.mostrarSucesso(mensagem || 'Manutenção excluída com sucesso!');
            this.carregando = false;
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
    const status = this.verificarStatusManutencao(manutencao);
    const statusText = status === 'VENCIDA' ? 'Vencida' :
                      status === 'PROXIMA' ? 'Próxima' : 'OK';

    Swal.fire({
      title: `Detalhes da Manutenção`,
      html: `
        <div style="text-align: left; font-size: 14px;">
          <p><strong>Veículo:</strong> ${manutencao.veiculo?.marca || ''} ${manutencao.veiculo?.modelo || ''} (${manutencao.veiculo?.matricula || 'N/A'})</p>
          <p><strong>Tipo:</strong> ${this.getTipoManutencaoLabel(manutencao.tipoManutencao)}</p>
          <p><strong>Data:</strong> ${manutencao.dataManutencao ? new Date(manutencao.dataManutencao).toLocaleDateString('pt-BR') : 'Não informada'}</p>
          <p><strong>Quilometragem:</strong> ${(manutencao.kilometragemVeiculo || 0).toLocaleString('pt-BR')} km</p>
          <p><strong>Custo:</strong> R$ ${(manutencao.custo || 0).toFixed(2)}</p>
          <p><strong>Descrição:</strong> ${manutencao.descricao || 'Não informada'}</p>
          <p><strong>Próxima manutenção (km):</strong> ${manutencao.proximaManutencaoKm ? manutencao.proximaManutencaoKm.toLocaleString('pt-BR') + ' km' : 'Não definido'}</p>
          <p><strong>Próxima manutenção (data):</strong> ${manutencao.proximaManutencaoData ? new Date(manutencao.proximaManutencaoData).toLocaleDateString('pt-BR') : 'Não definida'}</p>
          <p><strong>Status:</strong> <span style="color: ${this.getStatusColor(status)}">${statusText}</span></p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Fechar',
      width: '600px'
    });
  }

  verManutencoesVencidas(): void {
    this.carregando = true;
    this.manutencaoService.getVencidas().subscribe({
      next: (vencidas) => {
        this.dataSource.data = this.mapearManutencoes(vencidas);

        this.filtroStatus = 'VENCIDA';
        this.carregando = false;
        this.mostrarSucesso(`${vencidas.length} manutenção(ões) vencida(s) encontrada(s)`);
      },
      error: (error) => {
        console.error('Erro ao carregar manutenções vencidas:', error);
        this.mostrarErro('Erro ao carregar manutenções vencidas');
        this.carregando = false;
      }
    });
  }

  verManutencoesProximas(): void {
    this.carregando = true;
    this.manutencaoService.getProximas().subscribe({
      next: (proximas) => {
        this.dataSource.data = this.mapearManutencoes(proximas);
        this.filtroStatus = 'PROXIMA';
        this.carregando = false;
        this.mostrarSucesso(`${proximas.length} manutenção(ões) próxima(s) encontrada(s)`);
      },
      error: (error) => {
        console.error('Erro ao carregar manutenções próximas:', error);
        this.mostrarErro('Erro ao carregar manutenções próximas');
        this.carregando = false;
      }
    });
  }

  calcularProximaManutencao(): void {
    const formValue = this.manutencaoForm.value;
    if (formValue.tipoManutencao && formValue.kilometragemVeiculo) {
      const veiculo = this.veiculos.find(v => v.id === formValue.veiculo_id);
      if (veiculo) {
        // Cálculo simples baseado no tipo de manutenção
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
            // Para manutenções corretivas, não calcula automaticamente
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
  // calculos
  // Adicione estes métodos na classe ManutencoesListComponent



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
    this.mostrarSucesso('Funcionalidade PDF em desenvolvimento');
  }

  exportarExcel(): void {
    this.mostrarSucesso('Funcionalidade Excel em desenvolvimento');
  }

  exportarCSV(): void {
    this.mostrarSucesso('Funcionalidade CSV em desenvolvimento');
  }

  private mostrarSucesso(mensagem: string): void {
    this.snackBar.open(mensagem, 'Fechar', {
      duration: 3000,
      panelClass: ['snackbar-success']
    });
  }

  private mostrarErro(mensagem: string): void {
    this.snackBar.open(mensagem, 'Fechar', {
      duration: 3000,
      panelClass: ['snackbar-error']
    });
  }

  // Métodos auxiliares para a view
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

  //
  // Método para obter o texto do status
getStatusText(status: string): string {
  switch(status) {
    case 'VENCIDA': return 'Vencida';
    case 'PROXIMA': return 'Próxima';
    case 'URGENTE': return 'Urgente';
    case 'OK': return 'OK';
    default: return status;
  }
}


getTiposDistribuicao(): any[] {
  if (!this.manutencoes || this.manutencoes.length === 0) return [];

  const tipos = this.tiposManutencao.map(tipo => ({
    key: tipo,
    label: this.getTipoManutencaoLabel(tipo),
    count: 0,
    percentual: 0
  }));

  // Contar ocorrências
  this.manutencoes.forEach(m => {
    const tipo = tipos.find(t => t.key === m.tipoManutencao);
    if (tipo) tipo.count++;
  });

  // Calcular percentuais
  tipos.forEach(tipo => {
    tipo.percentual = Math.round((tipo.count / this.manutencoes.length) * 100);
  });

  return tipos.filter(t => t.count > 0);
}

//
// Métodos para o resumo
getTotalCount(): number {
  return this.manutencoes?.length || 0;
}

getTotalCusto(): number {
  if (!this.manutencoes || this.manutencoes.length === 0) return 0;
  return this.manutencoes.reduce((sum, m) => sum + (m.custo || 0), 0);
}

getVencidasCount(): number {
  if (!this.manutencoes) return 0;
  return this.manutencoes.filter(m => this.verificarStatusManutencao(m) === 'VENCIDA').length;
}

getProximasCount(): number {
  if (!this.manutencoes) return 0;
  return this.manutencoes.filter(m => {
    const status = this.verificarStatusManutencao(m);
    return status === 'PROXIMA' || status === 'URGENTE';
  }).length;
}

getCustoMedio(): number {
  if (!this.manutencoes || this.manutencoes.length === 0) return 0;
  return this.getTotalCusto() / this.manutencoes.length;
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
  if (!this.manutencoes || this.manutencoes.length === 0) return 0;
  const okCount = this.manutencoes.filter(m => this.verificarStatusManutencao(m) === 'OK').length;
  return Math.round((okCount / this.manutencoes.length) * 100);
}



}

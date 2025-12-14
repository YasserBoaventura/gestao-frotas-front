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


  TipoManutencao,
  ManutencaoDTO
} from  '../manutencoes-service.service';
import { ManutencoesServiceService } from '../manutencoes-service.service';
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
        this.manutencoes = manutencoes;
        this.dataSource.data = manutencoes;
        this.carregando = false;
      },
      error: (error) => {
        console.error('Erro ao carregar manutenções:', error);
        this.mostrarErro('Erro ao carregar manutenções');
        this.carregando = false;

        // Fallback para dados mock se o backend estiver indisponível

      }
    });

    // Carregar veículos
    this.manutencaoService.getVeiculos().subscribe({
      next: (veiculos) => {
        this.veiculos = veiculos;
      },
      error: (error) => {
        console.error('Erro ao carregar veículos:', error);
        // Fallback para dados mock

      }
    });
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

  // Métodos de fallback para desenvolvimento




  aplicarFiltros(): void {
    let dadosFiltrados = this.manutencoes;

    if (this.filtroVeiculo) {
      dadosFiltrados = dadosFiltrados.filter(m =>
        m.veiculo?.matricula?.toLowerCase().includes(this.filtroVeiculo.toLowerCase()) ||
        m.veiculo?.modelo?.toLowerCase().includes(this.filtroVeiculo.toLowerCase())
      );
    }

    if (this.filtroTipo) {
      dadosFiltrados = dadosFiltrados.filter(m => m.tipoManutencao === this.filtroTipo);
    }

    if (this.filtroStatus) {
      dadosFiltrados = dadosFiltrados.filter(m => this.verificarStatusManutencao(m) === this.filtroStatus);
    }

    if (this.filtroDataInicio) {
      dadosFiltrados = dadosFiltrados.filter(m =>
        new Date(m.dataManutencao!) >= this.filtroDataInicio!
      );
    }

    if (this.filtroDataFim) {
      dadosFiltrados = dadosFiltrados.filter(m =>
        new Date(m.dataManutencao!) <= this.filtroDataFim!
      );
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
    return this.manutencaoService.verificarStatusManutencao(manutencao);
  }

  getStatusColor(status: string): string {
    return this.manutencaoService.getStatusColor(status);
  }

  getTipoManutencaoLabel(tipo: TipoManutencao): string {
    return this.manutencaoService.getTipoManutencaoLabel(tipo);
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
      dataManutencao: new Date(manutencao.dataManutencao!),
      descricao: manutencao.descricao,
      custo: manutencao.custo,
      kilometragemVeiculo: manutencao.kilometragemVeiculo,
      proximaManutencaoKm: manutencao.proximaManutencaoKm,
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

    // Validação
    const validacao = this.manutencaoService.validarManutencaoDTO(manutencaoDTO);
    if (!validacao.valido) {
      this.mostrarErro(validacao.erros.join(', '));
      return;
    }

    this.carregando = true;

    if (this.editando && this.manutencaoSelecionada) {
      // Atualizar manutenção existente
      this.manutencaoService.update(this.manutencaoSelecionada.id!, manutencaoDTO).subscribe({
        next: (manutencaoAtualizada) => {
          const index = this.manutencoes.findIndex(m => m.id === this.manutencaoSelecionada!.id);
          if (index !== -1) {
            this.manutencoes[index] = manutencaoAtualizada;
            this.dataSource.data = [...this.manutencoes];
          }
          this.mostrarSucesso('Manutenção atualizada com sucesso!');
          this.cancelarEdicao();
          this.carregando = false;
        },
        error: (error) => {
          console.error('Erro ao atualizar manutenção:', error);
          this.mostrarErro('Erro ao atualizar manutenção');
          this.carregando = false;
        }
      });
    } else {
      // Criar nova manutenção
      this.manutencaoService.create(manutencaoDTO).subscribe({
        next: (novaManutencao) => {
          this.manutencoes.push(novaManutencao);
          this.dataSource.data = [...this.manutencoes];
          this.mostrarSucesso('Manutenção registrada com sucesso!');
          this.cancelarEdicao();
          this.carregando = false;
        },
        error: (error) => {
          console.error('Erro ao criar manutenção:', error);
          this.mostrarErro('Erro ao criar manutenção');
          this.carregando = false;
        }
      });
    }
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
      if (result.isConfirmed) {
        this.carregando = true;
        this.manutencaoService.delete(manutencao.id!).subscribe({
          next: (mensagem) => {
            this.manutencoes = this.manutencoes.filter(m => m.id !== manutencao.id);
            this.dataSource.data = this.manutencoes;
            this.mostrarSucesso(mensagem || 'Manutenção excluída com sucesso!');
            this.carregando = false;
          },
          error: (error) => {
            console.error('Erro ao excluir manutenção:', error);
            this.mostrarErro('Erro ao excluir manutenção');
            this.carregando = false;
          }
        });
      }
    });
  }

  verDetalhes(manutencao: Manutencao): void {
    const status = this.verificarStatusManutencao(manutencao);
    const statusText = status === 'VENCIDA' ? 'Vencida' :
                      status === 'PROXIMA' ? 'Próxima' :
                      status === 'URGENTE' ? 'Urgente' : 'OK';

    Swal.fire({
      title: `Detalhes da Manutenção`,
      html: `
        <div style="text-align: left; font-size: 14px;">
          <p><strong>Veículo:</strong> ${manutencao.veiculo?.marca || ''} ${manutencao.veiculo?.modelo || ''} (${manutencao.veiculo?.matricula || 'N/A'})</p>
          <p><strong>Tipo:</strong> ${this.getTipoManutencaoLabel(manutencao.tipoManutencao!)}</p>
          <p><strong>Data:</strong> ${new Date(manutencao.dataManutencao!).toLocaleDateString('pt-BR')}</p>
          <p><strong>Quilometragem:</strong> ${manutencao.kilometragemVeiculo!.toLocaleString('pt-BR')} km</p>
          <p><strong>Custo:</strong> ${this.manutencaoService.formatarMoeda(manutencao.custo!)}</p>
          <p><strong>Descrição:</strong> ${manutencao.descricao}</p>
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
        this.dataSource.data = vencidas;
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
        this.dataSource.data = proximas;
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
        const resultado = this.manutencaoService.calcularProximaManutencao(
          formValue.tipoManutencao,
          new Date(formValue.dataManutencao),
          formValue.kilometragemVeiculo
        );

        if (resultado.proximaKm || resultado.proximaData) {
          this.manutencaoForm.patchValue({
            proximaManutencaoKm: resultado.proximaKm,
            proximaManutencaoData: resultado.proximaData
          });
          this.mostrarSucesso('Próxima manutenção calculada automaticamente!');
        }
      }
    }
  }

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
    this.carregando = true;

  }

  exportarExcel(): void {
    this.carregando = true;

  }

  exportarCSV(): void {
    this.mostrarSucesso('Funcionalidade CSV em desenvolvimento');
  }

  private downloadFile(blob: Blob, filename: string, contentType: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
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
  formatarData(data: Date): string {
    return this.manutencaoService.formatarData(data);
  }

  formatarMoeda(valor: number): string {
    return this.manutencaoService.formatarMoeda(valor);
  }
}

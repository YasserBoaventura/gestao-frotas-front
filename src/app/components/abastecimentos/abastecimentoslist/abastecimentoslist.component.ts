import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Abastecimento } from '../abastecimento';
import { AbstecimeserviceService as AbastecimentoService } from '../abstecimeservice.service';
import { Veiculo } from '../../Veiculos/veiculos.model';
import { Viagem } from '../../viagens/viagem';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SelectionModel } from '@angular/cdk/collections';
import { VeiculosService } from '../../Veiculos/veiculos.service';
import { ViagensServiceService } from '../../viagens/viagens-service.service';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import Swal from 'sweetalert2';
import { forkJoin, map } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
import { LoginService } from '../../auth/login.service';
import { RelatorioCombustivelDTO } from '../../relatorioCombustivel/relatorio-combustivel-dto';
import { RelatorioCombustivelService } from '../../relatorioCombustivel/relatorio-combustivel.service';

@Component({
  selector: 'app-abastecimento-list',
  templateUrl: './abastecimentoslist.component.html',
  styleUrls: ['./abastecimentoslist.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    RouterModule
  ]
})
export class AbastecimentoListComponent implements OnInit {

  router = inject(Router);

  //login Service
  loginService = inject(LoginService);

  // Forms
  abastecimentoForm!: FormGroup;

  // Dados
  abastecimentos: Abastecimento[] = [];
  filteredAbastecimentos: Abastecimento[] = [];
  veiculos: Veiculo[] = [];
  viagens: Viagem[] = [];
  viagensDoVeiculo: Viagem[] = [];

  // Estados
  editando = false;
  carregando = false;
  carregandoModal = false;
  mostrarModal = false;
  mostrarModalExclusao = false;
  valorCalculado = 0;
  debugMode = true;

  // Filtros
  filtroVeiculo = '';
  filtroTipoCombustivel = '';
  filtroStatus = '';
  filtroDataInicio = '';
  filtroDataFim = '';

  // Paginação
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25, 50];

  // Seleção
  selection = new SelectionModel<Abastecimento>(true, []);

  // Estatísticas
  estatisticas = {
    totalGasto: 0,
    totalLitros: 0,
    mediaPreco: 0,
    consumoMedio: 0
  };

  // Abastecimento selecionado
  abastecimentoSelecionado: Abastecimento | null = null;


  // Variáveis do Relatório
  abaAtiva: string = 'lista';
  relatorios: RelatorioCombustivelDTO[] = [];
  relatoriosFiltrados: RelatorioCombustivelDTO[] = [];
  dataInicio: string = '';
  dataFim: string = '';
  filtroAtivo: string = 'veiculo';
  veiculoSelecionado: string = '';
  veiculosRelatorio: string[] = [];
  erroRelatorio: string = '';
  hoje = new Date();

  // Variáveis para totais do relatório
  totalGeralLitros: number = 0;
  totalGeralGasto: number = 0;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private abastecimentoService: AbastecimentoService,
    private veiculoService: VeiculosService,
    private viagemService: ViagensServiceService,
    private relatorioService: RelatorioCombustivelService
  ) {}

  ngOnInit(): void {
    this.inicializarForm();
    this.carregarDados();
  }

  inicializarForm(): void {
    const dataAtual = new Date();
    const dataFormatada = this.formatarDataParaInput(dataAtual);

    this.abastecimentoForm = this.fb.group({
      id: [null],
      veiculoId: [null, Validators.required],
      viagemId: [null],
      dataAbastecimento: [ Validators.required],
      statusAbastecimento: ['REALIZADA', Validators.required],
      tipoCombustivel: ['GASOLINA', Validators.required],
      kilometragemVeiculo: [null, [Validators.required, Validators.min(0)]],
      quantidadeLitros: [null, [Validators.required, Validators.min(0)]],
      precoPorLitro: [null, [Validators.required, Validators.min(0)]]
    });

    // Observar mudanças para calcular valor total
    this.abastecimentoForm.get('quantidadeLitros')?.valueChanges.subscribe(() => {
      this.calcularValorTotal();
    });

    this.abastecimentoForm.get('precoPorLitro')?.valueChanges.subscribe(() => {
      this.calcularValorTotal();
    });
  }

  formatarDataParaInput(date: Date): string {
    const pad = (n: number) => n < 10 ? '0' + n : n.toString();
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  carregarDados(): void {
    this.carregando = true;

    forkJoin({
      veiculos: this.veiculoService.getVehicles(),
      abastecimentos: this.abastecimentoService.getAbastecimentos(),
      viagens: this.viagemService.getViagens()
    }).subscribe({
      next: ({ veiculos, abastecimentos, viagens }) => {
        console.log('Dados carregados:', { veiculos, abastecimentos, viagens });

        this.veiculos = veiculos;
        this.viagens = viagens;

        // Processar abastecimentos para garantir que temos o veiculoId
        this.abastecimentos = abastecimentos.map(abastecimento => {
          let veiculoId = 0;
          if (abastecimento.veiculoId) {
            veiculoId = abastecimento.veiculoId;
          } else if (abastecimento.veiculo && abastecimento.veiculo.id) {
            veiculoId = abastecimento.veiculo.id;
          } else if (abastecimento.veiculo && typeof abastecimento.veiculo === 'object') {
            const veiculoObj = abastecimento.veiculo as any;
            veiculoId = veiculoObj.id || 0;
          }

          const veiculoCompleto = this.veiculos.find(v => v.id === veiculoId);

          let viagemId = null;
          if (abastecimento.viagemId) {
            viagemId = abastecimento.viagemId;
          } else if (abastecimento.viagem && abastecimento.viagem.id) {
            viagemId = abastecimento.viagem.id;
          }

          const viagemCompleta = viagemId ? this.viagens.find(v => v.id === viagemId) : null;

          return {
            ...abastecimento,
            veiculoId: veiculoId,
            viagemId: viagemId,
            statusAbastecimento: abastecimento.statusAbastecimento || 'PLANEADA',
            veiculo: veiculoCompleto || {
              id: veiculoId,
              matricula: `VCL-${veiculoId}`,
              modelo: 'Veículo não encontrado',
              kilometragemAtual: 0
            },
            viagem: viagemCompleta
          };
        });

        console.log('Abastecimentos processados:', this.abastecimentos);

        this.filteredAbastecimentos = [...this.abastecimentos];
        this.calcularEstatisticas();
        this.carregando = false;
      },
      error: (error) => {
        console.error('Erro ao carregar dados:', error);
        this.mostrarErro('Erro ao carregar dados: ' + error.message);
        this.carregando = false;
      }
    });
  }

  onVeiculoChange(veiculoId: number | null): void {
    console.log('Veículo selecionado ID:', veiculoId);

    if (veiculoId) {
      this.abastecimentoService.getViagensPorVeiculo(veiculoId).subscribe({
        next: (viagens) => {
          console.log('Viagens retornadas da API:', viagens);
          this.viagensDoVeiculo = viagens;

          viagens.forEach(viagem => {
            if (!this.viagens.find(v => v.id === viagem.id)) {
              this.viagens.push(viagem);
            }
          });
        },
        error: (error) => {
          console.error('Erro ao buscar viagens do veículo:', error);
          this.viagensDoVeiculo = [];
          this.viagensDoVeiculo = this.viagens.filter(viagem => {
            const viagemVeiculoId = viagem.veiculo?.id || viagem.veiculo;
            return viagemVeiculoId === veiculoId;
          });
          console.log('Viagens do cache após erro:', this.viagensDoVeiculo);
        }
      });
    } else {
      this.viagensDoVeiculo = [];
      console.log('Nenhum veículo selecionado, limpando lista de viagens');
    }
  }

  calcularValorTotal(): void {
    const quantidade = this.abastecimentoForm.get('quantidadeLitros')?.value || 0;
    const preco = this.abastecimentoForm.get('precoPorLitro')?.value || 0;
    this.valorCalculado = quantidade * preco;
  }

  novoAbastecimento(): void {
    if (this.veiculos.length === 0) {
      this.mostrarErro('Não há veículos disponíveis. Cadastre um veículo primeiro.');
      return;
    }

    this.editando = false;
    this.mostrarModal = true;

    const dataAtual = new Date();
    this.abastecimentoForm.reset({
      dataAbastecimento: this.formatarDataParaInput(dataAtual),
      statusAbastecimento: 'REALIZADA',
      tipoCombustivel: 'GASOLINA',
      kilometragemVeiculo: null,
      quantidadeLitros: null,
      precoPorLitro: null,
      veiculoId: null,
      viagemId: null
    });

    this.viagensDoVeiculo = [];
    this.valorCalculado = 0;
  }

  editarAbastecimento(abastecimento: Abastecimento): void {
    console.log('Dados do abastecimento:', abastecimento);

    if (this.veiculos.length === 0) {
      this.mostrarErro('Não há veículos disponíveis.');
      return;
    }

    this.editando = true;
    this.mostrarModal = true;

    let veiculoId = 0;
    if (abastecimento.veiculo_Id) {
      veiculoId = abastecimento.veiculo_Id;
    } else if (abastecimento.veiculo && abastecimento.veiculo.id) {
      veiculoId = abastecimento.veiculo.id;
    } else if (abastecimento.veiculo && typeof abastecimento.veiculo === 'object') {
      const veiculoObj = abastecimento.veiculo as any;
      veiculoId = veiculoObj.id || 0;
    }

    let viagemId = null;
    if (abastecimento.viagemId) {
      viagemId = abastecimento.viagemId;
    } else if (abastecimento.viagem && abastecimento.viagem.id) {
      viagemId = abastecimento.viagem.id;
    }

    this.abastecimentoForm.reset();
    this.viagensDoVeiculo = [];

    if (veiculoId) {
      this.onVeiculoChange(veiculoId);
    }

    setTimeout(() => {
      const dataFormatada = this.formatarDataParaInput(new Date(abastecimento.dataAbastecimento!));

      this.abastecimentoForm.patchValue({
        id: abastecimento.id,
        veiculoId: veiculoId || null,
        viagemId: viagemId || null,
        dataAbastecimento: dataFormatada,
        statusAbastecimento: abastecimento.statusAbastecimento || 'PLANEADA',
        tipoCombustivel: abastecimento.tipoCombustivel,
        kilometragemVeiculo: abastecimento.kilometragemVeiculo,
        quantidadeLitros: abastecimento.quantidadeLitros,
        precoPorLitro: abastecimento.precoPorLitro
      });

      this.calcularValorTotal();
    }, 500);
  }

  salvarAbastecimento(): void {
    Object.keys(this.abastecimentoForm.controls).forEach(key => {
      const control = this.abastecimentoForm.get(key);
      control?.markAsTouched();
    });

    if (this.abastecimentoForm.invalid) {
      this.mostrarErro('Preencha todos os campos obrigatórios corretamente');
      return;
    }

    this.carregandoModal = true;
    const formValue = this.abastecimentoForm.value;

    const dataLocal = new Date(formValue.dataAbastecimento);
    const dataISO = dataLocal.toISOString();

    const abastecimentoParaEnviar: any = {
      veiculoId: formValue.veiculoId,
      viagemId: formValue.viagemId || null,
      dataAbastecimento: dataISO,
      tipoCombustivel: formValue.tipoCombustivel,
      statusAbastecimento: formValue.statusAbastecimento || 'REALIZADA',
      kilometragemVeiculo: formValue.kilometragemVeiculo,
      quantidadeLitros: formValue.quantidadeLitros,
      precoPorLitro: formValue.precoPorLitro
    };

    if (this.editando && formValue.id) {
      abastecimentoParaEnviar.id = formValue.id;
    }

    console.log('Salvando abastecimento:', abastecimentoParaEnviar);

    const observavel = this.editando && formValue.id
      ? this.abastecimentoService.updateAbastecimento(formValue.id, abastecimentoParaEnviar)
      : this.abastecimentoService.createAbastecimento(abastecimentoParaEnviar);

    observavel.subscribe({
      next: (response) => {
        console.log('Resposta do servidor:', response);
        this.mostrarSucesso(
          this.editando
            ? 'Abastecimento atualizado com sucesso!'
            : 'Abastecimento registrado com sucesso!'
        );
        this.carregarDados();
        this.fecharModal();
      },
      error: (error) => {
        console.error('Erro ao salvar abastecimento:', error);
        let mensagemErro = `Erro ao ${this.editando ? 'atualizar' : 'criar'} abastecimento`;

        if (error.error && error.error.message) {
          mensagemErro += `: ${error.error.message}`;
        } else if (error.message) {
          mensagemErro += `: ${error.message}`;
        }

        this.mostrarErro(mensagemErro);
        this.carregandoModal = false;
      },
      complete: () => {
        this.carregandoModal = false;
      }
    });
  }

  confirmarExclusaoModal(abastecimento: Abastecimento): void {
    this.abastecimentoSelecionado = abastecimento;
    this.mostrarModalExclusao = true;
  }

  confirmarExclusao(): void {
    if (!this.abastecimentoSelecionado) return;

    Swal.fire({
      title: 'Excluir Abastecimento',
      text: `Tem certeza que deseja excluir o abastecimento de ${this.formatarDataHora(this.abastecimentoSelecionado.dataAbastecimento!)}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed && this.abastecimentoSelecionado?.id) {
        this.carregando = true;
        this.abastecimentoService.deleteAbastecimento(this.abastecimentoSelecionado.id).subscribe({
          next: () => {
            Swal.fire('Sucesso', 'Abastecimento excluído com sucesso!', 'success');
            this.carregarDados();
            this.fecharModal();
          },
          error: (error) => {
            Swal.fire('Erro', `Erro ao excluir abastecimento: ${error.message || 'Erro desconhecido'}`, 'error');
            this.carregando = false;
          },
          complete: () => {
            this.carregando = false;
          }
        });
      }
    });
  }

  fecharModal(): void {
    this.mostrarModal = false;
    this.mostrarModalExclusao = false;
    this.editando = false;
    this.abastecimentoSelecionado = null;
    this.abastecimentoForm.reset();
    this.viagensDoVeiculo = [];
    this.valorCalculado = 0;
    this.carregandoModal = false;
  }

  aplicarFiltros(): void {
    this.filteredAbastecimentos = this.abastecimentos.filter(abastecimento => {
      if (this.filtroVeiculo) {
        const veiculoInfo = this.getVeiculoInfo(abastecimento.veiculo_Id!).toLowerCase();
        if (!veiculoInfo.includes(this.filtroVeiculo.toLowerCase())) {
          return false;
        }
      }

      if (this.filtroTipoCombustivel && abastecimento.tipoCombustivel !== this.filtroTipoCombustivel) {
        return false;
      }

      if (this.filtroStatus && abastecimento.statusAbastecimento !== this.filtroStatus) {
        return false;
      }

      const dataAbastecimento = new Date(abastecimento.dataAbastecimento!);

      if (this.filtroDataInicio) {
        const dataInicio = new Date(this.filtroDataInicio);
        dataInicio.setHours(0, 0, 0, 0);
        if (dataAbastecimento < dataInicio) {
          return false;
        }
      }

      if (this.filtroDataFim) {
        const dataFim = new Date(this.filtroDataFim);
        dataFim.setHours(23, 59, 59, 999);
        if (dataAbastecimento > dataFim) {
          return false;
        }
      }

      return true;
    });

    this.pageIndex = 0;
    this.calcularEstatisticas();
    this.selection.clear();
  }

  limparFiltros(): void {
    this.filtroVeiculo = '';
    this.filtroTipoCombustivel = '';
    this.filtroStatus = '';
    this.filtroDataInicio = '';
    this.filtroDataFim = '';
    this.aplicarFiltros();
  }

  calcularEstatisticas(): void {
    const dados = this.filteredAbastecimentos;

    if (dados.length === 0) {
      this.estatisticas = { totalGasto: 0, totalLitros: 0, mediaPreco: 0, consumoMedio: 0 };
      return;
    }

    const totalGasto = dados.reduce((sum, item) => sum + (item.quantidadeLitros * item.precoPorLitro), 0);
    const totalLitros = dados.reduce((sum, item) => sum + item.quantidadeLitros, 0);
    const mediaPreco = totalLitros > 0 ? totalGasto / totalLitros : 0;

    this.estatisticas = {
      totalGasto,
      totalLitros,
      mediaPreco,
      consumoMedio: 0
    };
  }

  getTotalAbastecimentos(): number {
    return this.filteredAbastecimentos.length;
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  getVeiculoInfo(veiculoId: any): string {
    if (!veiculoId || veiculoId === 0) {
      return 'Não informado';
    }

    const veiculo = this.veiculos.find(v => v.id === veiculoId);
    if (veiculo) {
      return `${veiculo.matricula} - ${veiculo.modelo}`;
    }

    const abastecimento = this.abastecimentos.find(a => a.veiculo_Id === veiculoId);
    if (abastecimento && abastecimento.veiculo) {
      const veiculoObj = abastecimento.veiculo as any;
      if (veiculoObj.matricula && veiculoObj.modelo) {
        return `${veiculoObj.matricula} - ${veiculoObj.modelo}`;
      }
    }

    return `Veículo #${veiculoId} (não encontrado)`;
  }


  getTipoCombustivelLabel(tipo: string): string {
    const tipos: { [key: string]: string } = {
      'GASOLINA': 'Gasolina',
      'DIESEL': 'Diesel',
      'ETANOL': 'Etanol',
      'GNV': 'GNV',
      'ELETRICO': 'Elétrico'
    };
    return tipos[tipo] || tipo;
  }

   getViagemInfo(viagemId: any ): string {
    console.log('Buscando info do viagen ID:', viagemId);
    console.log('Viagem disponíveis:', this.viagens);

    if (!viagemId || viagemId === 0) {
      return 'Não informado';
    }

    const viagem = this.viagens.find(v => v.id === viagemId);
    console.log('Viagem encontrado:', viagem );

    if (viagem) {
      return `${viagem.rota?.origem} - ${viagem.rota?.destino}`;
    }

    // Tentar encontrar em abastecimentos
    const abastecimento = this.abastecimentos.find(a => a.veiculo_Id === viagemId);
    if (abastecimento && abastecimento.veiculo) {
      const veiculoObj = abastecimento.veiculo as any;
      if (veiculoObj.matriculo && veiculoObj.modelo) {
        return `${veiculoObj.matricula} - ${veiculoObj.modelo}`;
      }
    }

    return `Viagem #${viagemId} (não encontrado)`;
  }
 getTipoCombustivelColor(tipo: string): {bg: string, text: string} {
  const cores : any = {
    'GASOLINA': { bg: '#e7f1ff', text: '#3d8bfd' },
    'DIESEL': { bg: '#e8f5e9', text: '#2e7d32' },
    'ETANOL': { bg: '#fff3e0', text: '#ed6c02' },
    'GNV': { bg: '#f3e5f5', text: '#7b1fa2' },
    'ELETRICO': { bg: '#e0f2f1', text: '#00796b' }
  };
  return cores[tipo] || { bg: '#f5f5f5', text: '#616161' };
}


getStatusColor(status: string): {bg: string, text: string} {
  const cores : any = {
    'REALIZADA': { bg: '#e8f5e9', text: '#2e7d32' },
    'PLANEADA': { bg: '#fff3e0', text: '#ed6c02' }
  };
  return cores[status] || { bg: '#f5f5f5', text: '#616161' };
}

getTipoCombustivelIcon(tipo: string): string {
  const icons : any = {
    'GASOLINA': '⛽',
    'DIESEL': '🛢️',
    'ETANOL': '🌽',
    'GNV': '🔥',
    'ELETRICO': '⚡'
  };
  return icons[tipo] || '⛽';
}


getStatusIcon(status: string): string {
  const icons : any = {
    'REALIZADA': '✅',
    'PLANEADA': '📅'
  };
  return icons[status] || '•';
}
  // Formatação

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'MZN'
    }).format(valor || 0);
  }

  formatarDataHora(dataString: string | Date): string {
    try {
      const data = new Date(dataString);
      if (isNaN(data.getTime())) {
        return 'Data inválida';
      }
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Data inválida';
    }
  }

  mostrarSucesso(mensagem: string): void {
    this.snackBar.open(mensagem, 'Fechar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  mostrarErro(mensagem: string): void {
    this.snackBar.open(mensagem, 'Fechar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  navegateTO(path: string): void {
    this.router.navigate([path]);
  }

  // ==================== MÉTODOS DO RELATÓRIO DE COMBUSTÍVEL ====================

  carregarRelatorioPorVeiculo(): void {
    this.carregando = true;
    this.erroRelatorio = '';
    this.filtroAtivo = 'veiculo';

    console.log('Buscando relatório por veículo...');

    this.relatorioService.getRelatorioPorVeiculo().subscribe({
      next: (data) => {
        console.log('Dados recebidos:', data);
        this.relatorios = data;
        this.relatoriosFiltrados = [...data];
        this.extrairVeiculosRelatorio();
        this.calcularTotaisRelatorio();
        this.carregando = false;
      },
      error: (error) => {
        console.error('Erro ao carregar relatório por veículo:', error);
        this.erroRelatorio = 'Erro ao carregar relatório. Tente novamente.';
        this.carregando = false;
      },
      complete: () => {
        console.log('Requisição por veículo concluída');
      }
    });
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

    console.log('Buscando relatório por período:', {
      inicio: this.dataInicio,
      fim: this.dataFim
    });

    this.relatorioService.getRelatorioPorPeriodo(new Date(this.dataInicio), new Date(this.dataFim)).subscribe({
      next: (data) => {
        console.log('Dados recebidos por período:', data);
        this.relatorios = data;
        this.relatoriosFiltrados = [...data];
        this.extrairVeiculosRelatorio();
        this.calcularTotaisRelatorio();
        this.carregando = false;
      },
      error: (error) => {
        console.error('Erro detalhado:', error);
        this.erroRelatorio = 'Erro ao carregar relatório. Verifique as datas e tente novamente.';
        this.carregando = false;
      },
      complete: () => {
        console.log('Requisição por período concluída');
      }
    });
  }

  extrairVeiculosRelatorio(): void {
    const veiculosUnicos = new Set<string>();
    this.relatorios.forEach(relatorio => {
      if (relatorio.matricula) {
        veiculosUnicos.add(relatorio.matricula);
      }
    });
    this.veiculosRelatorio = Array.from(veiculosUnicos).sort();
  }

  aplicarFiltroVeiculo(): void {
    if (this.veiculoSelecionado) {
      this.relatoriosFiltrados = this.relatorios.filter(relatorio =>
        relatorio.matricula === this.veiculoSelecionado
      );
    } else {
      this.relatoriosFiltrados = [...this.relatorios];
    }
    this.calcularTotaisRelatorio();
  }

  limparFiltroVeiculo(): void {
    this.veiculoSelecionado = '';
    this.relatoriosFiltrados = [...this.relatorios];
    this.calcularTotaisRelatorio();
  }

  calcularTotaisRelatorio(): void {
    this.totalGeralLitros = this.relatoriosFiltrados.reduce((total, relatorio) =>
      total + (relatorio.totalLitros || 0), 0);

    this.totalGeralGasto = this.relatoriosFiltrados.reduce((total, relatorio) =>
      total + (relatorio.valorTotal || 0), 0);
  }

  limparFiltrosRelatorio(): void {
    this.dataInicio = '';
    this.dataFim = '';
    this.veiculoSelecionado = '';
    this.erroRelatorio = '';
    this.relatoriosFiltrados = [...this.relatorios];
    this.calcularTotaisRelatorio();
  }

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

  get hojeString(): string {
    return this.formatarDataParaInputRelatorio(this.hoje);
  }

  formatarDataParaInputRelatorio(data: Date | null): string {
    if (!data) return '';
    const year = data.getFullYear();
    const month = (data.getMonth() + 1).toString().padStart(2, '0');
    const day = data.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

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
      'Total Litros Formatado': item.getTotalLitrosFormatado ? item.getTotalLitrosFormatado() : '',
      'Total Gasto Formatado': item.getTotalGastoFormatado ? item.getTotalGastoFormatado() : '',
      'Média por Litro Formatado': item.getMediaPorLitroFormatado ? item.getMediaPorLitroFormatado() : ''
    }));

    console.log('Exportando para Excel:', data);
    alert('Funcionalidade de exportação para Excel em desenvolvimento');
  }

  exportarParaPDF(): void {
    if (this.relatoriosFiltrados.length === 0) return;

    console.log('Exportando para PDF');
    alert('Funcionalidade de exportação para PDF em desenvolvimento');
  }

  temTendenciaPositiva(): boolean {
    return true;
  }

  getVeiculosUnicos(): number {
    const veiculos = new Set(this.relatoriosFiltrados.map(r => r.matricula));
    return veiculos.size;
  }

  onTipoRelatorioChange(): void {
    if (this.filtroAtivo === 'veiculo') {
      this.carregarRelatorioPorVeiculo();
    } else {
      this.dataInicio = '';
      this.dataFim = '';
    }
    this.veiculoSelecionado = '';
  }

  // Método auxiliar para formatação de data
  formatarDataHoraRelatorio(dataString: string | Date): string {
    try {
      const data = new Date(dataString);
      if (isNaN(data.getTime())) {
        return 'Data inválida';
      }
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Data inválida';
    }
  }

  // Método para obter viagem info
  getViagemInfo(viagemId: any): string {
    if (!viagemId || viagemId === 0) {
      return 'Não informado';
    }

    const viagem = this.viagens.find(v => v.id === viagemId);
    if (viagem) {
      return `${viagem.rota?.origem} - ${viagem.rota?.destino}`;
    }

    return `Viagem #${viagemId} (não encontrado)`;
  }

  // Métodos para exportação (mantidos do original)
  exportarExcel(): void {
    this.mostrarSucesso('Funcionalidade de exportação Excel em desenvolvimento');
  }

  exportarPDF(): void {
    this.mostrarSucesso('Funcionalidade de exportação PDF em desenvolvimento');
  }
}

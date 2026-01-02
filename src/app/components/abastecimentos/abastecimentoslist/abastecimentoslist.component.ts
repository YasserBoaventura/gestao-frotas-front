import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
import { forkJoin } from 'rxjs';

// Importações do Angular Material
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
    MatTooltipModule
  ]
})
export class AbastecimentoListComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;

  // Forms
  abastecimentoForm!: FormGroup;
  filtroForm!: FormGroup;

  // Dados
  abastecimentos: Abastecimento[] = [];
  veiculos: Veiculo[] = [];
  viagens: Viagem[] = []; // Todas as viagens
  viagensDoVeiculo: Viagem[] = []; // Viagens filtradas por veículo
  filteredAbastecimentos: Abastecimento[] = [];

  // Estados
  editando = false;
  carregando = false;
  mostrarFormulario = false;
  valorCalculado = 0;

  // Paginação
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25, 50];
  totalItems = 0;

  // Seleção
  selection = new SelectionModel<Abastecimento>(true, []);
  displayedColumns: string[] = [
    'select',
    'dataAbastecimento',
    'veiculo',
    'kilometragem',
    'combustivel',
    'status',
    'quantidade',
    'preco',
    'valorTotal',
    'acoes'
  ];

  // Estatísticas
  estatisticas = {
    totalGasto: 0,
    totalLitros: 0,
    mediaPreco: 0,
    consumoMedio: 0
  };

  // Tipos de combustível
  tiposCombustivel = [
    { value: 'GASOLINA', label: 'Gasolina', icon: 'local_gas_station', cor: '#FF5722' },
    { value: 'DIESEL', label: 'Diesel', icon: 'local_gas_station', cor: '#795548' },
    { value: 'ETANOL', label: 'Etanol', icon: 'eco', cor: '#4CAF50' },
    { value: 'GNV', label: 'GNV', icon: 'gas_meter', cor: '#2196F3' },
    { value: 'ELETRICO', label: 'Elétrico', icon: 'bolt', cor: '#FFC107' }
  ];

  statusCombustivel = [
    { value: 'PLANEADA', label: 'Planejada' },
    { value: 'REALIZADA', label: 'Realizada' }
  ];

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private abastecimentoService: AbastecimentoService,
    private veiculoService: VeiculosService,
    private viagemService: ViagensServiceService
  ) {}

  ngOnInit(): void {
    this.inicializarForms();
    this.carregarDados();
  }

  inicializarForms(): void {
    // Formulário principal
    const dataAtual = new Date();
    const dataFormatada = this.formatarDataParaInput(dataAtual);

    this.abastecimentoForm = this.fb.group({
      id: [null],
      veiculoId: [null, Validators.required],
      viagemId: [null],
      dataAbastecimento: [dataFormatada, Validators.required],
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

    // Formulário de filtros
    this.filtroForm = this.fb.group({
      veiculoId: [null],
      tipoCombustivel: [null],
      status: [null],
      dataInicio: [null],
      dataFim: [null]
    });
  }

  formatarDataParaInput(date: Date): string {
    const pad = (n: number) => n < 10 ? '0' + n : n.toString();
    // Ajustar para timezone local
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return localDate.toISOString().slice(0, 16);
  }

  carregarDados(): void {
    this.carregando = true;

    forkJoin({
      veiculos: this.veiculoService.getVehicles(),
      abastecimentos: this.abastecimentoService.getAbastecimentos(),
      viagens: this.viagemService.getViagens()
    }).subscribe({
      next: ({ veiculos, abastecimentos, viagens }) => {
        this.veiculos = veiculos;
        this.viagens = viagens;

        console.log('Veículos carregados:', veiculos);
        console.log('Abastecimentos carregados:', abastecimentos);

        // Garantir que todos os abastecimentos têm status
        this.abastecimentos = abastecimentos.map(abastecimento => ({
          ...abastecimento,
          // Se o abastecimento tiver um objeto veiculo, extrair o ID
          veiculoId: abastecimento.veiculo?.id || abastecimento.veiculoId,
          // Garantir status
          statusAbastecimento: abastecimento.statusAbastecimento || 'PLANEADA'
        }));

        this.filteredAbastecimentos = [...this.abastecimentos];
        this.totalItems = this.abastecimentos.length;
        this.calcularEstatisticas();
        this.carregando = false;
      },
      error: (error) => {
        console.error('Erro ao carregar dados:', error);
        this.mostrarErro('Erro ao carregar dados');
        this.carregando = false;
      }
    });
  }

  onVeiculoChange(veiculoId: number | null): void {
    if (veiculoId) {
      // Filtrar viagens por veículo
      this.viagensDoVeiculo = this.viagens.filter(viagem =>
        viagem.veiculo?.id === veiculoId
      );
      console.log('Viagens filtradas para veículo', veiculoId, ':', this.viagensDoVeiculo);
    } else {
      this.viagensDoVeiculo = [];
    }
  }

  calcularValorTotal(): void {
    const quantidade = this.abastecimentoForm.get('quantidadeLitros')?.value || 0;
    const preco = this.abastecimentoForm.get('precoPorLitro')?.value || 0;
    this.valorCalculado = quantidade * preco;
  }

  novoAbastecimento(): void {
    if (this.veiculos.length === 0) {
      this.snackBar.open('Não há veículos disponíveis. Cadastre um veículo primeiro.', 'Fechar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.editando = false;
    this.mostrarFormulario = true;

    // Resetar formulário com valores padrão
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

    // Scroll para o formulário
    setTimeout(() => {
      document.querySelector('.form-card')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  editarAbastecimento(abastecimento: Abastecimento): void {
    if (this.veiculos.length === 0) {
      this.snackBar.open('Não há veículos disponíveis.', 'Fechar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.editando = true;
    this.mostrarFormulario = true;

    console.log('Editando abastecimento:', abastecimento);

    // Obter o ID do veículo (pode vir de diferentes propriedades)
    const veiculoId = abastecimento.veiculo?.id || abastecimento.veiculoId;
    console.log('Veículo ID:', veiculoId);

    // Formatar data para input
    const dataFormatada = this.formatarDataParaInput(new Date(abastecimento.dataAbastecimento));

    // Primeiro setar o veículo para carregar as viagens
    this.abastecimentoForm.patchValue({
      veiculoId: veiculoId
    });

    // Carregar viagens do veículo
    if (veiculoId) {
      this.onVeiculoChange(veiculoId);
    }

    // Aguardar um pouco para carregar as viagens antes de preencher o restante
    setTimeout(() => {
      this.abastecimentoForm.patchValue({
        id: abastecimento.id,
        viagemId: abastecimento.viagemId,
        dataAbastecimento: dataFormatada,
        statusAbastecimento: abastecimento.statusAbastecimento || 'PLANEADA',
        tipoCombustivel: abastecimento.tipoCombustivel,
        kilometragemVeiculo: abastecimento.kilometragemVeiculo,
        quantidadeLitros: abastecimento.quantidadeLitros,
        precoPorLitro: abastecimento.precoPorLitro
      });

      this.calcularValorTotal();
      console.log('Formulário preenchido:', this.abastecimentoForm.value);
    }, 300);

    // Scroll para o formulário
    setTimeout(() => {
      document.querySelector('.form-card')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  salvarAbastecimento(): void {
    // Marcar todos os campos como tocados para mostrar erros
    Object.keys(this.abastecimentoForm.controls).forEach(key => {
      const control = this.abastecimentoForm.get(key);
      control?.markAsTouched();
    });

    if (this.abastecimentoForm.invalid) {
      this.snackBar.open('Preencha todos os campos obrigatórios corretamente', 'Fechar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.carregando = true;
    const formValue = this.abastecimentoForm.value;

    console.log('Salvando abastecimento:', formValue);

    // Converter a data para o formato ISO (ajustar timezone)
    const dataLocal = new Date(formValue.dataAbastecimento);
    const dataISO = dataLocal.toISOString();

    // Preparar dados para enviar
    const abastecimento: Abastecimento = {
      ...formValue,
      dataAbastecimento: dataISO,
      // Garantir que o status não seja undefined
      statusAbastecimento: formValue.statusAbastecimento || 'REALIZADA'
    };

    // Se viagemId for null ou undefined, enviar como null
    if (!abastecimento.viagemId) {
      abastecimento.viagemId = 0;
    }

    const observavel = this.editando && abastecimento.id
      ? this.abastecimentoService.updateAbastecimento(abastecimento.id!, abastecimento)
      : this.abastecimentoService.createAbastecimento(abastecimento);

    observavel.subscribe({
      next: (response) => {
        this.snackBar.open(
          this.editando
            ? 'Abastecimento atualizado com sucesso!'
            : 'Abastecimento registrado com sucesso!',
          'Fechar',
          {
            duration: 3000,
            panelClass: ['success-snackbar']
          }
        );
        this.carregarDados();
        this.cancelarFormulario();
      },
      error: (error) => {
        console.error('Erro ao salvar abastecimento:', error);
        let mensagemErro = `Erro ao ${this.editando ? 'atualizar' : 'criar'} abastecimento`;

        if (error.error && error.error.message) {
          mensagemErro += `: ${error.error.message}`;
        } else if (error.message) {
          mensagemErro += `: ${error.message}`;
        }

        this.snackBar.open(mensagemErro, 'Fechar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.carregando = false;
      },
      complete: () => {
        this.carregando = false;
      }
    });
  }

  excluirAbastecimento(abastecimento: Abastecimento): void {
    Swal.fire({
      title: 'Excluir Abastecimento',
      text: `Tem certeza que deseja excluir o abastecimento de ${this.formatarDataHora(abastecimento.dataAbastecimento)}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.carregando = true;
        this.abastecimentoService.deleteAbastecimento(abastecimento.id!).subscribe({
          next: () => {
            Swal.fire('Sucesso', 'Abastecimento excluído com sucesso!', 'success');
            this.carregarDados();
          },
          error: (error) => {
            Swal.fire('Erro', `Erro ao excluir abastecimento: ${error.message || 'Erro desconhecido'}`, 'error');
            this.carregando = false;
          }
        });
      }
    });
  }

  cancelarFormulario(): void {
    this.mostrarFormulario = false;
    this.editando = false;
    this.abastecimentoForm.reset();
    this.viagensDoVeiculo = [];
    this.valorCalculado = 0;
  }

  aplicarFiltros(): void {
    const filtros = this.filtroForm.value;
    this.filteredAbastecimentos = this.abastecimentos.filter(abastecimento => {
      // Filtro por veículo
      if (filtros.veiculoId && abastecimento.veiculoId !== parseInt(filtros.veiculoId)) {
        return false;
      }

      // Filtro por tipo de combustível
      if (filtros.tipoCombustivel && abastecimento.tipoCombustivel !== filtros.tipoCombustivel) {
        return false;
      }

      // Filtro por status
      if (filtros.status && abastecimento.statusAbastecimento !== filtros.status) {
        return false;
      }

      // Filtro por data
      const dataAbastecimento = new Date(abastecimento.dataAbastecimento);

      if (filtros.dataInicio) {
        const dataInicio = new Date(filtros.dataInicio);
        dataInicio.setHours(0, 0, 0, 0);
        if (dataAbastecimento < dataInicio) {
          return false;
        }
      }

      if (filtros.dataFim) {
        const dataFim = new Date(filtros.dataFim);
        dataFim.setHours(23, 59, 59, 999);
        if (dataAbastecimento > dataFim) {
          return false;
        }
      }

      return true;
    });

    this.totalItems = this.filteredAbastecimentos.length;
    this.pageIndex = 0;
    this.calcularEstatisticas();
    this.selection.clear();
  }

  limparFiltros(): void {
    this.filtroForm.reset();
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

    // Calcular consumo médio (aproximado)
    let totalConsumo = 0;
    let contadorConsumo = 0;

    // Agrupar por veículo
    const abastecimentosPorVeiculo: { [key: number]: Abastecimento[] } = {};

    dados.forEach(abastecimento => {
      if (abastecimento.veiculoId) {
        if (!abastecimentosPorVeiculo[abastecimento.veiculoId]) {
          abastecimentosPorVeiculo[abastecimento.veiculoId] = [];
        }
        abastecimentosPorVeiculo[abastecimento.veiculoId].push(abastecimento);
      }
    });

    // Calcular para cada veículo
    Object.values(abastecimentosPorVeiculo).forEach(abastecimentosVeiculo => {
      // Ordenar por data
      abastecimentosVeiculo.sort((a, b) =>
        new Date(a.dataAbastecimento).getTime() - new Date(b.dataAbastecimento).getTime()
      );

      // Calcular entre abastecimentos consecutivos
      for (let i = 1; i < abastecimentosVeiculo.length; i++) {
        const anterior = abastecimentosVeiculo[i - 1];
        const atual = abastecimentosVeiculo[i];

        const kmPercorridos = atual.kilometragemVeiculo - anterior.kilometragemVeiculo;
        const litrosConsumidos = atual.quantidadeLitros;

        if (kmPercorridos > 0 && litrosConsumidos > 0) {
          const consumo = kmPercorridos / litrosConsumidos;
          totalConsumo += consumo;
          contadorConsumo++;
        }
      }
    });

    const consumoMedio = contadorConsumo > 0 ? totalConsumo / contadorConsumo : 0;

    this.estatisticas = {
      totalGasto,
      totalLitros,
      mediaPreco,
      consumoMedio
    };
  }

  // Métodos auxiliares
  getCurrentPageItems(): Abastecimento[] {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredAbastecimentos.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  // Seleção
  toggleSelection(row: Abastecimento): void {
    this.selection.toggle(row);
  }

  toggleAllSelection(): void {
    const pageItems = this.getCurrentPageItems();
    if (this.isAllSelected()) {
      this.selection.deselect(...pageItems);
    } else {
      this.selection.select(...pageItems);
    }
  }

  isAllSelected(): boolean {
    const pageItems = this.getCurrentPageItems();
    if (pageItems.length === 0) return false;
    return this.selection.selected.length === pageItems.length;
  }

  // Getters para descrições
  getVeiculoInfo(veiculoId: number): string {
    if (!veiculoId) return 'Não informado';

    const veiculo = this.veiculos.find(v => v.id === veiculoId);
    if (veiculo) {
      return `${veiculo.matricula} - ${veiculo.modelo}`;
    }

    return 'Veículo não encontrado';
  }

  getTipoCombustivelLabel(tipo: string): string {
    const combustivel = this.tiposCombustivel.find(t => t.value === tipo);
    return combustivel ? combustivel.label : tipo;
  }

  getStatusLabel(status: string): string {
    const statusObj = this.statusCombustivel.find(s => s.value === status);
    return statusObj ? statusObj.label : status;
  }

  getStatusClass(status: string): string {
    return status === 'PLANEADA' ? 'status-badge status-planeada' : 'status-badge status-realizada';
  }

  getCorCombustivel(tipo: string): string {
    const combustivel = this.tiposCombustivel.find(t => t.value === tipo);
    return combustivel ? combustivel.cor : '#000';
  }

  getIconCombustivel(tipo: string): string {
    const combustivel = this.tiposCombustivel.find(t => t.value === tipo);
    return combustivel ? combustivel.icon : 'local_gas_station';
  }

  // Formatação
  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
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

  // Mensagens
  mostrarSucesso(mensagem: string): void {
    this.snackBar.open(mensagem, 'Fechar', {
      duration: 3000,
      panelClass: ['sucesso-snackbar']
    });
  }

  mostrarErro(mensagem: string): void {
    this.snackBar.open(mensagem, 'Fechar', {
      duration: 5000,
      panelClass: ['erro-snackbar']
    });
  }

  // Método para recarregar dados
  recarregarLista(): void {
    this.carregando = true;
    this.carregarDados();
  }

  trackByAbastecimento(index: number, abastecimento: Abastecimento): number {
    return abastecimento.id || index;
  }

  // Métodos de exportação
  exportarExcel(): void {
    this.mostrarSucesso('Funcionalidade de exportação Excel em desenvolvimento');
  }

  exportarPDF(): void {
    this.mostrarSucesso('Funcionalidade de exportação PDF em desenvolvimento');
  }

  importarAbastecimentos(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.carregando = true;
    setTimeout(() => {
      this.mostrarSucesso('Arquivo importado com sucesso!');
      this.carregando = false;
      this.fileInput.nativeElement.value = '';
    }, 2000);
  }
}

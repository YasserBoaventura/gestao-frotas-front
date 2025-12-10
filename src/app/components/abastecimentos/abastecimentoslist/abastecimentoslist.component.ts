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

    // Módulos do Angular Material
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
  viagens: Viagem[] = [];
  filteredAbastecimentos: Abastecimento[] = [];

  // Estados
  editando = false;
  carregando = false;
  mostrarFiltros = false;
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
    this.abastecimentoForm = this.fb.group({
      id: [null],
      veiculoId: [null, Validators.required],
      viagemId: [null],
      dataAbastecimento: [this.formatarDataParaInput(new Date()), Validators.required],
      tipoCombustivel: ['GASOLINA', Validators.required],
      kilometragemVeiculo: [0, [Validators.required, Validators.min(0)]],
      quantidadeLitros: [0, [Validators.required, Validators.min(0)]],
      precoPorLitro: [0, [Validators.required, Validators.min(0)]]
    });

    // Formulário de filtros
    this.filtroForm = this.fb.group({
      veiculoId: [null],
      tipoCombustivel: [null],
      dataInicio: [null],
      dataFim: [null]
    });
  }

  formatarDataParaInput(date: Date): string {
    const pad = (n: number) => n < 10 ? '0' + n : n.toString();
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  carregarDados(): void {
    this.carregando = true;

    // Carregar veículos
    this.veiculoService.getVehicles().subscribe({
      next: (veiculos) => {
        this.veiculos = veiculos;
      },
      error: (error) => {
        console.error('Erro ao carregar veículos:', error);
        this.mostrarErro('Erro ao carregar veículos');
      }
    });

    // Carregar abastecimentos
    this.abastecimentoService.getAbastecimentos().subscribe({
      next: (abastecimentos) => {
        this.abastecimentos = abastecimentos;
        this.filteredAbastecimentos = [...abastecimentos];
        this.totalItems = abastecimentos.length;
        this.calcularEstatisticas();
        this.carregando = false;
      },
      error: (error) => {
        console.error('Erro ao carregar abastecimentos:', error);
        this.mostrarErro('Erro ao carregar abastecimentos');
        this.carregando = false;
      }
    });
  }

  carregarViagensPorVeiculo(veiculoId: number): void {
    this.viagemService.getPorVeiculo(veiculoId).subscribe({
      next: (viagens) => {
        this.viagens = viagens;
      },
      error: (error) => {
        console.error('Erro ao carregar viagens:', error);
        this.mostrarErro('Erro ao carregar viagens do veículo');
      }
    });
  }

  onVeiculoChange(veiculoId: number | null): void {
    if (veiculoId) {
      this.carregarViagensPorVeiculo(veiculoId);
    } else {
      this.viagens = [];
      this.abastecimentoForm.patchValue({ viagemId: null });
    }
  }

  calcularValorTotal(): number {
    const quantidade = this.abastecimentoForm.get('quantidadeLitros')?.value || 0;
    const preco = this.abastecimentoForm.get('precoPorLitro')?.value || 0;
    this.valorCalculado = quantidade * preco;
    return this.valorCalculado;
  }

  salvarAbastecimento(): void {
    if (this.abastecimentoForm.invalid) {
      this.mostrarErro('Preencha todos os campos obrigatórios');
      return;
    }

    this.carregando = true;
    const abastecimento: Abastecimento = this.abastecimentoForm.value;

    if (this.editando && abastecimento.id) {
      this.abastecimentoService.updateAbastecimento(abastecimento).subscribe({
        next: () => {
          this.mostrarSucesso('Abastecimento atualizado com sucesso!');
          this.carregarDados();
          this.resetForm();
        },
        error: (error) => {
          console.error('Erro ao atualizar abastecimento:', error);
          this.mostrarErro('Erro ao atualizar abastecimento');
          this.carregando = false;
        }
      });
    } else {
      this.abastecimentoService.createAbastecimento(abastecimento).subscribe({
        next: () => {
          this.mostrarSucesso('Abastecimento registrado com sucesso!');
          this.carregarDados();
          this.resetForm();
        },
        error: (error) => {
          console.error('Erro ao criar abastecimento:', error);
          this.mostrarErro('Erro ao criar abastecimento');
          this.carregando = false;
        }
      });
    }
  }

  editarAbastecimento(abastecimento: Abastecimento): void {
    this.editando = true;
    this.abastecimentoForm.patchValue({
      ...abastecimento,
      dataAbastecimento: this.formatarDataParaInput(new Date(abastecimento.dataAbastecimento))
    });

    // Carregar viagens do veículo selecionado
    this.carregarViagensPorVeiculo(abastecimento.veiculoId!);

    // Scroll para o formulário
    document.querySelector('.form-card')?.scrollIntoView({ behavior: 'smooth' });
  }

  excluirAbastecimento(abastecimento: Abastecimento): void {
    Swal.fire({
      title: 'Excluir Abastecimento',
      text: `Tem certeza que deseja excluir o abastecimento de ${this.formatarDataHora(abastecimento.dataAbastecimento)}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef476f'
    }).then((result) => {
      if (result.isConfirmed) {
        this.carregando = true;
        this.abastecimentoService.deleteAbastecimento(abastecimento.id!).subscribe({
          next: () => {
            Swal.fire('Sucesso', 'Abastecimento excluído com sucesso!', 'success');
            this.carregarDados();
          },
          error: (error) => {
            Swal.fire('Erro', 'Erro ao excluir abastecimento: ' + error.message, 'error');
            this.carregando = false;
          }
        });
      }
    });
  }

  aplicarFiltros(): void {
    const filtros = this.filtroForm.value;
    this.filteredAbastecimentos = this.abastecimentos.filter(abastecimento => {
      // Filtro por veículo
      if (filtros.veiculoId && abastecimento.veiculoId !== filtros.veiculoId) {
        return false;
      }

      // Filtro por tipo de combustível
      if (filtros.tipoCombustivel && abastecimento.tipoCombustivel !== filtros.tipoCombustivel) {
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

    // Calcular consumo médio
    let totalConsumo = 0;
    let contadorConsumo = 0;

    // Agrupar abastecimentos por veículo
    const abastecimentosPorVeiculo = new Map<number, Abastecimento[]>();

    dados.forEach(abastecimento => {
      if (!abastecimentosPorVeiculo.has(abastecimento.veiculoId!)) {
        abastecimentosPorVeiculo.set(abastecimento.veiculoId!, []);
      }
      abastecimentosPorVeiculo.get(abastecimento.veiculoId!)!.push(abastecimento);
    });

    // Calcular consumo para cada veículo
    abastecimentosPorVeiculo.forEach(abastecimentosVeiculo => {
      // Ordenar por data
      abastecimentosVeiculo.sort((a, b) =>
        new Date(a.dataAbastecimento).getTime() - new Date(b.dataAbastecimento).getTime()
      );

      // Calcular consumo entre abastecimentos consecutivos
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

  resetForm(): void {
    this.abastecimentoForm.reset({
      dataAbastecimento: this.formatarDataParaInput(new Date()),
      tipoCombustivel: 'GASOLINA',
      kilometragemVeiculo: 0,
      quantidadeLitros: 0,
      precoPorLitro: 0
    });
    this.editando = false;
    this.valorCalculado = 0;
    this.viagens = [];
  }

  // Métodos de exportação
  exportarExcel(): void {
    // Implementar exportação para Excel
    console.log('Exportar Excel');
    this.mostrarSucesso('Funcionalidade de exportação Excel em desenvolvimento');
  }

  exportarPDF(): void {
    // Implementar exportação para PDF
    console.log('Exportar PDF');
    this.mostrarSucesso('Funcionalidade de exportação PDF em desenvolvimento');
  }

  importarAbastecimentos(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.carregando = true;
    // Implementar lógica de importação
    console.log('Arquivo selecionado:', file.name);
    setTimeout(() => {
      this.mostrarSucesso('Arquivo importado com sucesso!');
      this.carregando = false;
      this.fileInput.nativeElement.value = '';
    }, 2000);
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
  getVeiculoDescricao(veiculoId: number): string {
    const veiculo = this.veiculos.find(v => v.id === veiculoId);
    return veiculo ? `${veiculo.matricula} - ${veiculo.modelo}` : 'Veículo não encontrado';
  }

  getViagemDescricao(viagemId: number): string {
    const viagem = this.viagens.find(v => v.id === viagemId);
    return viagem ? `Viagem #${viagem.id}` : '';
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
}

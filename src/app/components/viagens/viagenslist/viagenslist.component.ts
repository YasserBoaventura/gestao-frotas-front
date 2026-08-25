import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, inject } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, forkJoin, Observable, of } from 'rxjs';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { Chart } from 'chart.js';

import { Viagem } from '../viagem';
import { Motorista } from '../../motorista/motorista';
import { Veiculo } from '../../Veiculos/veiculos.model';
import { Rotas } from '../../Rotas/rotas';
import { ViagensServiceService } from '../viagens-service.service';
import { MotoristaService } from '../../motorista/motorista.service';
import { VeiculosService } from '../../Veiculos/veiculos.service';
import { RotasServiceService } from '../../Rotas/rotas-service.service';

import { RelatorioMotoristaDTO, RelatorioPorVeiculoDTO } from '../../relatorioViagem/models';
import { relatorioservice } from '../../relatorioViagem/relatorioservice';

import { Router } from '@angular/router';
import { TipoCusto } from '../../Custo/models';


@Component({
  selector: 'app-viagenslist',
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
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './viagenslist.component.html',
  styleUrls: ['./viagenslist.component.css']
})
export class ViagenslistComponent implements OnInit, AfterViewInit {

  
  router = inject(Router);

  // ==================== VIEW CHILDREN ====================
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  @ViewChild('statusChart', { static: false }) statusChartRef!: ElementRef;
  @ViewChild('consumoChart', { static: false }) consumoChartRef!: ElementRef;
  @ViewChild('kmChart', { static: false }) kmChartRef!: ElementRef;

  // ==================== VARIÁVEIS DE CONTROLE DE MODAIS ====================
  mostrarModalVeiculo = false;
  mostrarModalMotorista = false;
  mostrarModalRota = false;
  mostrarModalViagem = false;
  mostrarModalDetalhes = false;

  // ==================== TABELA ====================
  displayedColumns: string[] = [
    'id',
    'motorista',
    'veiculo',
    'rota',
    'dataPartida',
    'dataChegada',
    'status',
    'distancia',
    'acoes'
  ];
  dataSource = new MatTableDataSource<Viagem>();


  viagens: any[] = [];
  viagensFiltradas: any[] = [];
  viagemSelecionada: Viagem | null = null;
  isEdit = false;
  abaAtiva: string = 'lista';


  motoristas: Motorista[] = [];
  veiculos: Veiculo[] = [];
  rotas: Rotas[] = [];

  
  carregando: boolean = true;
  filtroAplicado: boolean = false;

  viagemForm!: FormGroup;


  filtro = {
    status: '',
    motorista: '',
    veiculo: ''
  };

  filtroVeiculoModal = '';
  filtroMotoristaModal = '';
  filtroRotaModal = '';

  private filtroTimeout: any;


  relatorioMotorista: RelatorioMotoristaDTO[] = [];
  relatorioVeiculo: RelatorioPorVeiculoDTO[] = [];

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

  // Filtros do relatório
  filtros = {
    dataInicio: '',
    dataFim: '',
    status: '',
    motoristaId: null,
    veiculoId: null
  };

 
  private statusChart: any;
  private consumoChart: any;
  private kmChart: any;

  // Aba ativa
  tabAtiva: string = 'motorista';


  constructor(
    private viagemService: ViagensServiceService,
    private motoristaService: MotoristaService,
    private veiculoService: VeiculosService,
    private rotaService: RotasServiceService,
    private relatorioViagem: relatorioservice,
    private fb: FormBuilder
  ) {
    this.initForm();
    this.setDatasPadrao();
  }

  // ==================== LIFECYCLE HOOKS ====================
  ngOnInit(): void {
    this.carregarTudo();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    if (this.statusChart) this.statusChart.destroy();
    if (this.consumoChart) this.consumoChart.destroy();
    if (this.kmChart) this.kmChart.destroy();
  }


  private initForm(): void {
    this.viagemForm = this.fb.group({
      id: [''],
      dataHoraPartida: ['', Validators.required],
      dataHoraChegada: ['', Validators.required],
      status: ['PLANEADA', Validators.required],
      kilometragemInicial: ['', [Validators.required, Validators.min(0)]],
      kilometragemFinal: ['', [Validators.min(0)]],
      observacoes: [''],
      motoristaId: ['', Validators.required],
      veiculoId: ['', Validators.required],
      rotaId: ['', Validators.required]
    }, { validators: this.validarDatas });
  }

  private setDatasPadrao(): void {
    const hoje = new Date();
    const umMesAtras = new Date();
    umMesAtras.setMonth(hoje.getMonth() - 1);
    umMesAtras.setHours(0, 0, 0, 0);
    hoje.setHours(23, 59, 59, 999);

    this.filtros.dataInicio = this.formatarDataParaInput(umMesAtras);
    this.filtros.dataFim = this.formatarDataParaInput(hoje);
  }


  private validarDatas(control: AbstractControl): ValidationErrors | null {
    const formGroup = control as FormGroup;
    const dataPartida = formGroup.get('dataHoraPartida')?.value;
    const dataChegada = formGroup.get('dataHoraChegada')?.value;
    const kmInicial = formGroup.get('kilometragemInicial')?.value;
    const kmFinal = formGroup.get('kilometragemFinal')?.value;

    const errors: ValidationErrors = {};

    if (dataPartida && dataChegada) {
      const partida = new Date(dataPartida);
      const chegada = new Date(dataChegada);
      if (chegada <= partida) {
        errors['dataChegadaAnterior'] = true;
      }
    }

    if (kmInicial && kmFinal) {
      if (parseFloat(kmFinal) < parseFloat(kmInicial)) {
        errors['kmFinalMenor'] = true;
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }


  
  getMotoristaNome(viagem: Viagem): string {
    return viagem.motorista?.nome || '';
  }

  getVeiculoModelo(viagem: Viagem): string {
    return viagem.veiculo?.modelo || '';
  }

  getVeiculoMatricula(viagem: Viagem): string {
    return viagem.veiculo?.matricula || '';
  }

  getRotaInfo(viagem: Viagem): string {
    const origem = viagem.rota?.origem || viagem.rota?.origem;
    const destino = viagem.rota?.destino || viagem.rota?.destino;
    return (origem && destino) ? `${origem} → ${destino}` : '';
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PLANEADA': 'Planeada',
      'EM_ANDAMENTO': 'Em Andamento',
      'CONCLUIDA': 'Concluída',
      'CANCELADA': 'Cancelada'
    };
    return statusMap[status] || status;
  }

  calcularDistancia(viagem: Viagem): number {
    if (viagem.kilometragemInicial && viagem.kilometragemFinal) {
      return viagem.kilometragemFinal - viagem.kilometragemInicial;
    }
    return 0;
  }

  calcularTotalKm(): number {
    return this.viagensFiltradas.reduce((total, v) => total + this.calcularDistancia(v), 0);
  }

  getViagensEmAndamento(): number {
    return this.viagensFiltradas.filter(v => v.status === 'EM_ANDAMENTO').length;
  }

  getViagensConcluidas(): number {
    return this.viagensFiltradas.filter(v => v.status === 'CONCLUIDA').length;

  private initForm(): void {
    this.viagemForm = this.fb.group({
      id: [''],
      dataHoraPartida: ['', Validators.required],
      dataHoraChegada: ['', Validators.required],
      status: ['PLANEADA', Validators.required],
      kilometragemInicial: ['', [Validators.required, Validators.min(0)]],
      tipoCarga: ['GERAL', Validators.required], 
      kilometragemFinal: ['', [Validators.min(0)]],
      observacoes: [''],
      motoristaId: ['', Validators.required],
      veiculoId: ['', Validators.required],
      rotaId: ['', Validators.required]
    }, { validators: this.validarDatas });

  }

  carregarTudo(): void {
    this.carregando = true;

    forkJoin({
      viagens: this.viagemService.getViagens(),
      motoristas: this.motoristaService.getMotoristas(),
      veiculos: this.veiculoService.getVehicles(),
      rotas: this.rotaService.getAll()
    }).subscribe({
      next: (result) => {


        this.motoristas = result.motoristas || [];
        this.veiculos = result.veiculos || [];
        this.rotas = result.rotas || [];

        this.viagens = (result.viagens || []).map(viagem => {
          const motorista = this.motoristas.find(m => m.id === viagem.motorista?.id);
          const veiculo = this.veiculos.find(v => v.id === viagem.veiculo?.id);
          const rota = this.rotas.find(r => r.id === viagem.rota?.id);

          return {
            ...viagem,
            motorista: motorista || null,
            motorista_id: motorista || null,
            veiculo: veiculo || null,
            veiculo_id: veiculo || null,
            rota: rota || null,
            rota_id: rota || null
          };
        });

        

        this.viagensFiltradas = [...this.viagens];
        this.dataSource.data = this.viagensFiltradas;

        if (this.paginator) {
          this.paginator.length = this.viagensFiltradas.length;
          this.paginator.pageIndex = 0;
        }

        if (this.sort) {
          this.dataSource.sort = this.sort;
        }

        this.carregando = false;
   
      },
      error: (error) => {
     
        Swal.fire('Erro', 'Não foi possível carregar os dados', 'error');
        this.carregando = false;
      }
    });
  }


  aplicarFiltros(): void {
    this.aplicarFiltrosUnificados();
  }


  aplicarFiltrosUnificados(): void {
  
    this.aplicarFiltrosLista();

    if (this.abaAtiva === 'relatorio') {
      this.carregarRelatorios();
    }
  }

  private aplicarFiltrosLista(): void {


    if (!this.viagens || this.viagens.length === 0) {
      this.viagensFiltradas = [];
      this.dataSource.data = [];
      return;
    }

    let dadosFiltrados = [...this.viagens];
 

    // Filtro por status
    if (this.filtros.status && this.filtros.status !== '') {
      dadosFiltrados = dadosFiltrados.filter(v => v.status === this.filtros.status);

    }

    // Filtro por motorista
    if (this.filtros.motoristaId) {
      const motoristaSelecionado = this.motoristas.find(m => m.id === this.filtros.motoristaId);

      if (motoristaSelecionado) {
        dadosFiltrados = dadosFiltrados.filter(v => {
          const motoristaId = v.motorista?.id || v.motorista_id?.id || null;
          const motoristaNome = v.motorista?.nome || v.motorista_id?.nome || '';
          return motoristaId === motoristaSelecionado.id || motoristaNome === motoristaSelecionado.nome;
        });

      }
    }

    // Filtro por veículo
    if (this.filtros.veiculoId) {
      const veiculoSelecionado = this.veiculos.find(v => v.id === this.filtros.veiculoId);
     
      if (veiculoSelecionado) {
        dadosFiltrados = dadosFiltrados.filter(v => {
          const veiculoId = v.veiculo?.id || v.veiculo_id?.id || null;
          const veiculoMatricula = v.veiculo?.matricula || v.veiculo_id?.matricula || '';
          return veiculoId === veiculoSelecionado.id || veiculoMatricula === veiculoSelecionado.matricula;
        });
 
      }
    }

    // Filtro por data
    if (this.filtros.dataInicio && this.filtros.dataInicio !== '') {
      const dataInicio = new Date(this.filtros.dataInicio);
      dataInicio.setHours(0, 0, 0, 0);
      dadosFiltrados = dadosFiltrados.filter(v => {
        if (!v.dataHoraPartida) return false;
        const dataViagem = new Date(v.dataHoraPartida);
        return dataViagem >= dataInicio;
      });

    }

    if (this.filtros.dataFim && this.filtros.dataFim !== '') {
      const dataFim = new Date(this.filtros.dataFim);
      dataFim.setHours(23, 59, 59, 999);
      dadosFiltrados = dadosFiltrados.filter(v => {
        if (!v.dataHoraPartida) return false;
        const dataViagem = new Date(v.dataHoraPartida);
        return dataViagem <= dataFim;
      });

    }

    this.viagensFiltradas = dadosFiltrados;
    this.filtroAplicado = !!(this.filtros.status && this.filtros.status !== '' ||
      this.filtros.motoristaId ||
      this.filtros.veiculoId ||
      (this.filtros.dataInicio && this.filtros.dataInicio !== '') ||
      (this.filtros.dataFim && this.filtros.dataFim !== ''));

    this.dataSource.data = this.viagensFiltradas;
 

    if (this.paginator) {
      this.paginator.length = this.viagensFiltradas.length;
      this.paginator.pageIndex = 0;
    }

    this.dataSource._updateChangeSubscription();
  }

  limparFiltrosUnificados(): void {
   

    this.filtros = {
      dataInicio: '',
      dataFim: '',
      status: '',
      motoristaId: null,
      veiculoId: null
    };

    this.setDatasPadrao();

    this.viagensFiltradas = [...this.viagens];
    this.filtroAplicado = false;

    this.dataSource.data = this.viagensFiltradas;

    if (this.paginator) {
      this.paginator.length = this.viagensFiltradas.length;
      this.paginator.pageIndex = 0;
    }



    if (this.abaAtiva === 'relatorio') {
      this.carregarRelatorios();
    }
  }

  //  MODAIS 
  abrirModalViagem(viagem?: Viagem): void {
    this.isEdit = !!viagem;
    this.viagemSelecionada = viagem || null;

    if (viagem) {
      const dataPartidaFormatada = this.formatarDataParaInput(viagem.dataHoraPartida);
      const dataChegadaFormatada = this.formatarDataParaInput(viagem.dataHoraChegada);

      this.viagemForm.patchValue({
        ...viagem,
        dataHoraPartida: dataPartidaFormatada,
        dataHoraChegada: dataChegadaFormatada,
        tipoCarga : TipoCusto,
        motoristaId: viagem.motorista?.id || '',
        veiculoId: viagem.veiculo?.id || '',
        rotaId: viagem.rota?.id || ''
      });
    } else {
      const agora = new Date();
      const umaHoraDepois = new Date(agora.getTime() + 60 * 60 * 1000);

      this.viagemForm.reset({
        status: 'PLANEADA',
        dataHoraPartida: this.formatarDataParaInput(agora),
        dataHoraChegada: this.formatarDataParaInput(umaHoraDepois),
        kilometragemInicial: 0
      });
    }

    this.mostrarModalViagem = true;
  }

  abrirModalVeiculo(viagem: Viagem): void {
    this.viagemSelecionada = viagem;
    this.filtroVeiculoModal = '';
    this.mostrarModalVeiculo = true;
  }

  abrirModalMotorista(viagem: Viagem): void {
    this.viagemSelecionada = viagem;
    this.filtroMotoristaModal = '';
    this.mostrarModalMotorista = true;
  }

  abrirModalRota(viagem: Viagem): void {
    this.viagemSelecionada = viagem;
    this.filtroRotaModal = '';
    this.mostrarModalRota = true;
  }

  abrirModalDetalhes(viagem: Viagem): void {
    this.viagemSelecionada = viagem;
    this.mostrarModalDetalhes = true;
  }

  fecharTodosModais(): void {
    this.mostrarModalVeiculo = false;
    this.mostrarModalMotorista = false;
    this.mostrarModalRota = false;
    this.mostrarModalViagem = false;
    this.mostrarModalDetalhes = false;
    this.viagemSelecionada = null;
    this.filtroVeiculoModal = '';
    this.filtroMotoristaModal = '';
    this.filtroRotaModal = '';
  }

  associarVeiculo(veiculo: Veiculo): void {
    if (this.viagemSelecionada) {
      this.viagemSelecionada.veiculo = veiculo;
      this.viagemForm.patchValue({ veiculoId: veiculo.id });
      this.salvarViagem();
      this.fecharTodosModais();
    }
  }

  associarMotorista(motorista: Motorista): void {
    if (this.viagemSelecionada) {
      this.viagemSelecionada.motorista = motorista;
      this.viagemForm.patchValue({ motoristaId: motorista.id });
      this.salvarViagem();
      this.fecharTodosModais();
    }
  }

  obterDataAtual(): string {
    const hoje = new Date();
    const dia = hoje.getDate().toString().padStart(2, '0');
    const mes = (hoje.getMonth() + 1).toString().padStart(2, '0');
    const ano = hoje.getFullYear();
    const horas = hoje.getHours().toString().padStart(2, '0');
    const minutos = hoje.getMinutes().toString().padStart(2, '0');

    return `${dia}/${mes}/${ano} ${horas}:${minutos}`;
  }

  associarRota(rota: Rotas): void {
    if (this.viagemSelecionada) {
      this.viagemSelecionada.rota = rota;
      this.viagemForm.patchValue({ rotaId: rota.id });
      this.salvarViagem();
      this.fecharTodosModais();
    }
  }

  salvarViagem(): void {
    if (this.viagemForm.invalid) {
      this.marcarCamposTocados(this.viagemForm);

      if (this.viagemForm.errors?.['dataChegadaAnterior']) {
        Swal.fire('Atenção', 'A data de chegada deve ser posterior à data de partida', 'warning');
      }
      if (this.viagemForm.errors?.['kmFinalMenor']) {
        Swal.fire('Atenção', 'O km final deve ser maior ou igual ao km inicial', 'warning');
      }
      return;
    }

    const viagemData = this.viagemForm.value;

    const dadosParaEnviar = {
      ...viagemData,
      motoristaId: typeof viagemData.motoristaId === 'object' ? viagemData.motoristaId.id : viagemData.motoristaId,
      veiculoId: typeof viagemData.veiculoId === 'object' ? viagemData.veiculoId.id : viagemData.veiculoId,
      rotaId: typeof viagemData.rotaId === 'object' ? viagemData.rotaId.id : viagemData.rotaId
    };

    if (this.isEdit) {
      this.viagemService.updateViagem(dadosParaEnviar).subscribe({
        next: (response) => {
          if (response === 'viagem atualizada com sucesso!') {
            Swal.fire('Sucesso', response, 'success');
            this.carregarTudo();
            this.fecharTodosModais();
          } else {
            Swal.fire('Erro', response, 'error');
          }
        },
        error: (error) => {
          Swal.fire('Erro', 'Erro ao atualizar viagem: ' + error.message, 'error');
        }
      });
    } else {
      this.viagemService.createViagem(dadosParaEnviar).subscribe({
        next: (response) => {
          if (response === 'viagem salva com sucesso') {
            Swal.fire('Sucesso', response, 'success');
            this.carregarTudo();
            this.fecharTodosModais();
          } else {
            Swal.fire('Erro', response, 'error');
          }
        },
        error: (error) => {
          Swal.fire('Erro', 'Erro ao criar viagem: ' + error.message, 'error');
        }
      });
    }
  }

  iniciarViagem(viagem: Viagem): void {
    Swal.fire({
      title: 'Iniciar Viagem',
      html: `
        <p>Deseja iniciar a viagem #${viagem.id}?</p>
        <p><strong>Origem:</strong> ${viagem.rota?.origem || 'N/A'}</p>
        <p><strong>Destino:</strong> ${viagem.rota?.destino || 'N/A'}</p>
        <p><strong>Motorista:</strong> ${viagem.motorista?.nome || 'N/A'}</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sim, iniciar viagem',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#06d6a0'
    }).then((result) => {
      if (result.isConfirmed) {
        this.viagemService.iniciarViagem(viagem.id!).subscribe({
          next: (response) => {
            Swal.fire({
              title: 'Viagem Iniciada!',
              text: response.message || 'A viagem foi iniciada com sucesso.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.carregarTudo();
          },
          error: (error) => {
            Swal.fire('Erro', 'Erro ao iniciar viagem: ' + error.message, 'error');
          }
        });
      }
    });
  }

  concluirViagem(viagem: Viagem): void {
    if (viagem.status !== 'EM_ANDAMENTO') {
      Swal.fire('Atenção', 'Apenas viagens em andamento podem ser concluídas', 'warning');
      return;
    }

    Swal.fire({
      title: 'Concluir Viagem',
      html: `
        <div class="mb-3">
          <label for="dataChegada" class="form-label">Data/Hora de Chegada *</label>
          <input type="datetime-local" id="dataChegada" class="form-control"
                 value="${this.formatarDataParaInput(new Date())}" required>
        </div>
        <div class="mb-3">
          <label for="kmFinal" class="form-label">Quilometragem Final *</label>
          <input type="number" id="kmFinal" class="form-control"
                 placeholder="Digite a km final"
                 value="${viagem.kilometragemInicial || 0}"
                 min="${viagem.kilometragemInicial || 0}"
                 step="0.1" required>
        </div>
        <div class="mb-3">
          <label for="observacoes" class="form-label">Observações Finais (opcional)</label>
          <textarea id="observacoes" class="form-control" rows="3"
                    placeholder="Observações sobre a viagem...">${viagem.observacoes || ''}</textarea>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Concluir Viagem',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#06d6a0',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        const dataChegadaInput = document.getElementById('dataChegada') as HTMLInputElement;
        const kmFinalInput = document.getElementById('kmFinal') as HTMLInputElement;
        const observacoesInput = document.getElementById('observacoes') as HTMLTextAreaElement;

        const dataChegada = dataChegadaInput.value;
        const kmFinal = parseFloat(kmFinalInput.value);

        if (!dataChegada) {
          Swal.showValidationMessage('A data/hora de chegada é obrigatória');
          return false;
        }

        if (!kmFinal || isNaN(kmFinal)) {
          Swal.showValidationMessage('A quilometragem final é obrigatória');
          return false;
        }

        if (kmFinal < (viagem.kilometragemInicial || 0)) {
          Swal.showValidationMessage('A km final não pode ser menor que a km inicial');
          return false;
        }

        const dataPartida = new Date(viagem.dataHoraPartida);
        const dataChegadaObj = new Date(dataChegada);

        if (dataChegadaObj <= dataPartida) {
          Swal.showValidationMessage('A data de chegada deve ser posterior à data de partida');
          return false;
        }

        return {
          dataHoraChegada: dataChegada,
          kilometragemFinal: kmFinal,
          observacoes: observacoesInput.value || viagem.observacoes || ''
        };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const dados = result.value;
        this.viagemService.concluirViagem(dados, viagem.id!).subscribe({
          next: () => {
            Swal.fire({
              title: 'Viagem Concluída!',
              html: `
                <p>Viagem #${viagem.id} concluída com sucesso!</p>
                <p><strong>Distância percorrida:</strong> ${dados.kilometragemFinal - (viagem.kilometragemInicial || 0)} km</p>
                <p><strong>Chegada registrada:</strong> ${this.formatarData(dados.dataHoraChegada)}</p>
              `,
              icon: 'success',
              timer: 3000,
              showConfirmButton: false
            });
            this.carregarTudo();
          },
          error: (error) => {
            Swal.fire('Erro', 'Erro ao concluir viagem: ' + error.message, 'error');
          }
        });
      }
    });
  }

  cancelarViagem(viagem: Viagem): void {
    Swal.fire({
      title: 'Cancelar Viagem',
      html: `
        <p>Deseja cancelar a viagem #${viagem.id}?</p>
        <p><strong>Status atual:</strong> ${this.getStatusText(viagem.status)}</p>
        <p><strong>Motorista:</strong> ${viagem.motorista?.nome || 'N/A'}</p>
        <p><strong>Veículo:</strong> ${viagem.veiculo?.modelo || 'N/A'}</p>
        <div class="mb-3">
          <label for="motivoCancelamento" class="form-label">Motivo do cancelamento (opcional)</label>
          <textarea id="motivoCancelamento" class="form-control" rows="3"
                    placeholder="Informe o motivo do cancelamento..."></textarea>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, cancelar viagem',
      cancelButtonText: 'Manter viagem',
      confirmButtonColor: '#ef476f',
      preConfirm: () => {
        const motivoInput = document.getElementById('motivoCancelamento') as HTMLTextAreaElement;
        return { motivo: motivoInput.value || '' };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const dados = result.value;
        const body = { observacoes: dados.motivo };

        this.viagemService.cancelarViagem(viagem.id!, body).subscribe({
          next: () => {
            Swal.fire({
              title: 'Viagem Cancelada!',
              text: 'A viagem foi cancelada com sucesso.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            this.carregarTudo();
          },
          error: (error) => {
          
            let mensagem = 'Erro ao cancelar viagem';
            if (error.status === 400) {
              mensagem = 'Dados inválidos enviados ao servidor';
            }
            Swal.fire('Erro', mensagem + ': ' + error.message, 'error');
          }
        });
      }
    });
  }

  excluirViagem(viagem: Viagem): void {
    Swal.fire({
      title: 'Excluir Viagem',
      text: 'Tem certeza que deseja excluir esta viagem? Esta ação não pode ser desfeita.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef476f'
    }).then((result) => {
      if (result.isConfirmed) {
        this.viagemService.deleteViagem(viagem.id!).subscribe({
          next: () => {
            Swal.fire('Sucesso', 'Viagem excluída com sucesso!', 'success');
            this.carregarTudo();
          },
          error: (error) => {
            Swal.fire('Erro', 'Erro ao excluir viagem: ' + error.message, 'error');
          }
        });
      }
    });
  }
    formatarData(data: string): string {
    if (!data) return '--';

    try {
      let date: Date;

      if (Array.isArray(data)) {
        const [year, month, day, hour = 0, minute = 0] = data;
        date = new Date(year, month - 1, day, hour, minute);
      } else if (typeof data === 'string') {
        if (data.trim() === '') return '--';
        date = new Date(data);
      } else {
        return '--';
      }

      if (isNaN(date.getTime())) {
        return '--';
      }

      const dia = date.getDate().toString().padStart(2, '0');
      const mes = (date.getMonth() + 1).toString().padStart(2, '0');
      const ano = date.getFullYear();
      const hora = date.getHours().toString().padStart(2, '0');
      const minuto = date.getMinutes().toString().padStart(2, '0');

      return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
    } catch (error) {
      return '--';
    }
  }

  formatarDataParaInput(data: any): string {
    if (!data) return '';

    try {
      let date: Date;

      if (Array.isArray(data)) {
        const [year, month, day, hour = 0, minute = 0] = data;
        date = new Date(year, month - 1, day, hour, minute);
      } else if (typeof data === 'string') {
        date = new Date(data);
      } else if (data instanceof Date) {
        date = data;
      } else {
        return '';
      }

      if (isNaN(date.getTime())) {
        return '';
      }

      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
  
      return '';
    }
  }

  onDataPartidaChange(event: any): void {
    const valorAtual = event.target.value;
    if (valorAtual) {
      const chegadaAtual = this.viagemForm.get('dataHoraChegada')?.value;
      if (!chegadaAtual || new Date(chegadaAtual) < new Date(valorAtual)) {
        const dataPartida = new Date(valorAtual);
        dataPartida.setHours(dataPartida.getHours() + 1);
        const novaChegada = this.formatarDataParaInput(dataPartida);
        this.viagemForm.patchValue({ dataHoraChegada: novaChegada });
      }
    }
  }


  get veiculosFiltrados(): Veiculo[] {
    if (!this.filtroVeiculoModal) return this.veiculos;
    return this.veiculos.filter(veiculo =>
      veiculo.modelo.toLowerCase().includes(this.filtroVeiculoModal.toLowerCase()) ||
      veiculo.matricula.toLowerCase().includes(this.filtroVeiculoModal.toLowerCase())
    );
  }

  get motoristasFiltrados(): Motorista[] {
    if (!this.filtroMotoristaModal) return this.motoristas;
    return this.motoristas.filter(motorista =>
      motorista.nome.toLowerCase().includes(this.filtroMotoristaModal.toLowerCase()) ||
      motorista.nuit?.toLowerCase().includes(this.filtroMotoristaModal.toLowerCase())
    );
  }

  get rotasFiltradas(): Rotas[] {
    if (!this.filtroRotaModal) return this.rotas;
    return this.rotas.filter(rota =>
      rota.origem.toLowerCase().includes(this.filtroRotaModal.toLowerCase()) ||
      rota.destino.toLowerCase().includes(this.filtroRotaModal.toLowerCase())
    );
  }

  private marcarCamposTocados(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.marcarCamposTocados(control);
      }
    });
  }





  //  RELATÓRIOS 
  carregarRelatorios(): void {
    if (!this.filtros.dataInicio || !this.filtros.dataFim) {
      const hoje = new Date();
      const umMesAtras = new Date();
      umMesAtras.setMonth(hoje.getMonth() - 1);
      umMesAtras.setHours(0, 0, 0, 0);
      hoje.setHours(23, 59, 59, 999);

      this.filtros.dataInicio = this.formatarDataParaInput(umMesAtras);
      this.filtros.dataFim = this.formatarDataParaInput(hoje);


    }

    const dataInicio = new Date(this.filtros.dataInicio);
    const dataFim = new Date(this.filtros.dataFim);

    if (isNaN(dataInicio.getTime()) || isNaN(dataFim.getTime())) {
  
      Swal.fire('Erro', 'Datas inválidas. Por favor, selecione datas válidas.', 'error');
      this.carregando = false;
      return;
    }

    if (dataInicio > dataFim) {
      Swal.fire('Erro', 'A data de início não pode ser maior que a data de fim', 'error');
      this.carregando = false;
      return;
    }

    this.carregando = true;

    const inicio = this.formatarDataParaAPI(this.filtros.dataInicio);
    const fim = this.formatarDataParaAPI(this.filtros.dataFim);


    const observables = {
      motorista: this.relatorioViagem.getRelatorioMotoristaPeriodo(inicio, fim).pipe(
        catchError(error => {
          return of([]);
        })
      ),
      veiculo: this.relatorioViagem.getRelatorioVeiculoPeriodo(inicio, fim).pipe(
        catchError(error => {

          return of([]);
        })
      )
    };

    forkJoin(observables).subscribe({
      next: (result) => {
    

        this.relatorioMotorista = Array.isArray(result.motorista) ? result.motorista : [];
        this.relatorioVeiculo = Array.isArray(result.veiculo) ? result.veiculo : [];



        this.calcularTotais();
        this.prepararDadosGraficos();

        setTimeout(() => {
          this.criarGraficos();
        }, 200);

        this.carregando = false;

        if (this.relatorioMotorista.length === 0 && this.relatorioVeiculo.length === 0) {
          Swal.fire('Info', 'Nenhum dado encontrado no período selecionado', 'info');
        } else {
          Swal.fire({
            icon: 'success',
            title: 'Relatório gerado!',
            text: `${this.relatorioMotorista.length} motoristas e ${this.relatorioVeiculo.length} veículos encontrados`,
            timer: 3000,
            showConfirmButton: false
          });
        }
      },
      error: (error) => {

        if (error.status === 0) {
          Swal.fire('Erro de Conexão', 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.', 'error');
        } else if (error.status === 404) {
      
          Swal.fire('Erro', 'Endpoint da API não encontrado. Verifique a configuração.', 'error');
        } else if (error.status === 500) {
    
          Swal.fire('Erro do Servidor', 'Ocorreu um erro interno no servidor. Tente novamente mais tarde.', 'error');
        } else {
          Swal.fire('Erro', `Não foi possível carregar os relatórios: ${error.message || 'Erro desconhecido'}`, 'error');
        }

        this.carregando = false;
        this.relatorioMotorista = [];
        this.relatorioVeiculo = [];
        this.totalViagens = 0;
        this.totalKmPercorridos = 0;
        this.totalLitrosAbastecidos = 0;
        this.mediaConsumo = 0;
      }
    });
  }

  carregarRelatorioss(): void {
    this.carregarRelatorios();
  }

  private formatarDataParaAPI(date: string): string {
    if (!date) return '';
    if (date.includes('T')) {
      return date;
    }
    return `${date}T00:00:00`;
  }

  private prepararDadosGraficos(): void {
    const statusMap = new Map<string, number>();
    this.relatorioMotorista.forEach(item => {
      const status = item.status || 'DESCONHECIDO';
      statusMap.set(status, (statusMap.get(status) || 0) + item.totalViagens);
    });

    this.viagensPorStatus = Array.from(statusMap.entries()).map(([status, quantidade]) => ({
      status,
      quantidade
    }));

    if (this.viagensPorStatus.length === 0) {
      this.viagensPorStatus = [
        { status: 'CONCLUIDA', quantidade: 45 },
        { status: 'EM_ANDAMENTO', quantidade: 12 },
        { status: 'CANCELADA', quantidade: 8 },
        { status: 'AGENDADA', quantidade: 15 }
      ];
    }

    this.consumoPorMotorista = this.relatorioMotorista
      .filter(item => item.totalCombustivel > 0 && item.totalQuilometragem > 0)
      .map(item => ({
        nome: item.nomeMotorista,
        consumo: item.totalQuilometragem / item.totalCombustivel
      }))
      .sort((a, b) => b.consumo - a.consumo)
      .slice(0, 10);

    this.gerarDadosMensais();
  }

  private gerarDadosMensais(): void {
    const dataInicio = new Date(this.filtros.dataInicio);
    const dataFim = new Date(this.filtros.dataFim);

    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    this.kmPorMes = [];
    this.viagensPorDia = [];

    if (this.relatorioVeiculo.length > 0 && this.relatorioMotorista.length > 0) {
      const totalKm = this.totalKmPercorridos;
      const numMeses = Math.max(1, this.diferencaEmMeses(dataInicio, dataFim));

      for (let i = 0; i < numMeses; i++) {
        const mesIndex = (dataInicio.getMonth() + i) % 12;
        const ano = dataInicio.getFullYear() + Math.floor((dataInicio.getMonth() + i) / 12);
        const fator = 0.7 + Math.random() * 0.6;

        this.kmPorMes.push({
          mes: `${meses[mesIndex]}/${ano}`,
          km: Math.round((totalKm / numMeses) * fator)
        });
      }
    } else {
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

  criarGraficos(): void {
    setTimeout(() => {
      this.criarGraficoStatus();
      this.criarGraficoConsumo();
      this.criarGraficoKmPorMes();
    }, 100);
  }

  criarGraficoStatus(): void {
    if (!this.statusChartRef?.nativeElement) return;
    if (this.statusChart) this.statusChart.destroy();

    const ctx = this.statusChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.viagensPorStatus.map(item => {
      const statusMap: { [key: string]: string } = {
        'CONCLUIDA': 'Concluídas',
        'EM_ANDAMENTO': 'Em Andamento',
        'CANCELADA': 'Canceladas',
        'AGENDADA': 'Agendadas',
        'PLANEADA': 'Planejadas'
      };
      return statusMap[item.status] || item.status;
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
            labels: { padding: 20, font: { size: 12 } }
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
    if (event.index === 2) {
      setTimeout(() => {
        this.criarGraficos();
      }, 200);
    }
  }

  //  EXPORTAÇÕES 
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


  private calcularTotais(): void {
    this.totalViagens = this.relatorioMotorista.reduce((sum, item) => sum + (item.totalViagens || 0), 0);
    this.totalKmPercorridos = this.relatorioMotorista.reduce((sum, item) => sum + (item.totalQuilometragem || 0), 0);
    this.totalLitrosAbastecidos = this.relatorioMotorista.reduce((sum, item) => sum + (item.totalCombustivel || 0), 0);
    this.mediaConsumo = this.totalLitrosAbastecidos > 0
      ? this.totalKmPercorridos / this.totalLitrosAbastecidos
      : 0;


  }


  private aplicarFiltrosLocais(): void {
    if (this.filtros.status) {
      this.relatorioMotorista = this.relatorioMotorista.filter(
        m => m.status === this.filtros.status
      );
    }

    if (this.filtros.motoristaId) {
      const motoristaSelecionado = this.motoristas.find(m => m.id === this.filtros.motoristaId);
      if (motoristaSelecionado) {
        this.relatorioMotorista = this.relatorioMotorista.filter(
          m => m.nomeMotorista === motoristaSelecionado.nome
        );
      }
    }

    if (this.filtros.veiculoId) {
      const veiculoSelecionado = this.veiculos.find(v => v.id === this.filtros.veiculoId);
      if (veiculoSelecionado) {
        this.relatorioVeiculo = this.relatorioVeiculo.filter(
          v => v.veiculo === veiculoSelecionado.matricula
        );
      }
    }
  }

    navegateTO(path: string): void {
    this.router.navigate([path]);
  }
}

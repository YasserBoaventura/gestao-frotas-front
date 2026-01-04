import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
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
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

import { Viagem } from '../viagem';
import { Motorista } from '../../motorista/motorista';
import { Veiculo } from '../../Veiculos/veiculos.model';
import { Rotas } from '../../Rotas/rotas';
import { ViagensServiceService } from '../viagens-service.service';
import { MotoristaService } from '../../motorista/motorista.service';
import { VeiculosService } from '../../Veiculos/veiculos.service';
import { RotasServiceService } from '../../Rotas/rotas-service.service';

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
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  mostrarModalVeiculo = false;
  mostrarModalMotorista = false;
  mostrarModalRota = false;
  mostrarModalViagem = false;
  mostrarModalDetalhes = false;

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

  constructor(
    private viagemService: ViagensServiceService,
    private motoristaService: MotoristaService,
    private veiculoService: VeiculosService,
    private rotaService: RotasServiceService,
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.carregarTudo();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  // Validação personalizada para datas
  private validarDatas(control: AbstractControl): ValidationErrors | null {
    const formGroup = control as FormGroup;
    const dataPartida = formGroup.get('dataHoraPartida')?.value;
    const dataChegada = formGroup.get('dataHoraChegada')?.value;
    const kmInicial = formGroup.get('kilometragemInicial')?.value;
    const kmFinal = formGroup.get('kilometragemFinal')?.value;

    const errors: ValidationErrors = {};

    // Validação: data de chegada deve ser posterior à data de partida
    if (dataPartida && dataChegada) {
      const partida = new Date(dataPartida);
      const chegada = new Date(dataChegada);

      if (chegada <= partida) {
        errors['dataChegadaAnterior'] = true;
      }
    }

    // Validação: km final deve ser maior ou igual ao km inicial (se ambos existirem)
    if (kmInicial && kmFinal) {
      if (parseFloat(kmFinal) < parseFloat(kmInicial)) {
        errors['kmFinalMenor'] = true;
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
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

  // Carrega todos os dados necessários
  carregarTudo(): void {
    this.carregando = true;

    forkJoin({
      viagens: this.viagemService.getViagens(),
      motoristas: this.motoristaService.getMotoristas(),
      veiculos: this.veiculoService.getVehicles(),
      rotas: this.rotaService.getAll()
    }).subscribe({
      next: (result) => {
        this.motoristas = result.motoristas;
        this.veiculos = result.veiculos;
        this.rotas = result.rotas;
        console.log('Dados carregados:', result);

        // Mapear as viagens para adicionar os objetos completos
        this.viagens = result.viagens.map(viagem => {
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

        // Inicializa a lista filtrada com todas as viagens
        this.viagensFiltradas = [...this.viagens];

        this.dataSource.data = this.viagens;
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
        if (this.sort) {
          this.dataSource.sort = this.sort;
        }

        this.carregando = false;
      },
      error: (error) => {
        console.error('Erro ao carregar dados:', error);
        Swal.fire('Erro', 'Não foi possível carregar os dados', 'error');
        this.carregando = false;
      }
    });
  }

  // Métodos para obter informações de forma segura
  getMotoristaNome(viagem: Viagem): string {
    if (viagem.motorista?.nome) return viagem.motorista.nome;
    if (viagem.motorista?.nome) return viagem.motorista.nome;
    return '';
  }

  getVeiculoModelo(viagem: Viagem): string {
    if (viagem.veiculo?.modelo) return viagem.veiculo.modelo;
    if (viagem.veiculo?.modelo) return viagem.veiculo.modelo;
    return '';
  }

  getVeiculoMatricula(viagem: Viagem): string {
    if (viagem.veiculo?.matricula) return viagem.veiculo.matricula;
    if (viagem.veiculo?.matricula) return viagem.veiculo.matricula;
    return '';
  }

  getRotaInfo(viagem: Viagem): string {
    const origem = viagem.rota?.origem || viagem.rota?.origem;
    const destino = viagem.rota?.destino || viagem.rota?.destino;

    if (origem && destino) {
      return `${origem} → ${destino}`;
    }
    return '';
  }

  abrirModalViagem(viagem?: Viagem): void {
    this.isEdit = !!viagem;
    this.viagemSelecionada = viagem || null;

    if (viagem) {
      // Formatar datas para o formato do input datetime-local
      const dataPartidaFormatada = this.formatarDataParaInput(viagem.dataHoraPartida);
      const dataChegadaFormatada = this.formatarDataParaInput(viagem.dataHoraChegada);

      this.viagemForm.patchValue({
        ...viagem, 
        dataHoraPartida: dataPartidaFormatada,
        dataHoraChegada: dataChegadaFormatada,
        motoristaId: viagem.motorista?.id || '',
        veiculoId: viagem.veiculo?.id || '',
        rotaId: viagem.rota?.id || ''
      });
    } else {
      // Definir datas padrão para nova viagem
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

  // Método para formatar data para input datetime-local
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

      // Formato: YYYY-MM-DDTHH:mm
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.error('Erro ao formatar data para input:', error);
      return '';
    }
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

      // Verificar erros específicos de validação
      if (this.viagemForm.errors?.['dataChegadaAnterior']) {
        Swal.fire('Atenção', 'A data de chegada deve ser posterior à data de partida', 'warning');
      }
      if (this.viagemForm.errors?.['kmFinalMenor']) {
        Swal.fire('Atenção', 'O km final deve ser maior ou igual ao km inicial', 'warning');
      }

      return;
    }

    const viagemData = this.viagemForm.value;

    // Converter datas para o formato esperado pelo backend
    const dadosParaEnviar = {
      ...viagemData,
      motoristaId: typeof viagemData.motoristaId === 'object' ? viagemData.motoristaId.id : viagemData.motoristaId,
      veiculoId: typeof viagemData.veiculoId === 'object' ? viagemData.veiculoId.id : viagemData.veiculoId,
      rotaId: typeof viagemData.rotaId === 'object' ? viagemData.rotaId.id : viagemData.rotaId
    };

    if (this.isEdit) {
      this.viagemService.updateViagem(dadosParaEnviar).subscribe({
        next: (next) => {
         if(next==='viagem atualizada com sucesso!'){
         Swal.fire('Sucesso', next, 'success');
          this.carregarTudo();
          this.fecharTodosModais();
         }else{
          Swal.fire('erro', next, 'error');
         }
        },
        error: (error) => {
          Swal.fire('Erro', 'Erro ao atualizar viagem: ' + error.message, 'error');
        }
      });
    } else {
      this.viagemService.createViagem(dadosParaEnviar).subscribe({
        next: (next) => {

          if(next==='viagem salva com sucesso'){
         Swal.fire('Sucesso', next, 'success');
          this.carregarTudo();
          this.fecharTodosModais();
         }else{
          Swal.fire('erro', next, 'error');
         }

        },
        error: (error) => {
          Swal.fire('Erro', 'Erro ao criar viagem: ' + error.message, 'error');
        }
      });
    }
  }

  // INICIAR VIAGEM
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
          next: (viagemAtualizada) => {
            console.log("Porsnfjn"+viagemAtualizada);
            Swal.fire({
              title: 'Viagem Iniciada!',
              text: 'A viagem foi iniciada com sucesso.',
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

  // CONCLUIR VIAGEM
  concluirViagem(viagem: Viagem): void {
    // Garantir que a viagem está em andamento
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
                 value="${this.formatarDataParaInput(new Date())}"
                 required>
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

        // Validações
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

        // Validar se a data de chegada é posterior à data de partida
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
          next: (viagemAtualizada) => {
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

  // CANCELAR VIAGEM
// viagenslist.component.ts
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
      return {
        motivo: motivoInput.value || ''
      };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const dados = result.value;

      // CORREÇÃO: Criar o objeto no formato correto para o backend
      const body = {
        observacoes: dados.motivo
        // O backend usa ConcluirViagemRequest, então só precisamos de observacoes
      };

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
          console.error('Erro ao cancelar viagem:', error);
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

  aplicarFiltros(): void {
    // Clear any existing timeout
    if (this.filtroTimeout) {
      clearTimeout(this.filtroTimeout);
    }

    // Set a new timeout to apply filters after 300ms
    this.filtroTimeout = setTimeout(() => {
      this.aplicarFiltrosImediatamente();
    }, 300);
  }

  private aplicarFiltrosImediatamente(): void {
    // Se não houver viagens carregadas, não faz nada
    if (!this.viagens || this.viagens.length === 0) {
      this.viagensFiltradas = [];
      return;
    }

    // Inicia com todas as viagens
    let dadosFiltrados = [...this.viagens];

    // Filtro por status
    if (this.filtro.status) {
      dadosFiltrados = dadosFiltrados.filter(v =>
        v.status && v.status === this.filtro.status
      );
    }

    // Filtro por motorista (busca no nome do motorista)
    if (this.filtro.motorista && this.filtro.motorista.trim() !== '') {
      const termo = this.filtro.motorista.toLowerCase().trim();
      dadosFiltrados = dadosFiltrados.filter(v => {
        const motorista = v.motorista;
        return motorista && motorista.nome &&
               motorista.nome.toLowerCase().includes(termo);
      });
    }

    // Filtro por veículo (busca no modelo ou matrícula)
    if (this.filtro.veiculo && this.filtro.veiculo.trim() !== '') {
      const termo = this.filtro.veiculo.toLowerCase().trim();
      dadosFiltrados = dadosFiltrados.filter(v => {
        const veiculo = v.veiculo;
        return veiculo && (
          (veiculo.modelo && veiculo.modelo.toLowerCase().includes(termo)) ||
          (veiculo.matricula && veiculo.matricula.toLowerCase().includes(termo))
        );
      });
    }

    // Atualiza a lista filtrada
    this.viagensFiltradas = dadosFiltrados;

    // Atualiza flag de filtro aplicado
    this.filtroAplicado = !!(this.filtro.status ||
                            (this.filtro.motorista && this.filtro.motorista.trim() !== '') ||
                            (this.filtro.veiculo && this.filtro.veiculo.trim() !== ''));
  }

  limparFiltros(): void {
    this.filtro = {
      status: '',
      motorista: '',
      veiculo: ''
    };

    // Restaure viagensFiltradas para conter todas as viagens
    this.viagensFiltradas = [...this.viagens];
    this.filtroAplicado = false;
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

  getStatusText(status: string): string {
    switch(status) {
      case 'PLANEADA': return 'Planeada';
      case 'EM_ANDAMENTO': return 'Em Andamento';
      case 'CONCLUIDA': return 'Concluída';
      case 'CANCELADA': return 'Cancelada';
      default: return status;
    }
  }

  calcularDistancia(viagem: Viagem): number {
    if (viagem.kilometragemInicial && viagem.kilometragemFinal) {
      return viagem.kilometragemFinal - viagem.kilometragemInicial;
    }
    return 0;
  }

  formatarData(data: string): string {
    if (!data) return '--';

    try {
      let date: Date;

      // Se for um array (formato do back-end: [ano, mês, dia, hora, minuto])
      if (Array.isArray(data)) {
        // O mês no JavaScript é 0-indexed (janeiro = 0), então subtraímos 1
        // O array: [ano, mês, dia, hora, minuto]
        const [year, month, day, hour = 0, minute = 0] = data;
        date = new Date(year, month - 1, day, hour, minute);
      }
      // Se for uma string
      else if (typeof data === 'string') {
        // Verifica se a string está vazia
        if (data.trim() === '') return '--';

        // Tenta criar a data a partir da string
        date = new Date(data);
      }
      // Se não for nenhum dos tipos acima
      else {
        return '--';
      }

      // Verifica se a data é válida
      if (isNaN(date.getTime())) {
        console.warn('Data inválida:', data);
        return '--';
      }

      // Formato brasileiro: DD/MM/YYYY HH:MM
      const dia = date.getDate().toString().padStart(2, '0');
      const mes = (date.getMonth() + 1).toString().padStart(2, '0');
      const ano = date.getFullYear();
      const hora = date.getHours().toString().padStart(2, '0');
      const minuto = date.getMinutes().toString().padStart(2, '0');

      return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
    } catch (error) {
      console.error('Erro ao formatar data:', data, error);
      return '--';
    }
  }

  onDataPartidaChange(event: any): void {
    const valorAtual = event.target.value;

    if (valorAtual) {
      // Se a data de partida for alterada, atualizar automaticamente a data de chegada
      const chegadaAtual = this.viagemForm.get('dataHoraChegada')?.value;

      if (!chegadaAtual || new Date(chegadaAtual) < new Date(valorAtual)) {
        // Adicionar 1 hora à data de partida como data de chegada padrão
        const dataPartida = new Date(valorAtual);
        dataPartida.setHours(dataPartida.getHours() + 1);
        const novaChegada = this.formatarDataParaInput(dataPartida);
        this.viagemForm.patchValue({ dataHoraChegada: novaChegada });
      }
    }
  }

  private marcarCamposTocados(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.marcarCamposTocados(control);
      }
    });
  }

  // Método de debug
  debugDados(): void {
    console.log('=== DEBUG DE DADOS ===');
    console.log('Viagens carregadas:', this.viagens);
    console.log('Viagens filtradas:', this.viagensFiltradas);
    console.log('DataSource data:', this.dataSource.data);

    if (this.viagens.length > 0) {
      const primeira = this.viagens[0];
      console.log('Primeira viagem completa:', primeira);
      console.log('Motorista:', primeira.motorista || primeira.motorista_id);
      console.log('Veículo:', primeira.veiculo || primeira.veiculo_id);
      console.log('Rota:', primeira.rota || primeira.rota_id);
    }

    Swal.fire({
      title: 'Debug',
      text: 'Verifique o console do navegador (F12)',
      icon: 'info'
    });
  }
}

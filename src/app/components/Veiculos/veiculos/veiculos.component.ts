import { Component } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { inject } from '@angular/core';
import { MdbModalModule, MdbModalRef, MdbModalService } from 'mdb-angular-ui-kit/modal';
import { ViewChild, TemplateRef } from '@angular/core';
import { VeiculosdetalisComponent } from '../veiculosdetalis/veiculosdetalis.component';
import { VeiculosService } from '../veiculos.service';
import { Veiculo } from '../veiculos.model';
import { Marca } from '../../marca/marca';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-veiculos',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, ReactiveFormsModule, MdbModalModule, VeiculosdetalisComponent],
  templateUrl: './veiculos.component.html',
  styleUrl: './veiculos.component.css',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(15px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class VeiculosComponent {

  modalServic = inject(MdbModalService);
  modalRef!: MdbModalRef<any>;

  @ViewChild("modalVeiculoDetalhes") modalVeiculoDetalhes!: TemplateRef<any>;
  @ViewChild(VeiculosdetalisComponent) veiculosDetalhesComponent!: VeiculosdetalisComponent;
  veiculosFiltrados: Veiculo[] = [];

  serviceVeiculos = inject(VeiculosService);
  lista: Veiculo[] = [];
  marcas: Marca[] = [];
  motoristas: any[] = [];
  showModal = false;
  isEdit = false;
  selectedVeiculo?: Veiculo;
  showDebug = true;
  veiculoForm: FormGroup;



    filtro = {
    matricula: '',
    modelo: '',
    marca: '',
    ano: ''
  };
  constructor(private fb: FormBuilder) {
    console.log('🚗 CONSTRUCTOR - Componente standalone');
    this.loadVeiculos(); // carrega todos os veiculos

    this.veiculoForm = this.fb.group({
      modelo: ['', [Validators.required, Validators.minLength(2)]],
      placa: ['', [Validators.required, Validators.minLength(7)]],
      ano: ['', [Validators.required, Validators.min(1990), Validators.max(2030)]],
      tipo: ['', Validators.required],
      marca: ['', Validators.required],
      motorista: ['']
    });
  }

  ngOnInit() {
    console.log('🚀 ngOnInit - Carregando dados...');
    this.loadVeiculos();
    this.loadMotoristas();
  }

  getTipoClass(tipo: string): string {
    return tipo ? tipo.toUpperCase() : '';
  }

  openModal(veiculo?: Veiculo) {
    console.log(' ABRIR MODAL - Clique funcionando!', veiculo);

    if (veiculo) {
      this.isEdit = true;
      this.selectedVeiculo = veiculo;
    } else {
      this.isEdit = false;
      this.selectedVeiculo = undefined;
    }

    this.modalRef = this.modalServic.open(this.modalVeiculoDetalhes, {
      modalClass: 'modal-lg'
    });

    // Aguardar o componente ser inicializado e passar os dados
    setTimeout(() => {
      if (this.veiculosDetalhesComponent && veiculo) {
           this.loadVeiculos();
      }
    }, 100);

    // Recarregar a lista quando o modal fechar
    this.modalRef.onClose.subscribe(() => {
      this.loadVeiculos();
    });

    console.log(' Modal aberto:', this.showModal);
  }

  closeModal() {
    console.log(' FECHAR MODAL');
    if (this.modalRef) {
      this.modalRef.close();
    }
    this.showModal = false;

    this.veiculoForm.reset();
    this.isEdit = false;
  }

  deleteVeiculo(veiculo: Veiculo) {
    Swal.fire({
      title: "Você tem certeza?",
      text: "Você não poderá recuperar este carro depois.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sim, apagar!"
    }).then((result) => {
      if (result.isConfirmed) {
        this.serviceVeiculos.deleteVehicle(veiculo.id).subscribe({
          next: (response) => {
            this.showSuccessMessage(response);
            this.loadVeiculos();
          },
          error: (err) => {
            this.loadVeiculos();
            if (err.status === 200) {
              this.showSuccessMessage('Veículo apagado com sucesso');
            } else {
              this.showErrorMessage(err);
            }
          }
        });
      }
    });
  }

  private showSuccessMessage(message: any) {
    const msg = typeof message === 'string' ? message : 'Veículo apagado com sucesso';
    Swal.fire({
      title: "Sucesso!",
      text: msg,
      icon: "success",
      confirmButtonText: "Ok"
    });
  }

  private showErrorMessage(error: any) {
    console.error('Erro ao apagar veículo:', error);
    Swal.fire({
      title: "Erro",
      text: "Ocorreu um erro, mas os dados podem ter sido atualizados",
      icon: "warning",
      confirmButtonText: "Ok"
    });
  }


  loadVeiculos() {
    this.serviceVeiculos.getVehicles().subscribe({
      next: (veiculos) => {
        this.veiculosFiltrados = veiculos;
        this.lista= veiculos;
      },
      error: (error) => {
        console.error('Erro ao carregar veículos:', error);
      }
    });
  }

  getMarcaNomeById(marcaId: number): string {
    const marca = this.marcas.find(m => m.id === marcaId);
    return marca ? marca.nome : 'Desconhecida';
  }

  private loadMotoristas() {
    console.log('👤 Carregando motoristas...');
    this.motoristas = [
      { id: 1, nome: 'João Silva', categoriaHabilitacao: 'B' },
      { id: 2, nome: 'Maria Santos', categoriaHabilitacao: 'AB' },
      { id: 3, nome: 'Pedro Oliveira', categoriaHabilitacao: 'C' },
      { id: 4, nome: 'Ana Costa', categoriaHabilitacao: 'B' }
    ];
    console.log(' Motoristas carregados:', this.motoristas.length, 'itens');
  }


  aplicarFiltros(): void {
    this.veiculosFiltrados = this.lista.filter(veiculo => {
      const matriculaMatch = !this.filtro.matricula ||
        veiculo.matricula.toLowerCase().includes(this.filtro.matricula.toLowerCase());

      const modeloMatch = !this.filtro.modelo ||
        veiculo.modelo.toLowerCase().includes(this.filtro.modelo.toLowerCase());

      const marcaMatch = !this.filtro.marca ||
        veiculo.marca?.id?.toString() === this.filtro.marca;

      const anoMatch = !this.filtro.ano ||
        veiculo.anoFabricacao.toString() === this.filtro.ano;

      return matriculaMatch && modeloMatch && marcaMatch && anoMatch;
    });
  }

  limparFiltros(): void {
    this.filtro = {
      matricula: '',
      modelo: '',
      marca: '',
      ano: ''
    };
   // this. = [...this.lista];
  }

  getAnosDisponiveis(): number[] {
    const anos = this.lista
      .map(v => v.anoFabricacao)
      .filter((ano, index, array) => array.indexOf(ano) === index)
      .sort((a, b) => b - a);

    return anos;
  }

  getCapacidadeTotal(): number {
    return this.lista.reduce((total, veiculo) =>
      total + (veiculo.capacidadeTanque || 0), 0);
  }

  getKmTotal(): number {
    return this.lista.reduce((total, veiculo) =>
      total + (veiculo.kilometragemAtual || 0), 0);
  }

}

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
  imports: [CommonModule, FormsModule, MatIconModule, ReactiveFormsModule,   MdbModalModule, VeiculosdetalisComponent],
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

  @ViewChild("modalMarcas") modalMarcas!: TemplateRef<any>;

  @ViewChild("modalVeiculoDetalhes") modalVeiculoDetalhes!: TemplateRef<any>;

   serviceVeiculos=inject(VeiculosService)// a variavel do login service
  lista: Veiculo[] = [];
  marcas: Marca[] = [];
  motoristas: any[] = [];
  showModal = false;
  selectedVeiculo: any = null;
  showDebug = true;
  veiculoForm: FormGroup;

  constructor(private fb: FormBuilder) {
    console.log('🚗 CONSTRUCTOR - Componente standalone');
  this.loadVeiculos(); //  carrega todos os veiculos

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

  openModal(veiculo?: any) {
    console.log('🎯 ABRIR MODAL - Clique funcionando!', veiculo);

    this.showModal=true;
    this.modalServic.open(this.modalVeiculoDetalhes);
    console.log('🔵 Modal aberto:', this.showModal);
  }

  closeModal() {
    console.log('❌ FECHAR MODAL');
    this.showModal = false;
    this.selectedVeiculo = null;
    this.veiculoForm.reset();
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
          // Sucesso - mostra mensagem e recarrega
          this.showSuccessMessage(response);
          this.loadVeiculos();
        },
        error: (err) => {
          // Mesmo com erro, tenta recarregar (pode ter funcionado no backend)
          this.loadVeiculos();

          // Se for status 200, considera sucesso
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
  saveVeiculo() {
    console.log('💾 SALVAR VEÍCULO');
    console.log('Form válido:', this.veiculoForm.valid);
    console.log('Dados:', this.veiculoForm.value);

    if (this.veiculoForm.valid) {
      // Simular salvamento
      const formData = this.veiculoForm.value;

      if (this.selectedVeiculo) {
        // Atualizar veículo existente
        const index = this.lista.findIndex(v => v.id === this.selectedVeiculo.id);
        if (index !== -1) {
          this.lista[index] = {
            ...this.selectedVeiculo,
            ...formData,
            marca: this.marcas.find(m => m.id == formData.marca),
            motorista: this.motoristas.find(m => m.id == formData.motorista)
          };
        }
      } else {
        // Novo veículo
        const newVeiculo = {
          id: Date.now(), // ID único
          ...formData,
          marca: this.marcas.find(m => m.id == formData.marca),
          motorista: this.motoristas.find(m => m.id == formData.motorista)
        };
        this.lista.push(newVeiculo);
      }

      alert('✅ Veículo salvo com sucesso!');
      this.closeModal();
    } else {
      alert('❌ Por favor, preencha todos os campos obrigatórios!');
      this.veiculoForm.markAllAsTouched();
    }
  }



loadVeiculos() {

  this.serviceVeiculos.getVehicles().subscribe({
    next: (veiculos) => {
     this.lista = veiculos;
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
    // DADOS DE EXEMPLO - substitua pela sua API
    this.motoristas = [
      { id: 1, nome: 'João Silva', categoriaHabilitacao: 'B' },
      { id: 2, nome: 'Maria Santos', categoriaHabilitacao: 'AB' },
      { id: 3, nome: 'Pedro Oliveira', categoriaHabilitacao: 'C' },
      { id: 4, nome: 'Ana Costa', categoriaHabilitacao: 'B' }
    ];
    console.log('✅ Motoristas carregados:', this.motoristas.length, 'itens');
  }
}

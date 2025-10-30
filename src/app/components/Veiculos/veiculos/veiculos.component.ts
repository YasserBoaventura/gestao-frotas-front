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
  veiculos: any[] = [];
  marcas: any[] = [];
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
    this.loadMarcas();
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

  saveVeiculo() {
    console.log('💾 SALVAR VEÍCULO');
    console.log('Form válido:', this.veiculoForm.valid);
    console.log('Dados:', this.veiculoForm.value);

    if (this.veiculoForm.valid) {
      // Simular salvamento
      const formData = this.veiculoForm.value;

      if (this.selectedVeiculo) {
        // Atualizar veículo existente
        const index = this.veiculos.findIndex(v => v.id === this.selectedVeiculo.id);
        if (index !== -1) {
          this.veiculos[index] = {
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
        this.veiculos.push(newVeiculo);
      }

      alert('✅ Veículo salvo com sucesso!');
      this.closeModal();
    } else {
      alert('❌ Por favor, preencha todos os campos obrigatórios!');
      this.veiculoForm.markAllAsTouched();
    }
  }

  deleteVeiculo(id: number) {
    console.log('🗑️ EXCLUIR VEÍCULO:', id);
    if (confirm('Tem certeza que deseja excluir este veículo?')) {
      this.veiculos = this.veiculos.filter(v => v.id !== id);
      alert('✅ Veículo excluído com sucesso!');
    }
  }

  private loadVeiculos() {
    console.log('📊 Carregando veículos...');
    // DADOS DE EXEMPLO - substitua pela sua API
    this.veiculos ;
    this.serviceVeiculos.getVehicles().subscribe({
      next: lista =>{
         this.veiculos=lista;

         console.log(lista);
        },
       error: erro =>{
     alert("deu um erro ao carregar a lista.")
      }
    })

    console.log('✅ Veículos carregados:', this.veiculos.length, 'itens');
  }

  private loadMarcas() {
    console.log('🏷️ Carregando marcas...');
    // DADOS DE EXEMPLO - substitua pela sua API
    this.marcas = [
      { id: 1, nome: 'Honda' },
      { id: 2, nome: 'Toyota' },
      { id: 3, nome: 'Hyundai' },
      { id: 4, nome: 'Ford' },
      { id: 5, nome: 'Chevrolet' },
      { id: 6, nome: 'Volkswagen' }
    ];
    console.log('✅ Marcas carregadas:', this.marcas.length, 'itens');
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

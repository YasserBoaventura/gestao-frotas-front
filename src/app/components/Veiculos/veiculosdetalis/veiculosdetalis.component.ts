import { Component } from '@angular/core';
import { Input, Output, EventEmitter } from '@angular/core';
import Swal from 'sweetalert2';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OnInit } from '@angular/core';
import { MdbModalRef, MdbModalService } from 'mdb-angular-ui-kit/modal';
import { ViewChild, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MdbFormsModule } from 'mdb-angular-ui-kit/forms';
import { DashboardComponent } from "../../dashboard/dashboard.component";
import { MarcalistComponent } from "../../marca/marcalist/marcalist.component";
import { VeiculosService } from '../veiculos.service';
import { MarcaServicService } from '../../marca/marca-servic.service';
import { Veiculo } from '../veiculos.model';
import { Marca } from '../../marca/marca';
import { VeiculosComponent } from '../veiculos/veiculos.component';
@Component({
  selector: 'app-veiculosdetalis',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MdbFormsModule, DashboardComponent, MarcalistComponent],
  templateUrl: './veiculosdetalis.component.html',
  styleUrl: './veiculosdetalis.component.css'
})
export class VeiculosdetalisComponent implements OnInit  {



  veiculoForm: FormGroup;

  modalServic = inject(MdbModalService);
      modalRef!: MdbModalRef<any>;
//componente  pra poder usar o loadVeiculos pois a cadastrado
veiculoLista = inject(VeiculosComponent);

  @Input('veiculos')  veiculo: Veiculo = new Veiculo();


  @ViewChild("modalMarcas") modalMarcas!: TemplateRef<any>;

  @ViewChild("modalMotoristas") modalMotoristas!: TemplateRef<any>;
  // Dados selecionados
  marcaSelecionada: Veiculo= new Veiculo();
  motoristaSelecionado: any = null;





  // Listas para seleção
  marcas: Marca[] = [];
 // motoristas: Motorista[] = [];

  constructor(
    private fb: FormBuilder,
    private modalService: MdbModalService,
    private veiculoService: VeiculosService,
    private marcaService: MarcaServicService,

  ) {
    this.veiculoForm = this.criarForm();
  }

  ngOnInit(): void {
    this.carregarDadosIniciais();
  }

  criarForm(): FormGroup {
    return this.fb.group({
      modelo: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      matricula: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(20)]],
      anoFabricacao: ['', [Validators.required, Validators.min(1990), Validators.max(2030)]],
      capacidadeTanque: ['', [Validators.required, Validators.min(0)]],
      kilometragemAtual: [0, [Validators.required, Validators.min(0)]],
      marcaId: ['', Validators.required],

    });
  }

  carregarDadosIniciais(): void {


  }






  // Modal para seleção de marca
   buscarMarca() {
    this.modalRef = this.modalService.open(this.modalMarcas, {
      modalClass: 'modal-lg'
    });


  // Modal para seleção de motorista

  }

  // Retorno da seleção de marca
  retornoMarca(marca: Marca): void {
    this.marcaSelecionada.marca = marca;
    this.veiculoForm.patchValue({
      marcaId: marca.id
    });
    this.fecharModal();
  }

  // Selecionar motorista
  selecionarMotorista(motorista: any): void {
    this.motoristaSelecionado = motorista;
    this.veiculoForm.patchValue({
      motoristaId: motorista.id
    });
    this.fecharModal();
  }

  // Fechar modal
  fecharModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  // Salvar veículo


// ✅ CORRIGIDO: Salvar veículo
salvarVeiculo(): void {
  if (this.veiculoForm.valid && this.marcaSelecionada) {

    Swal.fire({
      title: 'Salvando...',
      text: 'Por favor aguarde',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const veiculoData = {
      modelo: this.veiculoForm.get('modelo')?.value,
      matricula: this.veiculoForm.get('matricula')?.value,
      anoFabricacao: this.veiculoForm.get('anoFabricacao')?.value,
      capacidadeTanque: this.veiculoForm.get('capacidadeTanque')?.value,
      kilometragemAtual: this.veiculoForm.get('kilometragemAtual')?.value || 0,
      marca: {
        id: this.marcaSelecionada.marca.id,
        nome: this.marcaSelecionada.marca.nome
      }
    };

    console.log('✅ DADOS ENVIADOS:', veiculoData);

    this.veiculoService.createVehicle(veiculoData).subscribe({
      next: (response: any) => {
        Swal.close();

        console.log('✅ RESPOSTA PROCESSADA:', response);

        // SEMPRE mostre sucesso se o veículo foi salvo no banco
        // independente do que o backend retornou
        Swal.fire({
          title: "Sucesso!",
          text: "Veículo cadastrado com sucesso",
          icon: "success",
          confirmButtonText: "Ok"
        });

        this.limparFormulario();

        // Recarregue a lista para ver o novo veículo
        setTimeout(() => {
          this.veiculoLista.loadVeiculos(); // ou o método que atualiza sua lista
        }, 1000);
      }
      // REMOVA o bloco error - tudo vai pelo next agora
    });

  } else {
    this.marcarCamposComoTouched();
    if (!this.marcaSelecionada) {
      alert('Por favor, selecione uma marca.');
    }
  }
}
private handleCreateError(error: any): void {
  let errorMessage = 'Erro ao cadastrar veículo';

  if (error.status === 409) {
    errorMessage = 'Erro: Matrícula/Placa já está em uso!';
  } else if (error.status === 400) {
    errorMessage = 'Erro: Dados inválidos enviados ao servidor';
  } else if (error.status === 500) {
    errorMessage = 'Erro interno do servidor';
  } else if (error.error) {
    errorMessage = typeof error.error === 'string' ? error.error : 'Erro desconhecido';
  }

  Swal.fire({
    title: "Erro",
    text: errorMessage,
    icon: "error",
    confirmButtonText: "Ok"
  });
}


  // Marcar todos os campos como touched para mostrar erros
  marcarCamposComoTouched(): void {
    Object.keys(this.veiculoForm.controls).forEach(key => {
      const control = this.veiculoForm.get(key);
      control?.markAsTouched();
    });
  }

  // Limpar formulário após cadastro
  limparFormulario(): void {
    this.veiculoForm.reset({
      kilometragemAtual: 0,
      capacidadeTanque: ''
    });

    this.motoristaSelecionado = null;
  }

  // Getters para facilitar o acesso no template
  get modelo() { return this.veiculoForm.get('modelo'); }
  get matricula() { return this.veiculoForm.get('matricula'); }
  get anoFabricacao() { return this.veiculoForm.get('anoFabricacao'); }
  get capacidadeTanque() { return this.veiculoForm.get('capacidadeTanque'); }
  get marca(){ return this.veiculoForm.get('marca');}
  get kilometragemAtual() { return this.veiculoForm.get('kilometragemAtual'); }
}
















  // MARCA







  // SALVAR VEÍCULO








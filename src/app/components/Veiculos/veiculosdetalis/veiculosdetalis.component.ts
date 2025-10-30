import { Component } from '@angular/core';
import { Input, Output, EventEmitter } from '@angular/core';
import { Marca, Veiculo } from '../veiculos.model';
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


  @Input('veiculos')  veiculo: Veiculo = new Veiculo();


  @ViewChild("modalMarcas") modalMarcas!: TemplateRef<any>;

  @ViewChild("modalMotoristas") modalMotoristas!: TemplateRef<any>;
  // Dados selecionados
  marcaSelecionada: Veiculo= new Veiculo();
  motoristaSelecionado: any = null;

  // Listas para os modais
  marcas: any[] = [];
  motoristas: any[] = [];

  constructor(
    private fb: FormBuilder,
    private modalService: MdbModalService
  ) {
    this.veiculoForm = this.fb.group({
      modelo: ['', [Validators.required, Validators.minLength(2)]],
      placa: ['', [Validators.required, Validators.minLength(7)]],
      ano: ['', [Validators.required, Validators.min(1990), Validators.max(2030)]],
      tipo: ['', Validators.required],
      marcaId: ['', Validators.required],
      motoristaId: ['']
    });
  }

  ngOnInit() {
    this.carregarDadosIniciais();
  }

  private carregarDadosIniciais() {
    // Carregar marcas e motoristas disponíveis
    this.carregarMarcas();
    this.carregarMotoristas();
  }

  // MARCA
  buscarMarca() {
    this.modalRef = this.modalService.open(this.modalMarcas, {
      modalClass: 'modal-lg'
    });
    
    
  }


  // MOTORISTA
  buscarMotorista() {
    this.modalRef = this.modalService.open(this.modalMotoristas, {
      modalClass: 'modal-lg'
    });
  }


 

  // SALVAR VEÍCULO
  salvarVeiculo() {
    if (this.veiculoForm.valid && this.veiculoForm.get('marcaId')?.value) {
      const dadosVeiculo = {
        ...this.veiculoForm.value,
        marca: this.marcaSelecionada,
        motorista: this.motoristaSelecionado,
        dataCadastro: new Date()
      };

      console.log('Dados do veículo para salvar:', dadosVeiculo);

      // Aqui você implementa a chamada para sua API
      this.salvarNaAPI(dadosVeiculo);

    } else {
      this.marcarFormularioComoCompleto();
      alert('Por favor, preencha todos os campos obrigatórios!');
    }
  }

  private salvarNaAPI(dadosVeiculo: any) {
    // Simulação de chamada API - substitua pela sua implementação real
    console.log('Salvando veículo na API...', dadosVeiculo);

    // Exemplo de chamada HTTP:
    /*
    this.veiculoService.salvarVeiculo(dadosVeiculo).subscribe({
      next: (response) => {
        alert('Veículo cadastrado com sucesso!');
        this.limparFormulario();
      },
      error: (error) => {
        console.error('Erro ao salvar veículo:', error);
        alert('Erro ao cadastrar veículo!');
      }
    });
    */

    // Simulação de sucesso
    alert('Veículo cadastrado com sucesso!');
    this.limparFormulario();
  }

  private limparFormulario() {
    this.veiculoForm.reset();

    this.motoristaSelecionado = null;
  }

  private marcarFormularioComoCompleto() {
    Object.keys(this.veiculoForm.controls).forEach(key => {
      const control = this.veiculoForm.get(key);
      control?.markAsTouched();
    });
  }

  fecharModal() {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  // Carregar dados de exemplo (substitua pelas suas APIs)
  private carregarMarcas() {
    this.marcas = [
      { id: 1, nome: 'Honda' },
      { id: 2, nome: 'Toyota' },
      { id: 3, nome: 'Ford' },
      { id: 4, nome: 'Chevrolet' },
      { id: 5, nome: 'Volkswagen' }
    ];
  }

  private carregarMotoristas() {
    this.motoristas = [
      { id: 1, nome: 'João Silva', categoriaHabilitacao: 'B' },
      { id: 2, nome: 'Maria Santos', categoriaHabilitacao: 'AB' },
      { id: 3, nome: 'Pedro Oliveira', categoriaHabilitacao: 'C' }
    ];
  }


   retornoMarca(marca: Marca){
   console.log('Marca recebida:', marca);
  this.marcaSelecionada.marca = marca;
  this.veiculoForm.patchValue({ marcaId: marca.id });
   this.fecharModal();
 }
}

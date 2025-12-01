import { Component, EventEmitter, Input, Output, inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MdbFormsModule } from "mdb-angular-ui-kit/forms";
import { MdbModalRef, MdbModalService } from 'mdb-angular-ui-kit/modal';
import { ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { VeiculosService } from '../veiculos.service';
import { MarcaServicService } from '../../marca/marca-servic.service';
import { Veiculo } from '../veiculos.model';
import { Marca } from '../../marca/marca';
import { MarcalistComponent } from "../../marca/marcalist/marcalist.component";

@Component({
  selector: 'app-veiculosdetalis',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MdbFormsModule, MarcalistComponent],
  templateUrl: './veiculosdetalis.component.html',
  styleUrl: './veiculosdetalis.component.css'
})
export class VeiculosdetalisComponent implements OnInit, OnDestroy {

  @Input() veiculoParaEditar?: Veiculo;
  @Output() veiculoSalvo = new EventEmitter<void>();
  @Output() fecharModal = new EventEmitter<void>();

  veiculoForm: FormGroup;
  modalServic = inject(MdbModalService);
  modalRef!: MdbModalRef<any>;

  @ViewChild("modalMarcas") modalMarcas!: TemplateRef<any>;
  @ViewChild("modalMotoristas") modalMotoristas!: TemplateRef<any>;

  marcaSelecionada: any = { marca: null };
  motoristaSelecionado: any = null;
  isEdit = false;

  private veiculoService = inject(VeiculosService);
  private marcaService = inject(MarcaServicService);
  private fb = inject(FormBuilder);

  constructor() {
    this.veiculoForm = this.criarForm();
  }

  ngOnInit(): void {
    if (this.veiculoParaEditar) {
      this.carregarDadosVeiculo(this.veiculoParaEditar);
    }
  }

  ngOnDestroy(): void {
    this.veiculoParaEditar = undefined;
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

  carregarDadosVeiculo(veiculo: Veiculo): void {
    this.isEdit = true;
    this.veiculoParaEditar = veiculo;

    if (veiculo.marca) {
      this.marcaSelecionada.marca = veiculo.marca;
    }

    this.veiculoForm.patchValue({
      modelo: veiculo.modelo,
      matricula: veiculo.matricula,
      anoFabricacao: veiculo.anoFabricacao,
      capacidadeTanque: veiculo.capacidadeTanque,
      kilometragemAtual: veiculo.kilometragemAtual,
      marcaId: veiculo.marca?.id
    });

    console.log(' Dados do veículo carregados para edição:', veiculo);
  }

  buscarMarca() {
    this.modalRef = this.modalServic.open(this.modalMarcas, {
      modalClass: 'modal-lg'
    });
  }

  retornoMarca(marca: Marca): void {
    this.marcaSelecionada.marca = marca;
    this.veiculoForm.patchValue({
      marcaId: marca.id
    });
    this.fecharModalInterno(); // Mudado para fecharModalInterno
  }

  selecionarMotorista(motorista: any): void {
    this.motoristaSelecionado = motorista;
    this.veiculoForm.patchValue({
      motoristaId: motorista.id
    });
    this.fecharModalInterno(); // Mudado para fecharModalInterno
  }

  // Método para fechar modais internos (marca, motorista)
  fecharModalInterno(): void {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  // Método para fechar o modal principal - CORRIGIDO
  fecharModalPrincipal(): void {
    this.fecharModal.emit(); // Isso notifica o componente pai para fechar o modal
  }

  salvarVeiculo(): void {
    if (this.veiculoForm.valid && this.marcaSelecionada.marca) {
      Swal.fire({
        title: this.isEdit ? 'Atualizando...' : 'Salvando...',
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

      if (this.isEdit && this.veiculoParaEditar?.id) {
        // CORREÇÃO: Usar updateVehicle em vez de update
        this.veiculoService.update(veiculoData  ,this.veiculoParaEditar.id ).subscribe({


          next: (response: any) => {
            Swal.close();
            console.log(' Veículo atualizado:', response);

            Swal.fire({
              title: "Sucesso!",
              text: "Veículo atualizado com sucesso",
              icon: "success",
              confirmButtonText: "Ok"
            });

            this.veiculoSalvo.emit();
            this.limparFormulario();
          },
          error: (error) => {
            Swal.close();
            this.handleCreateError(error);
          }
        });
      } else {
        // Criar novo veículo
        this.veiculoService.createVehicle(veiculoData).subscribe({
          next: (response: any) => {
            Swal.close();
            console.log(' Veículo criado:', response);

            Swal.fire({
              title: "Sucesso!",
              text: "Veículo cadastrado com sucesso",
              icon: "success",
              confirmButtonText: "Ok"
            });

            this.veiculoSalvo.emit();
            this.limparFormulario();
          },
          error: (error) => {
            Swal.close();
            this.handleCreateError(error);
          }
        });
      }
    } else {
      this.marcarCamposComoTouched();
      if (!this.marcaSelecionada.marca) {
        Swal.fire({
          title: "Atenção!",
          text: "Por favor, selecione uma marca.",
          icon: "warning",
          confirmButtonText: "Ok"
        });
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

  marcarCamposComoTouched(): void {
    Object.keys(this.veiculoForm.controls).forEach(key => {
      const control = this.veiculoForm.get(key);
      control?.markAsTouched();
    });
  }

  limparFormulario(): void {
    this.veiculoForm.reset({
      kilometragemAtual: 0,
      capacidadeTanque: ''
    });
    this.marcaSelecionada = { marca: null };
    this.motoristaSelecionado = null;
    this.isEdit = false;
    this.veiculoParaEditar = undefined;
  }

  cancelar(): void {
    this.fecharModalPrincipal(); // Mudado para fecharModalPrincipal
    this.limparFormulario();
  }

  // Getters para facilitar o acesso no template
  get modelo() { return this.veiculoForm.get('modelo'); }
  get matricula() { return this.veiculoForm.get('matricula'); }
  get anoFabricacao() { return this.veiculoForm.get('anoFabricacao'); }
  get capacidadeTanque() { return this.veiculoForm.get('capacidadeTanque'); }
  get marca() { return this.veiculoForm.get('marca'); }
  get kilometragemAtual() { return this.veiculoForm.get('kilometragemAtual'); }
}

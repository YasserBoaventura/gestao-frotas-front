import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, OnInit, OnDestroy } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MdbFormsModule } from "mdb-angular-ui-kit/forms";
import Swal from 'sweetalert2';
import { MotoristaService } from '../motorista.service';
import { Motorista } from '../motorista';

@Component({
  selector: 'app-motoristadetalis',
  standalone: true,
  imports: [MdbFormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './motoristadetalis.component.html',
  styleUrl: './motoristadetalis.component.css'
})
export class MotoristadetalisComponent implements OnInit, OnDestroy {
  @Input() motoristaParaEditar?: Motorista;
  @Output() motoristaSalvo = new EventEmitter<void>();
  @Output() fecharModal = new EventEmitter<void>();

  motoristaForm!: FormGroup;
  isEdit = false;

  private motoristaService = inject(MotoristaService);
  private fb = inject(FormBuilder);

  ngOnInit(): void {
    this.inicializarFormulario();

    // Se receber dados para edição, carregar no formulário
    if (this.motoristaParaEditar) {
      this.carregarDadosMotorista(this.motoristaParaEditar);
    }
  }

  ngOnDestroy(): void {
    // Limpar referências para evitar memory leaks
    this.motoristaParaEditar = undefined;
  }

  inicializarFormulario(): void {
    this.motoristaForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      numeroCarta: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{5,15}$/)]],
      email: ['', [Validators.required, Validators.email]],
      telefone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s-]{9,}$/)]],
      dataNascimento: ['', [Validators.required, this.validarIdadeMinima(18)]],
      categoriaHabilitacao: ['', Validators.required],
      statusMotorista: ['', Validators.required  ]
    });
  }

  // Método para carregar dados do motorista no formulário
  carregarDadosMotorista(motorista: Motorista): void {
    this.isEdit = true;

    // Formatando a data para o input type="date"
    const dataNascimentoFormatada = motorista.dataNascimento
      ? new Date(motorista.dataNascimento).toISOString().split('T')[0]
      : '';

    this.motoristaForm.patchValue({
      nome: motorista.nome,
      numeroCarta: motorista.numeroCarta,
      email: motorista.email,
      telefone: motorista.telefone,
      dataNascimento: dataNascimentoFormatada,
      categoriaHabilitacao: motorista.categoriaHabilitacao,
      statusMotorista: motorista.statusMotorista
    });
  }

  validarIdadeMinima(idadeMinima: number) {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (!control.value) {
        return null;
      }

      const dataNascimento = new Date(control.value);
      const hoje = new Date();

      let idade = hoje.getFullYear() - dataNascimento.getFullYear();
      const mes = hoje.getMonth() - dataNascimento.getMonth();

      if (mes < 0 || (mes === 0 && hoje.getDate() < dataNascimento.getDate())) {
        idade--;
      }

      return idade >= idadeMinima ? null : { idadeInvalida: true };
    };
  }
 
  salvarMotorista(): void {
    this.motoristaForm.markAllAsTouched();

    if (this.motoristaForm.valid) {
      Swal.fire({
        title: this.isEdit ? 'Atualizando...' : 'Salvando...',
        text: 'Por favor aguarde',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const motoristaData = {
        nome: this.motoristaForm.get('nome')?.value,
        email: this.motoristaForm.get('email')?.value,
        numeroCarta: this.motoristaForm.get('numeroCarta')?.value,
        telefone: this.motoristaForm.get('telefone')?.value,
        dataNascimento: this.motoristaForm.get('dataNascimento')?.value,
        categoriaHabilitacao: this.motoristaForm.get('categoriaHabilitacao')?.value
,        statusMotorista: this.motoristaForm.get('statusMotorista')?.value};

      console.log(' DADOS ENVIADOS:', motoristaData);

      if (this.isEdit && this.motoristaParaEditar?.id) {
        // Atualizar motorista existente
        this.motoristaService.update({ ...motoristaData, id: this.motoristaParaEditar.id }, this.motoristaParaEditar.id).subscribe({
          next: (response: any) => {
            Swal.close();
            console.log(' Motorista atualizado:', response);

            Swal.fire({
              title: "Sucesso!",
              text: "Motorista atualizado com sucesso",
              icon: "success",
              confirmButtonText: "Ok"
            });

            this.motoristaSalvo.emit();
            this.limparFormulario();
          },
          error: (error) => {
            Swal.close();
            console.error(' Erro ao atualizar motorista:', error);
            Swal.fire({
              title: "Erro!",
              text: "Erro ao atualizar motorista. Tente novamente.",
              icon: "error",
              confirmButtonText: "Ok"
            });
          }
        });
      } else {
        // Criar novo motorista
        this.motoristaService.salvar(motoristaData).subscribe({
          next: (response: any) => {
            Swal.close();
            console.log(' Motorista criado:', response);
             Swal.fire({
              title: "Sucesso!",
              text: "Motorista cadastrado com sucesso",
              icon: "success",
              confirmButtonText: "Ok"
            });

            this.motoristaSalvo.emit();
            this.limparFormulario();
          },
          error: (error) => {
            Swal.close();
            console.error(' Erro ao salvar motorista:', error);
            Swal.fire({
              title: "Erro!",
              text: "Erro ao cadastrar motorista. Tente novamente.",
              icon: "error",
              confirmButtonText: "Ok"
            });
          }
        });
      }
    } else {
      console.log(' Formulário inválido. Corrija os erros.');
    }
  }

  limparFormulario(): void {
    this.motoristaForm.reset();
    this.isEdit = false;
    this.motoristaParaEditar = undefined;
    Object.keys(this.motoristaForm.controls).forEach(key => {
      this.motoristaForm.get(key)?.markAsUntouched();
    });
  }

  cancelar(): void {
    this.fecharModal.emit();
    this.limparFormulario();
  }
}

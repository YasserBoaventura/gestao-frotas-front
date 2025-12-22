import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Motorista } from '../motorista';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatIcon } from "@angular/material/icon";
import { MotoristadetalisComponent } from "../motoristadetalis/motoristadetalis.component";
import { MdbModalRef, MdbModalService } from 'mdb-angular-ui-kit/modal';
import { MotoristaService } from '../motorista.service';
import Swal from 'sweetalert2';
import { timeout } from 'rxjs';

@Component({
  selector: 'app-motoristalist',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule, ReactiveFormsModule, MatIcon, MotoristadetalisComponent, FormsModule],
  templateUrl: './motoristalist.component.html',
  styleUrl: './motoristalist.component.css'
})
export class MotoristalistComponent implements OnInit {

  modalService = inject(MdbModalService);
  modalRef!: MdbModalRef<any>;

  @ViewChild("modalMotoristasDetalhes") modalMotoristasDetalhes!: TemplateRef<any>;

  serviceMotorista = inject(MotoristaService);

  // Lista dos motoristas
  lista: Motorista[] = [];
  listaFiltrada: Motorista[] = [];
  motoristaForm!: FormGroup;
  isEdit = false;
  selectedMotorista?: Motorista;

  // Propriedades para pesquisa
  termoPesquisa: string = '';
  pesquisando: boolean = false;
  pesquisaRealizada: boolean = false;
  carregando: boolean = true; // Adicionado estado de carregamento

  categoriasHabilitacao = ['A', 'B', 'C', 'D', 'E'];
//implementar status do mo
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  ngOnInit(): void {
    console.log('🚀 ngOnInit - Iniciando componente');
    this.motoristaForm = this.createForm();
    this.loadMotoristas();
  }

  createForm(): FormGroup {
    return this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      numeroCarta: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      telefone: ['', [Validators.required]],
      dataNascimento: ['', [Validators.required]],
      categoriaHabilitacao: ['', [Validators.required]]


    });
  }

  loadMotoristas(): void {
    console.log('📥 Carregando motoristas...');
    this.carregando = true;

    this.serviceMotorista.getMotoristas().subscribe({
      next: lista => {
        console.log(' Motoristas recebidos do backend:', lista);
        this.lista = lista || [];
        this.listaFiltrada = [...this.lista]; // Usar spread operator para criar nova referência
        this.carregando = false;
        console.log(' Motoristas carregados:', this.lista.length);
        console.log(' Lista filtrada:', this.listaFiltrada.length);
      },
      error: erro => {
        console.error(' Erro ao carregar motoristas:', erro);
        this.carregando = false;
        this.lista = [];
        this.listaFiltrada = [];

        Swal.fire({
          title: "Erro",
          text: "Erro ao carregar lista de motoristas",
          icon: "error",
          confirmButtonText: "Ok"
        });
      }
    });
  }

  // Método para pesquisar motoristas pelo nome
  pesquisarMotoristas(): void {
    if (!this.termoPesquisa || this.termoPesquisa.trim().length ===0) {
      this.listaFiltrada = [...this.lista];
      this.pesquisaRealizada = false;
      return;
    }

    this.pesquisando = true;
    this.pesquisaRealizada = true;

    console.log(' Pesquisando motoristas por:', this.termoPesquisa);

    this.serviceMotorista.findByNome(this.termoPesquisa).subscribe({
      next: (motoristas: Motorista[]) => {
        console.log(' Resultado da pesquisa:', motoristas);
        this.listaFiltrada = motoristas || [];
        this.pesquisando = false;
        console.log(' Motoristas encontrados:', this.listaFiltrada.length);
      },
      error: (erro) => {
        console.error(' Erro ao pesquisar motoristas:', erro);
        this.pesquisando = false;
        this.listaFiltrada = [];
        Swal.fire({
          title: "Erro",
          text: "Erro ao pesquisar motoristas",
          icon: "error",
          confirmButtonText: "Ok"
        });
      }
    });
  }

  // Pesquisa em tempo real com debounce
  onPesquisaChange(): void {
    if (!this.termoPesquisa || this.termoPesquisa.trim().length === 0) {
      this.listaFiltrada = [...this.lista];
      this.pesquisaRealizada = false;
      return;
    }

    if (this.termoPesquisa.trim().length != null) {
      // Adicionar um pequeno delay para evitar muitas requisições


         this.pesquisarMotoristas();

    }
  }

  // Limpar pesquisa
  limparPesquisa(): void {
    this.termoPesquisa = '';
    this.listaFiltrada = [...this.lista];
    this.pesquisaRealizada = false;

  }

  openModal(motorista?: Motorista): void {
    console.log('🔵 ABRIR MODAL - Clique funcionando!', motorista);

    if (motorista) {
      this.isEdit = true;
      this.selectedMotorista = motorista;
    } else {
      this.isEdit = false;
      this.selectedMotorista = undefined;
    }

    this.modalRef = this.modalService.open(this.modalMotoristasDetalhes, {
      modalClass: 'modal-lg'
    });

    // Recarregar a lista quando o modal fechar
    this.modalRef.onClose.subscribe(() => {
      console.log('🔄 Modal fechado, recarregando lista...');
      this.loadMotoristas();
    });
  }

  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
    }
    this.motoristaForm.reset();
    this.isEdit = false;
    this.selectedMotorista = undefined;
  }

  deleteMotorista(motorista: Motorista): void {
    Swal.fire({
      title: 'Tem certeza?',
      text: `Deseja eliminar o motorista ${motorista.nome}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, eliminar!',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.serviceMotorista.eliminar(motorista.id!).subscribe({
          next: (response: any) => {
            // Atualizar ambas as listas
            this.lista = this.lista.filter(m => m.id !== motorista.id);
            this.listaFiltrada = this.listaFiltrada.filter(m => m.id !== motorista.id);

            this.snackBar.open('Motorista eliminado com sucesso!', 'Fechar', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top'
            });
            console.log(' Resposta do backend:', response);
          },
          error: (erro) => {
            console.error(' Erro ao eliminar motorista:', erro);
            let mensagemErro = "Erro ao eliminar motorista";
            if (erro.error && typeof erro.error === 'string') {
              mensagemErro = erro.error;
            } else if (erro.message) {
              mensagemErro = erro.message;
            }
            Swal.fire({
              title: "Erro",
              text: mensagemErro,
              icon: "error",
              confirmButtonText: "Ok"
            });
          }
        });
      }
    });
  }

  editar(motorista: Motorista) {
    this.openModal(motorista);
  }

  formatarData(data: string): string {
    if (!data) return 'N/A';
    try {
      return new Date(data).toLocaleDateString('pt-PT');
    } catch (error) {
      return 'Data inválida';
    }
  }

  getCategoriaClass(categoria: string): string {
    if (!categoria) return 'categoria-badge cat-unknown';
    return `categoria-badge cat-${categoria.toLowerCase()}`;
  }

  // Método para obter a descrição da categoria


  // Método para recarregar manualmente (útil para debugging)
  recarregarLista(): void {
    console.log(' Recarregando lista manualmente...');
    this.loadMotoristas();
  }



}

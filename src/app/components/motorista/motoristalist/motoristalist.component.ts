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
import { Router } from '@angular/router';

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
  router = inject(Router);

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
  carregando: boolean = true;

  // Propriedades para filtros
  filtroCategoria: string = '';
  filtroStatus: string = '';
  categoriasDisponiveis: string[] = [];

  categoriasHabilitacao = ['A', 'B', 'C', 'D', 'E'];

  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private timeoutId: any;

  ngOnInit(): void {
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

  //MÉTODOS DE ESTATÍSTICAS

  getMotoristasAtivos(): number {
    return this.lista.filter(m => m.statusMotorista === 'ATIVO').length;
  }

  getMotoristasInativos(): number {
    return this.lista.filter(m => m.statusMotorista == 'INATIVO').length;
  }

  getCategoriasUnicas(): number {
    const categorias = new Set(this.lista.map(m => m.categoriaHabilitacao).filter(c => c));
    return categorias.size;
  }

  // ===== MÉTODOS DE CARREGAMENTO =====

  loadMotoristas(): void {
    this.carregando = true;

    this.serviceMotorista.getMotoristas().subscribe({
      next: lista => {
        this.lista = lista || [];
        this.categoriasDisponiveis = [...new Set(this.lista.map(m => m.categoriaHabilitacao!).filter(c => c))];
        this.aplicarFiltros();
        this.carregando = false;
      },
      error: erro => {
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

  // ===== MÉTODOS DE FILTRO =====

  aplicarFiltros(): void {
    let filtrados = [...this.lista];

    if (this.termoPesquisa && this.termoPesquisa.trim().length >= 2) {
      const termo = this.termoPesquisa.toLowerCase().trim();
      filtrados = filtrados.filter(m =>
        (m.nome?.toLowerCase().includes(termo) ?? false) ||
        (m.email?.toLowerCase().includes(termo) ?? false) ||
        (m.numeroCarta?.toLowerCase().includes(termo) ?? false) ||
        (m.telefone?.includes(termo) ?? false)
      );
      this.pesquisaRealizada = true;
    } else {
      this.pesquisaRealizada = false;
    }

    if (this.filtroCategoria) {
      filtrados = filtrados.filter(m => m.categoriaHabilitacao === this.filtroCategoria);
    }

    if (this.filtroStatus) {
      filtrados = filtrados.filter(m => m.statusMotorista === this.filtroStatus);
    }

    this.listaFiltrada = filtrados;
  }

  onPesquisaChange(): void {
    if (!this.termoPesquisa || this.termoPesquisa.trim().length < 2) {
      this.pesquisaRealizada = false;
      this.aplicarFiltros();
      return;
    }

    this.pesquisando = true;
    this.pesquisaRealizada = true;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => {
      this.aplicarFiltros();
      this.pesquisando = false;
    }, 300);
  }

  limparPesquisa(): void {
    this.termoPesquisa = '';
    this.filtroCategoria = '';
    this.filtroStatus = '';
    this.pesquisaRealizada = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.listaFiltrada = [...this.lista];
  }

  // ===== MÉTODOS DE MODAL =====

  openModal(motorista?: Motorista): void {
    
    if (motorista) {
      this.isEdit = true;
      this.selectedMotorista = motorista;
    } else {
      this.isEdit = false;
      this.selectedMotorista = undefined;
    }

    // Abrir modal com MdbModalService
    this.modalRef = this.modalService.open(this.modalMotoristasDetalhes, {
      modalClass: 'modal-lg'
    });

    // Recarregar a lista quando o modal fechar
    this.modalRef.onClose.subscribe(() => {
      this.loadMotoristas();
      this.isEdit = false;
      this.selectedMotorista = undefined;
    });
  }

  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
    }
    this.isEdit = false;
    this.selectedMotorista = undefined;
    this.motoristaForm.reset();
  }

  // ===== MÉTODOS DE CRUD =====

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
            this.lista = this.lista.filter(m => m.id !== motorista.id);
            this.listaFiltrada = this.listaFiltrada.filter(m => m.id !== motorista.id);
            this.categoriasDisponiveis = [...new Set(this.lista.map(m => m.categoriaHabilitacao!).filter(c => c))];

            this.snackBar.open('Motorista eliminado com sucesso!', 'Fechar', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top'
            });
          },
          error: (erro) => {
            console.error(' Erro ao eliminar motorista:', erro);
            Swal.fire({
              title: "Erro",
              text: "Erro ao eliminar motorista",
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

  // ===== MÉTODOS UTILITÁRIOS =====

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

  getStatusClass(status: string): string {
    if (!status) return 'badge bg-secondary';
    return `badge bg-${status === 'ATIVO' ? 'success' : 'secondary'}`;
  }

  navegarPara(path: string): void {
    this.router.navigate([path]);
  }

  recarregarLista(): void {

    this.loadMotoristas();
  }
}

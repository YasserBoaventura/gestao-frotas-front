import { Component } from '@angular/core';
import { Rotas } from '../rotas';
import Swal from 'sweetalert2';
import { RotasServiceService } from '../rotas-service.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rotas-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rotas-list.component.html',
  styleUrl: './rotas-list.component.css'
})
export class RotasListComponent {

   rotas: Rotas[] = [];
  rotaSelecionada: Rotas = new Rotas();
  modoEdicao = false;
  mostrarModal = false;

  // Filtros
  filtro = {
    origem: '',
    destino: ''
  };

  constructor(private rotaService: RotasServiceService) {}

  ngOnInit(): void {
    this.carregarRotas();
  }

  carregarRotas(): void {
    this.rotaService.getAll().subscribe({
      next: (data) => {
        this.rotas = data;
      },
      error: (error) => {
        Swal.fire('Erro!', 'Erro ao carregar rotas.', 'error');
        console.error(error);
      }
    });
  }

  abrirModalCriar(): void {
    this.rotaSelecionada = new Rotas();
    this.modoEdicao = false;
    this.mostrarModal = true;
    this.salvarRota();
  }

  abrirModalEditar(rota: Rotas): void {
    this.rotaSelecionada = { ...rota };
    this.modoEdicao = true;
    this.mostrarModal = true;
  }

  salvarRota(): void {
    if (!this.validarFormulario()) {
      return;
    }

    const operacao = this.modoEdicao
      ? this.rotaService.update(this.rotaSelecionada,this.rotaSelecionada.id!)
      : this.rotaService.create(this.rotaSelecionada);

    operacao.subscribe({
      next: () => {
        Swal.fire('Sucesso!', `Rota ${this.modoEdicao ? 'atualizada' : 'criada'} com sucesso.`, 'success');
        this.carregarRotas();
        this.fecharModal();
      },
      error: (error) => {
        Swal.fire('Erro!', 'Erro ao salvar rota.', 'error');
        console.error(error);
      }
    });
  }

  excluirRota(id: number): void {
    Swal.fire({
      title: 'Tem certeza?',
      text: 'Esta ação não pode ser desfeita!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.rotaService.delete(id).subscribe({
          next: (response) => {
            Swal.fire(response);
            this.carregarRotas();
          },
          error: (error) => {
            Swal.fire('Erro!', 'Erro ao excluir rota.', 'error');
            console.error(error);
          }
        });
      }
    });
  }

  fecharModal(): void {
    this.mostrarModal = false;
    this.rotaSelecionada = new Rotas();
  }

  private validarFormulario(): boolean {
    if (!this.rotaSelecionada.origem.trim()) {
      Swal.fire('Atenção!', 'O campo Origem é obrigatório.', 'warning');
      return false;
    }

    if (!this.rotaSelecionada.destino.trim()) {
      Swal.fire('Atenção!', 'O campo Destino é obrigatório.', 'warning');
      return false;
    }

    if (this.rotaSelecionada.distanciaKm <= 0) {
      Swal.fire('Atenção!', 'A distância deve ser maior que zero.', 'warning');
      return false;
    }

    if (this.rotaSelecionada.tempoEstimadoHoras <= 0) {
      Swal.fire('Atenção!', 'O tempo estimado deve ser maior que zero.', 'warning');
      return false;
    }

    return true;
  }

  get rotasFiltradas(): Rotas[] {
    return this.rotas.filter(rota => {
      const origemMatch = !this.filtro.origem ||
        rota.origem.toLowerCase().includes(this.filtro.origem.toLowerCase());
      const destinoMatch = !this.filtro.destino ||
        rota.destino.toLowerCase().includes(this.filtro.destino.toLowerCase());
      return origemMatch && destinoMatch;
    });
  }


  // Adicione estas funções ao seu component.ts

// Métodos auxiliares para as estatísticas
getTotalViagensAtivas(): number {
  return this.rotas?.reduce((total, rota) => total + (rota.distanciaKm || 0), 0) || 0;

}

getDistanciaTotal(): number {
  return this.rotas?.reduce((total, rota) => total + (rota.distanciaKm || 0), 0) || 0;
}

getTempoTotal(): number {
  return this.rotas?.reduce((total, rota) => total + (rota.tempoEstimadoHoras || 0), 0) || 0;
}

// Métodos para seleção múltipla
rotasSelecionadas: number[] = [];

isSelecionada(id: number): boolean {
  return this.rotasSelecionadas.includes(id);
}

toggleSelecao(id: number): void {
  const index = this.rotasSelecionadas.indexOf(id);
  if (index === -1) {
    this.rotasSelecionadas.push(id);
  } else {
    this.rotasSelecionadas.splice(index, 1);
  }
}

selecionarTodos(event: any): void {
  if (event.target.checked) {
    this.rotasSelecionadas = this.rotasFiltradas.map(r => r.id!);
  } else {
    this.rotasSelecionadas = [];
  }
}

// Métodos extras
limparFiltros(): void {
  this.filtro = {
    origem: '',
    destino: '',

  };
}

visualizarRota(rota: Rotas): void {
  // Implemente a visualização detalhada
  console.log('Visualizar rota:', rota);
}

exportarParaCSV(): void {
  // Implemente exportação para CSV
  console.log('Exportar rotas');
}

getViagensBadgeClass(viagens: number): string {
  if (viagens === 0) return 'viagens-badge viagens-0';
  if (viagens >= 1 && viagens <= 5) return 'viagens-badge viagens-1-5';
  if (viagens >= 6 && viagens <= 10) return 'viagens-badge viagens-6-10';
  return 'viagens-badge viagens-11';
}
}

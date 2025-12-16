import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { UsuarioserviceService } from '../usuarioservice.service';
import { Usuarios } from '../../auth/usuario';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
  ],
  templateUrl: './usuario-list.component.html',
  styleUrls: ['./usuario-list.component.css']
})
export class UsuarioListComponent implements OnInit {
  // Dados
  usuarios: Usuarios[] = [];

  // Tabela Material
  dataSource = new MatTableDataSource<Usuarios>([]);
  colunasExibidas: string[] = [
    'id',
    'username',
    'email',
    'role',
    'telefone',
    'nuit',
    'ativo',
    'contaBloqueada',
    'acoes'
  ];

  // Filtros
  filtroBusca = '';
  filtroRole = 'TODOS';
  filtroAtivo = 'TODOS';

  // Estatísticas
  totalUsuarios = 0;
  usuariosAtivos = 0;
  administradores = 0;

  // Estados

  erro: string | null = null;
  editando = false;
  usuarioSelecionado: Usuarios | null = null;

  // Paginação
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private usuarioService: UsuarioserviceService
  ) {}

  ngOnInit(): void {
    this.carregarUsuarios();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  // ========== MÉTODOS PRINCIPAIS ==========

  // 1. Carregar usuários
  carregarUsuarios(): void {

    this.erro = null;

    this.usuarioService.getTodosUsuarios().subscribe({
      next: (usuarios: Usuarios[]) => {
        this.usuarios = usuarios;
        this.dataSource.data = usuarios;
        this.calcularEstatisticas();
        this.aplicarFiltros();

      },
      error: (error) => {
        console.error('Erro ao carregar usuários:', error);
        this.erro = 'Não foi possível carregar a lista de usuários.';

        this.mostrarErro(this.erro);
      }
    });
  }

  // 2. Aplicar filtros
  aplicarFiltros(): void {
    let filtrados = [...this.usuarios];

    // Filtrar por busca
    if (this.filtroBusca.trim()) {
      const busca = this.filtroBusca.toLowerCase().trim();
      filtrados = filtrados.filter(usuario =>
        (usuario.username?.toLowerCase().includes(busca) ?? false) ||
        (usuario.email?.toLowerCase().includes(busca) ?? false) ||
        (usuario.nuit?.includes(busca) ?? false) ||
        (usuario.telefone?.includes(busca) ?? false)
      );
    }

    // Filtrar por cargo
    if (this.filtroRole !== 'TODOS') {
      filtrados = filtrados.filter(usuario => usuario.role === this.filtroRole);
    }

    // Filtrar por status ativo
    if (this.filtroAtivo !== 'TODOS') {
      const ativo = this.filtroAtivo === 'ATIVO';
      filtrados = filtrados.filter(usuario => usuario.ativo === ativo);
    }

    // Atualizar dataSource
    this.dataSource.data = filtrados;
  }

  // 3. Limpar filtros
  limparFiltros(): void {
    this.filtroBusca = '';
    this.filtroRole = 'TODOS';
    this.filtroAtivo = 'TODOS';
    this.aplicarFiltros();
  }

  // ========== AÇÕES DOS BOTÕES ==========

  // 1. Abrir edição (Novo ou Editar)
  abrirEdicao(usuario?: any): void {
    if (usuario) {
      this.usuarioSelecionado = { ...usuario };
    } else {
      this.usuarioSelecionado = {
        id: 0,
        username: '',
        email: '',
        role: 'USER',
        telefone: '',
        nuit: '',
        ativo: true,
        contaBloqueada: false
      } as Usuarios;
    }
    this.editando = true;
  }

  // 2. Fechar edição
  fecharEdicao(): void {
    this.editando = false;
    this.usuarioSelecionado = null;
  }

  // 3. Salvar usuário
  salvarUsuario(): void {
    if (!this.validarUsuario()) {
      return;
    }



    if (this.usuarioSelecionado?.id && this.usuarioSelecionado.id > 0) {
      // Atualizar
      this.usuarioService.atualizarUsuario(
        this.usuarioSelecionado.id,
        this.usuarioSelecionado
      ).subscribe({
        next: (usuarioAtualizado) => {
          this.atualizarUsuarioNaLista(usuarioAtualizado);
          this.mostrarSucesso('Usuário atualizado com sucesso!');
          this.fecharEdicao();
        },
        error: (error) => this.tratarErro('atualizar', error)
      });
    } else {
      // Criar novo
      this.usuarioService.criarUsuario(this.usuarioSelecionado!).subscribe({
        next: (novoUsuario) => {

          this.dataSource.data = this.usuarios;
          this.calcularEstatisticas();
          this.mostrarSucesso('Usuário criado com sucesso!');
          this.fecharEdicao();
        },
        error: (error) => this.tratarErro('criar', error)
      });
    }
  }

  // 4. Editar usuário
  editarUsuario(usuario: Usuarios): void {
    this.abrirEdicao(usuario);
  }

  // 5. Ativar/Desativar usuário
  ativarDesativar(usuario: Usuarios): void {
    const novoEstado = !usuario.ativo;
    const acao = novoEstado ? 'ativar' : 'desativar';

    Swal.fire({
      title: 'Tem certeza?',
      text: `Deseja ${acao} o usuário ${usuario.username}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: `Sim, ${acao}!`,
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.usuarioService.toggleAtivo(usuario.id, novoEstado).subscribe({
          next: () => {
            usuario.ativo = novoEstado;
            this.atualizarUsuarioNaLista(usuario);
            this.mostrarSucesso(`Usuário ${acao}do com sucesso!`);
          },
          error: (error) => this.tratarErro(acao, error)
        });
      }
    });
  }

  // 6. Bloquear/Desbloquear usuário
  bloquearDesbloquear(usuario: Usuarios): void {
    const novoEstado = !usuario.contaBloqueada;
    const acao = novoEstado ? 'bloquear' : 'desbloquear';

    Swal.fire({
      title: 'Tem certeza?',
      text: `Deseja ${acao} a conta do usuário ${usuario.username}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: `Sim, ${acao}!`,
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.usuarioService.toggleBloqueio(usuario.id, novoEstado).subscribe({
          next: () => {
            usuario.contaBloqueada = novoEstado;
            this.atualizarUsuarioNaLista(usuario);
            this.mostrarSucesso(`Conta ${acao}da com sucesso!`);
          },
          error: (error) => this.tratarErro(acao, error)
        });
      }
    });
  }

  // 7. Resetar senha
  resetarSenha(usuario: Usuarios): void {
    Swal.fire({
      title: 'Resetar Senha',
      text: `Deseja resetar a senha do usuário ${usuario.username}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sim, resetar!',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.usuarioService.resetarSenha(usuario.id).subscribe({
          next: () => {
            this.mostrarSucesso('Email de reset de senha enviado!');
          },
          error: (error) => this.tratarErro('resetar senha', error)
        });
      }
    });
  }

  // 8. Excluir usuário
  excluirUsuario(usuario: Usuarios): void {
    if (usuario.role === 'ADMIN') {
      this.mostrarAviso('Não é possível excluir administradores');
      return;
    }

    Swal.fire({
      title: 'Tem certeza?',
      text: `Esta ação não pode ser desfeita! O usuário ${usuario.username} será excluído permanentemente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.usuarioService.excluirUsuario(usuario.id).subscribe({
          next: () => {
            this.usuarios = this.usuarios.filter(u => u.id !== usuario.id);
            this.dataSource.data = this.usuarios;
            this.calcularEstatisticas();
            this.mostrarSucesso('Usuário excluído com sucesso!');
          },
          error: (error) => this.tratarErro('excluir', error)
        });
      }
    });
  }

  // ========== MÉTODOS AUXILIARES ==========

  // Calcular estatísticas
  calcularEstatisticas(): void {
    this.totalUsuarios = this.usuarios.length;
    this.usuariosAtivos = this.usuarios.filter(u => u.ativo).length;
    this.administradores = this.usuarios.filter(u => u.role === 'ADMIN').length;
  }

  // Atualizar usuário na lista
  private atualizarUsuarioNaLista(usuarioAtualizado: Usuarios): void {
    const index = this.usuarios.findIndex(u => u.id === usuarioAtualizado.id);
    if (index !== -1) {
      this.usuarios[index] = usuarioAtualizado;
      this.dataSource.data = this.usuarios;
      this.calcularEstatisticas();
    }
  }

  // Validação do usuário
  private validarUsuario(): boolean {
    if (!this.usuarioSelecionado) return false;

    if (!this.usuarioSelecionado.username?.trim()) {
      this.mostrarAviso('O campo Username é obrigatório');
      return false;
    }

    if (!this.usuarioSelecionado.email?.trim()) {
      this.mostrarAviso('O campo Email é obrigatório');
      return false;
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.usuarioSelecionado.email)) {
      this.mostrarAviso('Email inválido');
      return false;
    }

    return true;
  }

  // Métodos de notificação
  private mostrarSucesso(mensagem: string): void {
    Swal.fire({
      icon: 'success',
      title: 'Sucesso!',
      text: mensagem,
      timer: 3000,
      showConfirmButton: false
    });
  }

  private mostrarErro(mensagem: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Erro!',
      text: mensagem,
      confirmButtonText: 'OK'
    });
  }

  private mostrarAviso(mensagem: string): void {
    Swal.fire({
      icon: 'warning',
      title: 'Atenção!',
      text: mensagem,
      confirmButtonText: 'OK'
    });
  }

  private tratarErro(acao: string, error: any): void {
    console.error(`Erro ao ${acao} usuário:`, error);
    let mensagem = `Erro ao ${acao} usuário`;

    if (error.status === 409) {
      mensagem = 'Username ou email já existem';
    } else if (error.status === 400) {
      mensagem = 'Dados inválidos';
    } else if (error.status === 404) {
      mensagem = 'Usuário não encontrado';
    } else if (error.status === 403) {
      mensagem = 'Permissão negada';
    }

    this.mostrarErro(mensagem);

  }

  // Métodos para CSS (removidos se não forem usados no Bootstrap)
}

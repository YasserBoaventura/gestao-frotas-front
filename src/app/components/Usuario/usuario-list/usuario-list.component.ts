import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

// Serviço
import { UsuarioserviceService } from '../usuarioservice.service';
import { Usuarios } from '../../auth/usuario';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    // Angular Material
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatDividerModule,
    MatChipsModule,
  ],
  templateUrl: './usuario-list.component.html',
  styleUrls: ['./usuario-list.component.css']
})
export class UsuarioListComponent implements OnInit, OnDestroy {
  // Lista de usuários
  usuarios: Usuarios[] = [];
  usuariosFiltrados: Usuarios[] = [];

  // Configuração da tabela
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

  dataSource = new MatTableDataSource<Usuarios>([]);

  // Filtros
  filtroBusca = '';
  filtroRole = 'TODOS';
  filtroAtivo = 'TODOS';

  // Estatísticas
  totalUsuarios = 0;
  usuariosAtivos = 0;
  administradores = 0;

  // Estados
  carregando = false;
  erro = '';
  editando = false;
  usuarioEditando: Usuarios | null = null;

  // Formulário de edição
  usuarioForm: FormGroup;

  private destroy$ = new Subject<void>();

  // Paginação
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private usuarioService: UsuarioserviceService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    // Inicializar formulário
    this.usuarioForm = this.fb.group({
      id: [0],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['USER', [Validators.required]],
      telefone: ['', [Validators.pattern('^[0-9+]*$')]],
      nuit: [''],
      ativo: [true],
      contaBloqueada: [false]
    });
  }

  ngOnInit(): void {
    this.carregarUsuarios();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Carregar usuários do servidor
  carregarUsuarios(): void {
    this.carregando = true;
    this.erro = '';

    this.usuarioService.getTodosUsuarios()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (usuarios: Usuarios[]) => {
          this.usuarios = usuarios;
          this.calcularEstatisticas();
          this.aplicarFiltros();
          this.carregando = false;
        },
        error: (error) => {
          console.error('Erro ao carregar usuários:', error);
          this.erro = 'Não foi possível carregar a lista de usuários.';
          this.carregando = false;
          this.snackBar.open(this.erro, 'Fechar', {
            duration: 5000,
            panelClass: ['snackbar-error']
          });
        }
      });
  }

  // Calcular estatísticas
  calcularEstatisticas(): void {
    this.totalUsuarios = this.usuarios.length;
    this.usuariosAtivos = this.usuarios.filter(u => u.ativo).length;
    this.administradores = this.usuarios.filter(u => u.role === 'ADMIN').length;
  }

  // Aplicar filtros
  aplicarFiltros(): void {
    let filtrados = [...this.usuarios];

    // Filtrar por busca
    if (this.filtroBusca.trim()) {
      const busca = this.filtroBusca.toLowerCase().trim();
      filtrados = filtrados.filter(usuario =>
        (usuario.username?.toLowerCase().includes(busca) ?? false) ||
        (usuario.email?.toLowerCase().includes(busca) ?? false) ||
        (usuario.nuit?.toLowerCase().includes(busca) ?? false) ||
        (usuario.telefone?.toLowerCase().includes(busca) ?? false)
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

    this.usuariosFiltrados = filtrados;
    this.dataSource.data = filtrados;

    // Resetar paginação se necessário
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  // Abrir formulário de edição
  abrirEdicao(usuario?: Usuarios): void {
    if (usuario) {
      // Editar usuário existente
      this.usuarioEditando = usuario;
      this.usuarioForm.patchValue(usuario);
    } else {
      // Novo usuário
      this.usuarioEditando = null;
      this.usuarioForm.reset({
        role: 'USER',
        ativo: true,
        contaBloqueada: false
      });
    }
    this.editando = true;
  }

  // Fechar formulário
  fecharEdicao(): void {
    this.editando = false;
    this.usuarioEditando = null;
    this.usuarioForm.reset();
  }

  // Salvar usuário
  salvarUsuario(): void {
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

    const usuarioData = this.usuarioForm.value;
    const acao = this.usuarioEditando ? 'atualizado' : 'criado';

    this.carregando = true;

    if (this.usuarioEditando) {
      // Atualizar usuário existente
      this.usuarioService.atualizarUsuario(usuarioData.id, usuarioData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (usuarioAtualizado) => {
            // Atualizar na lista
            const index = this.usuarios.findIndex(u => u.id === usuarioAtualizado.id);
            if (index !== -1) {
              this.usuarios[index] = usuarioAtualizado;
            }
            this.finalizarSalvamento(acao, usuarioAtualizado);
          },
          error: (error) => this.tratarErroSalvamento(acao, error)
        });
    } else {
      // Criar novo usuário
      this.usuarioService.criarUsuario(usuarioData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: novoUsuario => {
       
          },
          error: (error) => this.tratarErroSalvamento(acao, error)
        });
    }
  }

  private finalizarSalvamento(acao: string, usuario: Usuarios): void {
    this.calcularEstatisticas();
    this.aplicarFiltros();
    this.fecharEdicao();
    this.carregando = false;

    this.snackBar.open(`Usuário ${acao} com sucesso!`, 'Fechar', {
      duration: 3000,
      panelClass: ['snackbar-success']
    });
  }

  private tratarErroSalvamento(acao: string, error: any): void {
    console.error(`Erro ao ${acao} usuário:`, error);
    this.carregando = false;

    let mensagemErro = `Erro ao ${acao} usuário`;
    if (error.status === 409) {
      mensagemErro = 'Username ou email já existem';
    } else if (error.status === 400) {
      mensagemErro = 'Dados inválidos';
    }

    this.snackBar.open(mensagemErro, 'Fechar', {
      duration: 5000,
      panelClass: ['snackbar-error']
    });
  }

  // Ações da tabela
  ativarDesativar(usuario: Usuarios): void {
    const novoStatus = !usuario.ativo;
    const acao = novoStatus ? 'ativar' : 'desativar';

    if (confirm(`Deseja ${acao} o usuário ${usuario.username}?`)) {
      this.usuarioService.toggleAtivo(usuario.id, novoStatus)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            usuario.ativo = novoStatus;
            this.calcularEstatisticas();
            this.aplicarFiltros();
            this.snackBar.open(`Usuário ${acao}do com sucesso!`, 'Fechar', {
              duration: 3000,
              panelClass: ['snackbar-success']
            });
          },
          error: (error) => this.tratarErroAcao(acao, error)
        });
    }
  }

  bloquearDesbloquear(usuario: Usuarios): void {
    const novoStatus = !usuario.contaBloqueada;
    const acao = novoStatus ? 'bloquear' : 'desbloquear';

    if (confirm(`Deseja ${acao} a conta do usuário ${usuario.username}?`)) {
      this.usuarioService.toggleBloqueio(usuario.id, novoStatus)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            usuario.contaBloqueada = novoStatus;
            this.aplicarFiltros();
            this.snackBar.open(`Conta ${acao}da com sucesso!`, 'Fechar', {
              duration: 3000,
              panelClass: ['snackbar-success']
            });
          },
          error: (error) => this.tratarErroAcao(acao, error)
        });
    }
  }

  editarUsuario(usuario: Usuarios): void {
    this.abrirEdicao(usuario);
  }

  excluirUsuario(usuario: Usuarios): void {
    // Não permitir excluir administradores
    if (usuario.role === 'ADMIN') {
      this.snackBar.open('Não é possível excluir administradores', 'Fechar', {
        duration: 3000,
        panelClass: ['snackbar-warning']
      });
      return;
    }

    if (confirm(`Tem certeza que deseja excluir o usuário ${usuario.username}? Esta ação não pode ser desfeita.`)) {
      this.usuarioService.excluirUsuario(usuario.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // Remover da lista
            this.usuarios = this.usuarios.filter(u => u.id !== usuario.id);
            this.calcularEstatisticas();
            this.aplicarFiltros();
            this.snackBar.open('Usuário excluído com sucesso!', 'Fechar', {
              duration: 3000,
              panelClass: ['snackbar-success']
            });
          },
          error: (error) => this.tratarErroAcao('excluir', error)
        });
    }
  }

  resetarSenha(usuario: Usuarios): void {
    if (confirm(`Deseja resetar a senha do usuário ${usuario.username}? Um email será enviado com instruções.`)) {
      this.usuarioService.resetarSenha(usuario.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('Email de reset de senha enviado!', 'Fechar', {
              duration: 3000,
              panelClass: ['snackbar-success']
            });
          },
          error: (error) => this.tratarErroAcao('resetar senha', error)
        });
    }
  }

  private tratarErroAcao(acao: string, error: any): void {
    console.error(`Erro ao ${acao} usuário:`, error);
    this.snackBar.open(`Erro ao ${acao} usuário`, 'Fechar', {
      duration: 3000,
      panelClass: ['snackbar-error']
    });
  }

  // Utilitários
  getStatusIcon(ativo: boolean): string {
    return ativo ? 'check_circle' : 'cancel';
  }

  getStatusColor(ativo: boolean): string {
    return ativo ? 'primary' : 'warn';
  }

  getBlockIcon(bloqueado: boolean): string {
    return bloqueado ? 'lock' : 'lock_open';
  }

  getBlockColor(bloqueado: boolean): string {
    return bloqueado ? 'warn' : 'basic';
  }

  // Limpar filtros
  limparFiltros(): void {
    this.filtroBusca = '';
    this.filtroRole = 'TODOS';
    this.filtroAtivo = 'TODOS';
    this.aplicarFiltros();
  }

  // Verificar se campo é inválido
  campoInvalido(campo: string): boolean {
    const formControl = this.usuarioForm.get(campo);
    return formControl ? formControl.invalid && (formControl.dirty || formControl.touched) : false;
  }
}

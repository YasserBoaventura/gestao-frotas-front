import { Component } from '@angular/core';
import { TrocarSenhaServiceService } from '../trocar-senha-service.service';
import { Router } from '@angular/router';
import { TrocarSenhaDTO } from '../trocar-senha-dto';

import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-trocar-senha',
  standalone: true,
  imports: [ CommonModule, FormsModule],
  templateUrl: './trocar-senha.component.html',
  styleUrl: './trocar-senha.component.css'
})
export class TrocarSenhaComponent {

   trocarSenha: TrocarSenhaDTO = {
    username: '',
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  };

  mensagemSucesso: string | null = null;
  mensagemErro: string | null = null;
  carregando = false;

  mostrarSenhaAtual = false;
  mostrarNovaSenha = false;
  mostrarConfirmarSenha = false;

  constructor(
  private trocarSenhaService: TrocarSenhaServiceService,
    private router: Router
   ) {}

  get senhasDiferentes(): boolean {
    if (!this.trocarSenha.novaSenha || !this.trocarSenha.confirmarSenha) {
      return false;
    }
    return this.trocarSenha.novaSenha !== this.trocarSenha.confirmarSenha;
  }

  get forcaSenhaPorcentagem(): string {
    const forca = this.calcularForcaSenha(this.trocarSenha.novaSenha);
    return `${forca}%`;
  }

  get forcaSenhaClass(): string {
    const forca = this.calcularForcaSenha(this.trocarSenha.novaSenha);
    if (forca < 30) return 'bg-danger';
    if (forca < 70) return 'bg-warning';
    return 'bg-success';
  }

  get forcaSenhaTexto(): string {
    const forca = this.calcularForcaSenha(this.trocarSenha.novaSenha);
    if (forca < 30) return 'Senha fraca';
    if (forca < 70) return 'Senha média';
    return 'Senha forte';
  }

  private calcularForcaSenha(senha: string): number {
    if (!senha) return 0;

    let forca = 0;

    if (senha.length >= 6) forca += 20;
    if (senha.length >= 8) forca += 10;
    if (senha.length >= 10) forca += 10;
    if (/[A-Z]/.test(senha)) forca += 15;
    if (/[a-z]/.test(senha)) forca += 15;
    if (/[0-9]/.test(senha)) forca += 15;
    if (/[^A-Za-z0-9]/.test(senha)) forca += 15;

    return Math.min(forca, 100);
  }

  alterarSenha(): void {
    this.mensagemSucesso = null;
    this.mensagemErro = null;

    if (this.senhasDiferentes) {
      this.mensagemErro = 'A nova senha e a confirmação não conferem';
      return;
    }

    if (this.calcularForcaSenha(this.trocarSenha.novaSenha) < 30) {
      this.mensagemErro = 'A nova senha é muito fraca. Use uma senha mais forte.';
      return;
    }

    this.carregando = true;

    this.trocarSenhaService.alterarSenha(this.trocarSenha).subscribe({
      next: () => {
        this.mostrarSucesso("Senha alterada com sucesso! Faça login novamente.");
        this.carregando = false;
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.mensagemErro = error.error?.message || 'Erro ao alterar senha. Verifique seus dados.';
        this.carregando = false;
      }
    });
  }

  limparFormulario(): void {
    this.trocarSenha = {
      username: '',
      senhaAtual: '',
      novaSenha: '',
      confirmarSenha: ''
    };
    this.mensagemSucesso = null;
    this.mensagemErro = null;
  }

  private mostrarSucesso(mensagem: string): void {
      Swal.fire({
        icon: 'success',
        title: 'Sucesso!',
        text: mensagem,
        timer: 3000,
        showConfirmButton: false
      });
    }
}

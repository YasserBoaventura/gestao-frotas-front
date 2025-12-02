// auth/usuario.ts
export class Usuarios {
  id!: number;
  username!: string;
  password!: string;
  email!: string;
  role!: string;
  resetToken!: string;
  restTokenExpiry!: string;
  tokenUtilizado!: string;
  perguntaSeguranca!: string;
  respostaSeguranca!: string; // Corrigi o nome (era "respostaSegurancao")
  telefone!: string;
  nuit!: string;
  dataNascimento!: string;
  ativo!: boolean; // Mudei para boolean
  dataCriacao!: string;
  ultimoAcesso!: string;
  tentativasLogin!: number;
  contaBloqueada!: boolean; // Mudei para boolean

  // Método para criar um objeto seguro para exibição (sem dados sensíveis)
  toTableData(): any {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      role: this.role,
      telefone: this.telefone,
      nuit: this.nuit,
      dataNascimento: this.dataNascimento,
      ativo: this.ativo,
      dataCriacao: this.dataCriacao,
      ultimoAcesso: this.ultimoAcesso,
      tentativasLogin: this.tentativasLogin,
      contaBloqueada: this.contaBloqueada,
      perguntaSeguranca: this.perguntaSeguranca
      // NÃO inclui: password, resetToken, respostaSeguranca
    };
  }
}

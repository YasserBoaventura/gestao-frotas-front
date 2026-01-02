import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Usuarios } from '../auth/usuario';



@Injectable({
  providedIn: 'root'
})
export class UsuarioserviceService {
  private apiUrl="http://localhost:9001/api"
  constructor(private http:HttpClient) { }

  // Listar todos os usuários
  getTodosUsuarios(): Observable<Usuarios[]> {
    return this.http.get<Usuarios[]>(`${this.apiUrl}/findAll`);
  }

  // Buscar usuário por ID
  getUsuarioPorId(id: number): Observable<Usuarios> {
    return this.http.get<Usuarios>(`${this.apiUrl}/${id}`);
  }

  // Atualizar usuário
  atualizarUsuario(id: number, usuario: Usuarios): Observable<Usuarios> {
    return this.http.put<Usuarios>(`${this.apiUrl}/${id}`, usuario);
  }

  // Excluir usuário
  excluirUsuario(id: number): Observable<string>{
  return this.http.delete<string>(this.apiUrl+"/delete/"+id ,{responseType :'text' as 'json'});
}

  toggleAtivo(id: number, ativo: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/ativo/${id}`, { ativo });
  }

  // Bloquear/Desbloquear

  toggleBloqueio(id: number, bloqueado: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/bloqueio/${id}`, { bloqueado });
  } 
  // Resetar senha
  resetarSenha(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/reset-senha`, {});
  }
  criarUsuario(usuarioData: any):Observable<string>{
    return this.http.post<string>(`${this.apiUrl}/save`, {})
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { jwtDecode, JwtPayload } from "jwt-decode";
import { Login } from './login';

import { response } from 'express';
import { Usuarios } from './usuario';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  http = inject(HttpClient);
  API = "http://localhost:9001/api";


  constructor() { }

  logar(login: Login): Observable<string> {
    return this.http.post<string>(this.API+'/login', login, {responseType: 'text' as 'json'});
  }

  addToken(token: string) {
    localStorage.setItem('token', token);
  }

  removerToken() {
    localStorage.removeItem('token');
  }

  getToken() {
    return localStorage.getItem('token');
  }

  jwtDecode() {
    let token = this.getToken();
    if (token) {
      return jwtDecode<JwtPayload>(token);
    }
    return "";
  }

  hasRole(role: string) {
    let user = this.jwtDecode() as Usuarios;
    if (user.role == role)
      return true;
    else
      return false;
  }

  getUsuarioLogado() {
    return this.jwtDecode() as Usuarios;
  }
  // Método para registrar um novo usuário na AP
  autoCadastro(dados: any): Observable<any> {
    return this.http.post(`${this.API}/auto-cadastro`, dados ,
        { responseType: 'text' }
    );
  }
//Metodo para alter a senha do usuario // Método para validar usuário e email - COM responseType: 'text'
  validateUserForPasswordReset(validationData: any): Observable<any> {
    return this.http.post(
      `${this.API}/auth/solicitar-recuperacao`,
      validationData
    )
  }

  // Método para resetar senha - COM responseType: 'text'
  resetPassword(resetData: any): Observable<string> {
    return this.http.post(
      `${this.API}/auth/redefinir-senha-verificacao`,
      resetData,
      { responseType: 'text' }
    );
  }
} // Método para validar usuário e email



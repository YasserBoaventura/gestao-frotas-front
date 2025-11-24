import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { jwtDecode, JwtPayload } from "jwt-decode";
import { Login } from './login';
import { Usuario } from './usuario';
import { response } from 'express';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  http = inject(HttpClient);
  API = "http://localhost:9000/api";


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
    let user = this.jwtDecode() as Usuario;
    if (user.role == role)
      return true;
    else
      return false;
  }

  getUsuarioLogado() {
    return this.jwtDecode() as Usuario;
  }
  // Método para registrar um novo usuário na API
  register(user: any): Observable<string> {
    return this.http.post<string>(this.API + "/register", user, { responseType: 'text' as 'json'});
  }

//Metodo para alter a senha do usuario
requestPasswordReset(username: string): Observable<any> {
  return this.http.post(
    `${this.API}/password/request`,
    { username },  // Envia como JSON
    {
      responseType: 'text'
    }
  );
}

resetPassword(token: string, newPassword: string): Observable<any> {
  return this.http.post(
    `${this.API}/password/reset`,
    { token, newPassword },
    {
      responseType: 'text'
    }
  );
}
}

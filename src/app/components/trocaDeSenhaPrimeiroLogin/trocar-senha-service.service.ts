import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TrocarSenhaDTO } from '../trocar-senha-dto';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TrocarSenhaServiceService {
  private apiUrl = 'http://localhost:9001/api'; // Ajuste para sua URL

  constructor(private http: HttpClient) {}

  alterarSenha(dados: TrocarSenhaDTO): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/trocar-senha`, dados, {responseType: 'text' as 'json'});
  }

}

import { inject, Injectable } from '@angular/core';
import { Rotas } from './rotas';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class RotasServiceService {

  http = inject(HttpClient);
  constructor( ){

  }

   apiUrl="http://localhost:9001/api/rotas"
   delete(id: number): Observable<string> {
    return this.http.delete<string>(this.apiUrl+"/delete/"+id,{
      responseType: 'text'as 'json'
    });

  }
  getAll(): Observable<Rotas[]>{
    return this.http.get<Rotas[]>(this.apiUrl+ "/findAll");
  }
update(rotas: Rotas, id: number): Observable<string>{
  return this.http.put<string>(this.apiUrl+"/update/"+id , rotas,{responseType: 'text' as 'json'});

  }

create(rota: any): Observable<string> {
  return this.http.post<string>(this.apiUrl + "/save", rota, { responseType: 'text' as 'json'});
}



}

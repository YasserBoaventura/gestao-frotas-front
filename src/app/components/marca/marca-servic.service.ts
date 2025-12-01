import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
;
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Marca } from './marca';
@Injectable({
  providedIn: 'root'
})
export class MarcaServicService {

  constructor() { }

 API ="http://localhost:9001/api/marca"

  http = inject(HttpClient);


  findAll(): Observable<Marca[]> {
    return this.http.get<Marca[]>(`${this.API}/findAll`);
  }
delete(id: number): Observable<string>{
  return this.http.delete<string>(this.API+"/deleteById/"+id ,{responseType :'text' as 'json'});
}

save(marca: Marca): Observable<string> {
  return this.http.post<string>(this.API + "/save", marca, { responseType: 'text' as 'json'});
}


update(marca: Marca, id: number): Observable<string>{
  return this.http.put<string>(this.API+"/update/"+id , marca,{responseType: 'text' as 'json'});
}
findById(id: number): Observable<Marca>{
  return this.http.get<Marca>(this.API+"/findById/"+id);
}


}

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { Input } from '@angular/core';
import { Marca, Veiculo } from '../../Veiculos/veiculos.model';
import { Output , EventEmitter } from '@angular/core';
import { MarcaServicService } from '../marca-servic.service';
import Swal from 'sweetalert2'
import { MdbFormsModule } from 'mdb-angular-ui-kit/forms';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-marcadetalhes',
  standalone: true,
  imports: [MdbFormsModule,
          FormsModule,      // 👈 necessário para ngModel
          MdbFormsModule,MatIconModule],
  templateUrl: './marcadetalhes.component.html',
  styleUrl: './marcadetalhes.component.css'
})
export class MarcadetalhesComponent {

  router= inject(Router);
  
    lista: Marca[]=[];
    veiculo: Veiculo=new Veiculo();
MarcaService= inject(MarcaServicService)

  @Input('marca') marca: Marca= new Marca(); ;
  @Output('retorno') retorno =new EventEmitter<Marca>();


  save(){
    if (!this.marca || this.marca.nome.trim() === '') {
        Swal.fire({
      title: 'Error!',
      text: 'Por Favor prencha os campos',
      icon: 'error',
      confirmButtonText: 'OK'
    })
     return;

        }

        if (this.marca.id > 0) {

          this.MarcaService.update(this.marca , this.marca.id).subscribe({
            next: messagem =>{
                 Swal.fire({
            title: messagem,
            confirmButtonText: 'Ok'

          });
          this.router.navigate(['adim/marcas'], { state: { marcaEditada: this.marca } });
             this.retorno.emit(this.marca);
         }, error: erro =>{

     Swal.fire({

          text: "Ocorreu um erro.",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Por favor volte a tentar"
         });

         }
          })

    } else {
        this.MarcaService.save(this.marca).subscribe({
      next: mensagem => {
        Swal.fire({
          title: mensagem, // ✅ vem direto do backend
          icon: 'success',
          confirmButtonText: 'Ok'
        });
          this.router.navigate(['adim/marcas'], { state: { marcaNova: this.marca } });
          this.retorno.emit(this.marca);
      },
      error: erro => {
        console.error("Erro backend:", erro); // 👀 vê no console
        Swal.fire({
          text: "erro.",
          icon: "warning"
        });
      }
    });
     }
  }

  voltar(path: string){
    this.router.navigate([path]);
  }
}

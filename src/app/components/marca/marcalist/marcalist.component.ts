import { Component } from '@angular/core';
import { MarcadetalhesComponent } from "../marcadetalhes/marcadetalhes.component";
import { MdbModalModule,} from 'mdb-angular-ui-kit/modal';
import { ViewChild, TemplateRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Input, Output, EventEmitter } from '@angular/core';
import { Marca } from '../../Veiculos/veiculos.model';
import { MdbModalRef } from 'mdb-angular-ui-kit/modal';
import { inject } from '@angular/core';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';
import { MarcaServicService } from '../marca-servic.service';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-marcalist',
  standalone: true,
  imports: [MarcadetalhesComponent,  CommonModule, FormsModule, MatIconModule, MdbModalModule],
  templateUrl: './marcalist.component.html',
  styleUrl: './marcalist.component.css'
})
export class MarcalistComponent {
  marcaEdit: Marca = new Marca();
  
  


  constructor(){
    this.findAll();
    let novaMarca = history.state.marcaNova;
    let marcaEditada = history.state.marcaEditada;

    if (novaMarca) {

      this.lista.push(novaMarca);
    }

    if (marcaEditada) {
      let indice = this.lista.findIndex(x => x.id == marcaEditada.id);
      this.lista[indice] = marcaEditada;
    }
  }
 lista: Marca[]=[];

 @Input('esconderBotao')  esconderBotao = false;
  @Output('retornoMarca') retornoMarca =new EventEmitter<any>();

modalService = inject(MdbModalService);
  modalRef!: MdbModalRef<any>;

MarcaService =  inject(MarcaServicService);
  @ViewChild("modalMarcas") modalMarcas!: TemplateRef<any>;

marcar: any = { nome: '' }; // apenas um para limpar o formulario
 novo(){
   this.modalService.open(this.modalMarcas);
  // limpa o formulário


  }

  deleteFindByID(marca: Marca){
  Swal.fire({
      title: "Você tem certeza?",
      text: "Você não poderá recuperar este carro depois.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sim, apagar!"
    }).then((result) => {
      if (result.isConfirmed) {

this.MarcaService.delete(marca.id).subscribe({
   next: menssagem => {
  Swal.fire({
      title: menssagem,
      text: "Você não poderá recuperar este carro depois.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sim, apagar!"

    });
      this.findAll();
    },
    error: err => {
         Swal.fire({
      title: "",
      text: "Ocorreu um erro.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Por favor volte a tentar"
    })
       }
});
 }
    });
  }





  Editar(marca: Marca){
   this.marcaEdit =  Object .assign({}, marca);
   this.modalRef = this.modalService.open(this.modalMarcas);
  }

  Select(marca: Marca){
    this.retornoMarca.emit(marca);
    
    this.modalRef.close();

  }

  findAll(){
    this.MarcaService.findAll().subscribe({
      next: listaB=>{
      this.lista=listaB;
      },
      error : erro=>{
          Swal.fire({
      title: "",
      text: "Ocorreu um .",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Por favor volte a tentar"
    })
    }
  });



  }
}

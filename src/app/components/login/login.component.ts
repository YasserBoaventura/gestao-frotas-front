import { useAnimation } from '@angular/animations';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { LoginService } from '../auth/login.service';
import { MdbFormsModule } from 'mdb-angular-ui-kit/forms';
import { Login } from '../auth/login';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,                   // ✅ standalone
  imports: [FormsModule, MdbFormsModule]


})
export class LoginComponent  {

constructor(){}

   router=inject(Router)

    login: Login =new Login();

  LoginService = inject (LoginService);

  logar() {
   this.LoginService.logar(this.login).subscribe({
   next: (token : string) =>{
   if(token){
      this.LoginService.addToken(token);
    this.router.navigate(['dashboard']);
      }},
 error: (error: any) => {
      // A resposta de erro é uma string, então error.error é a string completa.
      let errorMessage = error.error;
      // Remove o prefixo "Erro ao salvar: " se existir
      if (errorMessage.startsWith('Erro ao salvar: ')) {
        errorMessage = errorMessage.substring('Erro ao salvar: '.length);
      }
     Swal.fire({
            title: 'Error!',
            text:  errorMessage ,
            icon: 'error',
            confirmButtonText: 'OK'
          })   
           return;
      //alert('Erro ao criar conta: ' + errorMessage);
    }




  })}

  forgotPassword(path:string) {
    this.router.navigate([path]);
    console.log('Recuperar senha');
    // lógica de recuperação de senha
  }

register(event: Event) {
  event.preventDefault(); // Impede o comportamento padrão do link
  this.router.navigate(['/register']);
}

}

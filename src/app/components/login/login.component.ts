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
  standalone: true, 
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
   
  let errorMessage = error.error;

  try {
    const parsed = JSON.parse(error.error);
    errorMessage = parsed.error;
  } catch (e) {
console.log(e); 
  }

  if (errorMessage === 'PRIMEIRO_LOGIN!') {
    this.router.navigate(['/trocar-senha']);
    return;
  }


  Swal.fire({
    title: 'Erro!',
    text: errorMessage,
    icon: 'error',
    confirmButtonText: 'OK'
  });


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
     
    }




  }) }

  forgotPassword(event: Event) {
    event.preventDefault();
    this.router.navigate(['/reset-senha']);

  }

register(event: Event) {
  event.preventDefault(); // Impede o comportamento padrão do link
  this.router.navigate(['/register']);
}
 
}

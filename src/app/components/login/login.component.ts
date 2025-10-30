import { useAnimation } from '@angular/animations';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

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
   next: token =>{
   if(token){
      this.LoginService.addToken(token);
    this.router.navigate(['dashboard']);
      }},
   error: erro =>{
     alert("erro ao logar"+ erro);
     console.log(erro);

   }

  })}

  forgotPassword() {
    console.log('Recuperar senha');
    // lógica de recuperação de senha
  }

  register() {
    console.log('Registrar novo usuário');
    // lógica de registro
  }

}

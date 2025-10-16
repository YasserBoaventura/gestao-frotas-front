import { useAnimation } from '@angular/animations';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';


import { MdbFormsModule } from 'mdb-angular-ui-kit/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,                   // ✅ standalone
  imports: [FormsModule, MdbFormsModule]


})
export class LoginComponent  {

    router=inject(Router)


  login = {
    username: '',
    password: ''
  };

  logar() {
  if(this.login.username=="admin" && this.login.password=="admin"){

    this.router.navigate(['dashboard']);
   }else{
    alert("Usuario e senha nao encontrados");
   }

  }

  forgotPassword() {
    console.log('Recuperar senha');
    // lógica de recuperação de senha
  }

  register() {
    console.log('Registrar novo usuário');
    // lógica de registro
  }

}

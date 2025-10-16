import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { MdbFormsModule } from 'mdb-angular-ui-kit/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
standalone: true,                   // ✅ standalone
  imports: [FormsModule, MdbFormsModule]


})
export class LoginComponent  {


  login = {
    username: '',
    password: ''
  };

  logar() {
    console.log('Tentando logar com:', this.login);
    // lógica de autenticação
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

import { Component, inject } from '@angular/core';
import { Route } from '@angular/router';
import { Router } from '@angular/router'; //  Angular Router correto
import Swal from 'sweetalert2'
import { LoginService } from '../../auth/login.service';
import { MdbFormsModule } from 'mdb-angular-ui-kit/forms';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
            FormsModule,  CommonModule,     // 👈 necessário para ngModel
            MdbFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private router = inject(Router); // ✅ Agora usando Angular Router
  private authService = inject(LoginService); // ✅ Usando inject para authService


  registerData = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'USER'
  };

  passwordMismatch = false;

constructor(){}
register() {
  if (this.registerData.password !== this.registerData.confirmPassword) {
    this.passwordMismatch = true;
    return;
  }

  this.passwordMismatch = false;

  const user = {
    username: this.registerData.username,
    email: this.registerData.email,
    password: this.registerData.password,
    role: this.registerData.role
  };

  this.authService.register(user).subscribe({
    next: (mensagem: string) => {
   Swal.fire({
           title: mensagem, // ✅ vem direto do backend
           icon: 'success',
           confirmButtonText: 'Ok'
         });
      this.router.navigate(['/login']);
    },
    error: (error: any) => {
      // A resposta de erro é uma string, então error.error é a string completa.
      let errorMessage = error.error;
      // Remove o prefixo "Erro ao salvar: " se existir
      if (errorMessage.startsWith('Erro ao salvar: ')) {
        errorMessage = errorMessage.substring('Erro ao salvar: '.length);
      }
      alert('Erro ao criar conta: ' + errorMessage);
    }
  });
}

  goBack() {
    this.router.navigate(['/login']);
  }
}



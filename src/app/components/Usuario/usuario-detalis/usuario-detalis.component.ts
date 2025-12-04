import { Component } from '@angular/core';
  import {  inject } from '@angular/core';
  import { Route } from '@angular/router';
  import { Router } from '@angular/router'; //  Angular Router correto
  import Swal from 'sweetalert2'
  import { LoginService } from '../../auth/login.service';
  import { MdbFormsModule } from 'mdb-angular-ui-kit/forms';
  import { FormBuilder, FormGroup, FormsModule, Validators, ReactiveFormsModule } from '@angular/forms';
  import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-usuario-detalis',
  standalone: true,
  imports: [MdbFormsModule, FormsModule, CommonModule, // 👈 necessário para ngModel
    MdbFormsModule, ReactiveFormsModule],
  templateUrl: './usuario-detalis.component.html',
  styleUrl: './usuario-detalis.component.css'
})
export class UsuarioDetalisComponent {

cadastroForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private loginService: LoginService,
    private router: Router
  ) {
    this.cadastroForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      telefone: [''],
      nuit: ['', Validators.required],
      dataNascimento: [''],
      perguntaSeguranca: ['', Validators.required],
      respostaSeguranca: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    const password = g.get('password')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.cadastroForm.valid) {
      // Remover o campo confirmPassword, pois não é necessário no DTO
      const formValue = this.cadastroForm.value;
      delete formValue.confirmPassword;

      // Converter a data de nascimento para o formato esperado pelo backend (LocalDateTime)
      if (formValue.dataNascimento) {
        formValue.dataNascimento = new Date(formValue.dataNascimento).toISOString();
      }

      this.loginService.autoCadastro(formValue).subscribe({
        next: (response) => {
            Swal.fire({
                    title: response, //  vem direto do backend
                    icon: 'success',
                    confirmButtonText: 'Ok'
                  });
        
          this.router.navigate(['/login']);
        },
        error: (error) => {
          alert(error.error || 'Erro ao realizar cadastro.');
        }
      });
    }
  }

}




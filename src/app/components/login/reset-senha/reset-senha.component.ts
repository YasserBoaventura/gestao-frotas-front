import { Component, OnInit } from '@angular/core';
import { MatIconModule, MatIcon } from '@angular/material/icon';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoginService } from '../../auth/login.service';
import { Router } from '@angular/router';
import { CommonModule, NgIf } from '@angular/common';
@Component({
  selector: 'app-reset-senha',
  standalone: true,
  imports: [   CommonModule,
    ReactiveFormsModule, // ← ADICIONE ESTE
    MatIconModule ,    // ← Use MatIconModule em vez de MatIcon


   ],
  templateUrl: './reset-senha.component.html',
  styleUrl: './reset-senha.component.css'
})
export class ResetSenhaComponent {

    // Declare os forms como públicas
  requestForm!: FormGroup;
  resetForm!: FormGroup;
  formGroup !: FormGroup;
  // UI State
  currentStep = 1;
  isLoading = false;
  showTokenMessage = false;
  showSuccessModal = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: LoginService,
    private router: Router
  ) {
    this.requestForm = this.createRequestForm();
    this.resetForm = this.createResetForm();
  }

  // Form para solicitar token
  createRequestForm(): FormGroup {
    return this.fb.group({
      username: ['', [Validators.required]]
    });
  }

  // Form para redefinir senha
  createResetForm(): FormGroup {
    return this.fb.group({
      token: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  // Validador para verificar se as senhas coincidem
  passwordMatchValidator(control: AbstractControl) {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (!newPassword || !confirmPassword) {
      return null;
    }

    return newPassword.value === confirmPassword.value ? null : { passwordsMismatch: true };
  }

// Step 1: Solicitar token
onRequestToken(): void {
  if (this.requestForm.valid) {
    this.isLoading = true;

    const username = this.requestForm.get('username')?.value;

    console.log(' Solicitando token para:', username);

    this.authService.requestPasswordReset(username).subscribe({
      next: (token: string) => {
        this.isLoading = false;
        console.log('✅ Token recebido com sucesso:', token);

        // Vai para o passo 2
        this.currentStep = 2;

        // Preenche automaticamente o token (opcional)
        this.resetForm.patchValue({
          token: token.trim()
        });

        console.log('🔄 Indo para passo 2...');
      },
      error: (error) => {
        this.isLoading = false;
        console.error('❌ Erro final ao solicitar token:', error);

        let errorMessage = 'Erro ao solicitar token de redefinição.';

        if (error.status === 404) {
          errorMessage = 'Username não encontrado.';
        } else if (error.status === 415) {
          errorMessage = 'Erro de formato. Tente novamente.';
        } else if (error.error) {
          errorMessage = error.error;
        }

        alert(errorMessage);
      }
    });
  } else {
    this.markFormGroupTouched(this.requestForm);
  }
}

// Step 2: Redefinir senha com token
onResetPassword(): void {
  if (this.resetForm.valid) {
    this.isLoading = true;

    const resetData = {
      token: this.resetForm.get('token')?.value,
      newPassword: this.resetForm.get('newPassword')?.value
    };

    console.log(' Redefinindo senha com token:', resetData.token);

    this.authService.resetPassword(resetData.token, resetData.newPassword).subscribe({
      next: (response: string) => { // ← Agora é string
        this.isLoading = false;
        console.log(' Senha redefinida com sucesso:', response);

        alert('Senha redefinida com sucesso!');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.isLoading = false;
        console.error(' Erro ao redefinir senha:', error);

        let errorMessage = 'Erro ao redefinir senha.';

        if (error.status === 400) {
          errorMessage = 'Token inválido ou expirado.';
        } else if (error.error) {
          errorMessage = error.error;
        }

        alert(errorMessage);
      }
    });
  } else {
    this.markFormGroupTouched(this.resetForm);
  }
}

  // Step 1: Solicitar token
  // Step 1: Solicitar token
// Toggle password visibility
  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
    this.router.navigate(['/login']);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  goBackToStep1(): void {
  console.log('🟡 Voltando para passo 1');
  this.currentStep = 1;
  // Opcional: limpar o formulário de reset
  this.resetForm.reset();
}
}

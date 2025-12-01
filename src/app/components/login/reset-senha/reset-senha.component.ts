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

    validationForm!: FormGroup;
  resetForm!: FormGroup;

  currentStep = 1;
  isLoading = false;
  showNewPassword = false;
  showConfirmPassword = false;

  // Novas propriedades para armazenar a pergunta e token
  perguntaSeguranca: string = '';
  tokenGerado: string = '';

  // Armazenar dados da validação
  private validatedUserData: any = {};

  constructor(
    private fb: FormBuilder,
    private authService: LoginService,
    private router: Router
  ) {
    this.validationForm = this.createValidationForm();
    this.resetForm = this.createResetForm();
  }

  // Form para validação inicial
  createValidationForm(): FormGroup {
    return this.fb.group({
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  // Form para redefinição de senha - AGORA INCLUI TOKEN
  createResetForm(): FormGroup {
    return this.fb.group({
      token: ['', [Validators.required]], // ← CAMPO TOKEN ADICIONADO
      respostaSeguranca: ['', [Validators.required]],
      nuit: ['', [Validators.required]],
      novaSenha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarSenha: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  // Validador para verificar se as senhas coincidem
  passwordMatchValidator(control: AbstractControl) {
    const novaSenha = control.get('novaSenha');
    const confirmarSenha = control.get('confirmarSenha');

    if (!novaSenha || !confirmarSenha) {
      return null;
    }

    return novaSenha.value === confirmarSenha.value ? null : { passwordsMismatch: true };
  }

  // Step 1: Validar usuário e email - AGORA RECEBE PERGUNTA E TOKEN
  onValidateUser(): void {
    if (this.validationForm.valid) {
      this.isLoading = true;

      const validationData = this.validationForm.value;

      console.log('📤 Validando usuário:', validationData.username);

      this.authService.validateUserForPasswordReset(validationData).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          console.log('✅ Resposta do servidor:', response);

          if (response.status === 'sucesso') {
            console.log('✅ Usuário validado com sucesso');

            // Armazena os dados validados
            this.validatedUserData = validationData;

            // Armazena a pergunta e token
            this.perguntaSeguranca = response.perguntaSeguranca;
            this.tokenGerado = response.token;

            // Preenche automaticamente o token no formulário
            this.resetForm.patchValue({
              token: this.tokenGerado
            });

            // Avança para o passo 2
            this.currentStep = 2;
          }else if(response.status==='Usuario nao pode fazer altercoes. sua conta esta inativa')  {
            alert(response.mensagem || 'Usuario nao pode fazer altercoes. sua conta esta inativa');
          }else{
        alert(response.mensagem==='Usuario nao pode fazer altercoes. sua conta esta inativa');
          }
          }

        ,
        error: (error) => {
          this.isLoading = false;
          console.error(' Erro na validação:', error);

          let errorMessage = 'Erro ao validar usuário.';

          if (error.status === 404) {
            errorMessage = 'Usuário ou email não encontrados.';
          } else if (error.error) {
            errorMessage = error.error;
          }

          alert(errorMessage);
        }
      });
    } else {
      this.markFormGroupTouched(this.validationForm);
    }
  }

  // Step 2: Redefinir senha
// Step 2: Redefinir senha - ATUALIZADO
onResetPassword(): void {
  if (this.resetForm.valid) {
    this.isLoading = true;

    // Cria o objeto no formato desejado, similar ao motoristaData
    const resetData = {
      username: this.validatedUserData.username,
      email: this.validatedUserData.email,
      token: this.tokenGerado,
      nuit: this.resetForm.get('nuit')?.value,
      respostaSeguranca: this.resetForm.get('respostaSeguranca')?.value,
      novaSenha: this.resetForm.get('novaSenha')?.value
    };

    console.log(' Dados enviados para reset:', resetData);

    this.authService.resetPassword(resetData).subscribe({
      next: (response: string) => {
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
          errorMessage = 'Dados inválidos. Verifique as informações.';
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

  // Métodos auxiliares
  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  goBackToStep1(): void {
    this.currentStep = 1;
    this.resetForm.reset();
    this.perguntaSeguranca = '';
    this.tokenGerado = '';
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}

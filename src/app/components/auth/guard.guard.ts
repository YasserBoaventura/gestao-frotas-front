import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from './login.service';
import Swal from 'sweetalert2';

export const guardGuard: CanActivateFn = (route, state) => {

   let router = inject(Router)

   let loginService = inject(LoginService);
   if(loginService.hasRole("USER") && state.url=='/CustoList') {
     Swal.fire({
            text: ".Voce nao tem permissao para acessar  essa rota.",
            icon: "warning"
          });
    router.navigate(['login'])
     return false;
   }

   if(loginService.hasRole("USER") && state.url=='/relatorioManutencao'){
      Swal.fire({
            text: ".Voce nao tem permissao para acessar  essa rota.",
            icon: "warning"
          });
    router.navigate(['login'])
     return false;
   }
    if(loginService.hasRole("USER") && state.url=='/relatorioCombustivel'){
      Swal.fire({
            text: ".Voce nao tem permissao para acessar  essa rota.",
            icon: "warning"
          });
    router.navigate(['login'])
     return false;
   }


if(loginService.hasRole("USER") && state.url=='/relatoriosViagem'){
      Swal.fire({
            text: ".Voce nao tem permissao para acessar  essa rota.",
            icon: "warning"
          });
    router.navigate(['login'])
     return false;
   }

   return true;
};

import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const meuhttpInterceptor: HttpInterceptorFn = (request, next) => {

  const router = inject(Router);

  const token = localStorage.getItem('token');

  console.log('Interceptor entrou');

  if (
    token &&
    !router.url.includes('/login') &&
    !router.url.includes('/register') &&
    !router.url.includes('/reset-senha')
  ) {
    request = request.clone({
      setHeaders: {
        Authorization: 'Bearer ' + token
      }
    });
  }

  return next(request).pipe(

    catchError((err: HttpErrorResponse) => {

      console.log('Erro HTTP:', err.status);

      if (err.status === 401 || err.status === 403) {

        // Remove o token expirado/inválido
        localStorage.removeItem('token');

        // Redireciona para o login
        router.navigate(['/login']);
      }

      return throwError(() => err);
    })

  );
};
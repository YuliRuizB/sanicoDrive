import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    } else {
      this.toastService.warning('Debes iniciar sesión para acceder', 'Acceso denegado');
      this.router.navigate(['/login']);
      return false;
    }
  }
}

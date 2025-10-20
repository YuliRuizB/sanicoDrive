import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, } from '@angular/forms';

import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';


@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule,CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  logo = './assets/sanicoDriveInit.png';
  loginForm!: FormGroup;
  loading = false;
  error = '';
  showPassword = false;
  submitted = false;
 /*  eye = eye;
  eyeOff = eyeOff; */

  constructor(private fb: FormBuilder, private toastService: ToastService, private authService: AuthService) {
    this.loginForm = this.fb.group({
      email: [null, [Validators.required]],
      password: [null, [Validators.required]]
    });
  }


  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async submitForm() {
    if (this.loginForm.invalid) return;

    if (this.loginForm.valid) {
       const { email, password } = this.loginForm.value;       
       await this.authService.login(email, password);

    } else {
      this.toastService.error('Escriba por favor sus datos para tener acceso','Sanico Drive Informa');
    }
  }

}

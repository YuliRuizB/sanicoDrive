import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-forgot',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './forgot.html',
  styleUrls: ['./forgot.css']
})
export class ForgotComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  forgotForm: FormGroup;

  constructor(private router: Router, private toastService: ToastService) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit() {}

  regresar() {
    this.router.navigate(['/auth/login']);
  }



  recuperar() {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    const email = this.forgotForm.value.email;

    this.auth.forgotPassword(email)
      .then(() => {
        this.toastService.success(`Se mandó el correo a: ${email}`, 'Sanico Drive Informa');
        this.router.navigate(['/auth/login']);
      })
      .catch((err: any) => {
         this.toastService.error('Error al enviar el correo de recuperación', 'Sanico Drive Informa');

      });
  }
}

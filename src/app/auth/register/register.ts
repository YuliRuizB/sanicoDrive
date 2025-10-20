import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [RouterLink, ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  today = new Date().toISOString();
  registerForm!: FormGroup;
  showTermsModal = false;


  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.minLength(10)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      street: ['', [Validators.required]],
      colony: ['', [Validators.required]],
      state: ['', [Validators.required]],
      postalCode: ['', [Validators.required, Validators.minLength(5)]],
      terms: [false, [Validators.requiredTrue]]
    });
  }

  async submitForm() {

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.toastService.error('Por favor completa todos los campos requeridos', 'Sanico Drive Informa');
      return;
    }

    const formValues = this.registerForm.value;

    // Validar que las contraseñas coincidan
    if (formValues.password !== formValues.confirmPassword) {
      this.toastService.error('Las contraseñas no coinciden', 'Sanico Drive Informa');

      this.registerForm.get('confirmPassword')?.setErrors({ mismatch: true });
      return;
    }

    // Construir el objeto User con campos por default
    const user = {
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      displayName: `${formValues.firstName} ${formValues.lastName}`,
      email: formValues.email,
      phone: formValues.phone,
      street: formValues.street || '',
      colony: formValues.colony || '',
      state: formValues.state,
      uidCompany: 'uHROo7SIDL7kJqr1fUER',
      uid: '', // se asigna al crear el usuario
      active: true,
      phoneInfo: {},
      terms: formValues.terms,
      createdAt: new Date().toISOString(),
      createTimeStamp: Date.now(),
      role: 'admin'
    };

    try {
      const userWithPassword = { ...user, password: formValues.password };
      const cred = await this.authService.register(userWithPassword);

      this.toastService.success('Usuario registrado correctamente', 'Sanico Drive Informa');
      this.router.navigate(['/auth/login']);
    } catch (error: any) {
      this.toastService.error(error.message || 'Error al registrar usuario', 'Sanico Drive Informa');
    }
  }

  openTerms() {
    this.showTermsModal = true;
  }

  cancelTerms() {
    this.showTermsModal = false;
    this.registerForm.patchValue({ terms: false });
  }

  acceptTerms() {
    this.showTermsModal = false;
    this.registerForm.patchValue({ terms: true });
  }
}

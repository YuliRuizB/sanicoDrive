import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../services/toast.service';
import { AppointmentsService } from '../../services/appointments.service';

@Component({
  selector: 'app-down-page',
  imports: [RouterLink, ReactiveFormsModule,CommonModule,FormsModule],
  templateUrl: './down-page.html',
  styleUrl: './down-page.css'
})
export class DownPage {
  email: string = '';

    constructor(private toastService: ToastService,private appoinment : AppointmentsService) {

    }

   onSubmit() {
    if (!this.email.trim()) {
       this.toastService.error('Escriba por favor su correo','Sanico Drive Informa');
      return;
    }
    this.appoinment.deactivateUserByEmail(this.email.trim());
    // Aquí podrías implementar la lógica real de solicitud de baja
      this.toastService.error('Escriba por favor sus datos para tener acceso','Sanico Drive Informa');
  }

}

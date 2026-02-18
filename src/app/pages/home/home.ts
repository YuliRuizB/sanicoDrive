import { ChangeDetectorRef, Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentsService } from '../../services/appointments.service';
import { Appointment } from '../../intarfaces/appointments';
import { ToastService } from '../../services/toast.service';
import { User } from '../../intarfaces/user';
import { calendar } from '../../intarfaces/calendar';
import { configurationService } from '../../services/configuration.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent {
  user: any = {};
  showModal = false;
  selectedOrder: any = null;
  selectedStatusModal: string = '';
  comments: string = '';
  filterToday: boolean = false;
  selectedTab: string = 'citas';
  selectedBitacoraDate: string = '';
  bitacoras: any[] = [];
  filterTime: string = '';
  selectedCalendar!: calendar;
  filterCalendar: string = '';
  selectedBitacoraCalendar: string = '';
  statuses = [
    { id: 0, name: 'Pendiente', value: 'pending', colorClass: 'bg-yellow-400', count: 0 },
    { id: 1, name: 'Aprobada', value: 'approved', colorClass: 'bg-green-500', count: 0 },
    { id: 3, name: 'Cancelada', value: 'canceled', colorClass: 'bg-red-500', count: 0 },
    { id: 4, name: 'Todas', value: 'all', colorClass: 'bg-gray-400', count: 0 }
  ];
  statusesList = [
    { id: 0, name: 'Pendiente', value: 'pending', colorClass: 'bg-yellow-400', count: 0 },
    { id: 1, name: 'Aprobada', value: 'approved', colorClass: 'bg-green-500', count: 0 },
    { id: 2, name: 'Finalizada', value: 'finalize', colorClass: 'bg-blue-500', count: 0 },
    { id: 3, name: 'Cancelada', value: 'canceled', colorClass: 'bg-red-500', count: 0 }
  ];
  newCalendar: Partial<calendar> = {
    title: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    time: '',
    amountSpaces: 1,
    uidCompany: 'uHROo7SIDL7kJqr1fUER',
    active: true
  };
  bitacoraStatusCounts: { [key: string]: number } = {};
  orders: Appointment[] = [];
  filterName: string = '';
  filterDate: string = '';
  selectedStatus: string = 'all';
  calendarList: calendar[] = [];
  availableTimes: string[] = ['9:00 AM', '1:00 PM'];
  selectedTime: string = '';

  constructor(
    private auth: AuthService,
    private cd: ChangeDetectorRef,
    private router: Router,
    private configService: configurationService,
    private toastService: ToastService,
    private appService: AppointmentsService
  ) { }

  ngOnInit(): void {
    this.auth.user$.subscribe(userData => {
      this.user = userData;
      if (userData) {
        this.loadCalendars();
        this.getAppointments();
      }
    });
  }

  getAppointments() {
    if (!this.user?.uid || !this.user?.uidCompany) return;

    this.appService.getOrder(this.user.uidCompany).subscribe({
      next: (data: any[]) => {
        if (!data || data.length === 0) {
          this.orders = [];
          this.resetStatusCounts();
          this.selectedStatus = 'all';
          this.cd.detectChanges();
          return;
        }

        this.orders = data.map(order => {
          let normalizedStatus = order.status ?? 'pending';
          if (normalizedStatus === 'finalized') normalizedStatus = 'complete';

          const normalizeDate = (field: any): Date | null => {
            if (!field) return null;
            if (typeof field.toDate === 'function') return field.toDate();
            if (field.seconds) return new Date(field.seconds * 1000);
            return null;
          };

          return {
            active: order.active ?? true,
            createdDate: normalizeDate(order.createdDate),
            requestedDate: order.requestedDate ?? '', 
            requestedTime: order.requestedTime ?? '', 
            nameofAsistent: order.nameofAsistent ?? 'Sin nombre',
            status: normalizedStatus,
            uid: order.uid ?? '',
            uidCompany: order.uidCompany ?? '',
            uidUser: order.uidUser ?? '',
            urlFile: order.urlFile ?? '',
            reference: order.reference ?? '',
            uidCalendar: order.uidCalendar ?? '',
          };
        });

        this.orders.sort((a, b) => {
          const dateA = a.requestedDate ? new Date(a.requestedDate).getTime() : 0;
          const dateB = b.requestedDate ? new Date(b.requestedDate).getTime() : 0;
          return dateB - dateA; 
        });

        this.updateStatusCounts();
        this.selectedStatus = 'all';
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error al obtener appointments:', err);
        this.orders = [];
        this.resetStatusCounts();
        this.selectedStatus = 'all';
        this.cd.detectChanges();
      }
    });
  }

  async saveCalendar() {
    if (this.selectedCalendar?.uid) {
      await this.configService.updateCalendar(this.selectedCalendar.uid, this.selectedCalendar);
    } else {
      const newCal = {
        ...this.newCalendar,
        createdAt: new Date().toISOString(),
      } as calendar;
      await this.configService.addCalendar(newCal);
      this.newCalendar = {};
      this.cd.detectChanges();
    }
    await this.loadCalendars();
  }

  loadCalendars(): Promise<void> {
    return new Promise((resolve) => {
      this.configService.getCalendarList(this.user.uidCompany).subscribe({
        next: (data) => {
          this.calendarList = data;
          this.cd.detectChanges();

          if (this.orders.length > 0) {
            this.orders = [...this.orders];
            this.cd.detectChanges();
          }
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  resetStatusCounts() {
    this.statuses = this.statuses.map(s => ({ ...s, count: 0 }));
  }

  updateStatusCounts() {
    this.resetStatusCounts();

    this.orders.forEach(order => {
      const statusItem = this.statuses.find(s => s.value === order.status);
      if (statusItem) statusItem.count++;
    });

    const allItem = this.statuses.find(s => s.value === 'all');
    if (allItem) allItem.count = this.orders.length;
  }

  filteredOrders(): Appointment[] {
    return this.orders.filter(order => {
      const matchesToday = !this.filterToday || this.isCreatedToday(order.createdDate);
      const matchesName = !this.filterName || order.nameofAsistent.toLowerCase().includes(this.filterName.toLowerCase());
      const matchesStatus = !this.selectedStatus || this.selectedStatus === 'all' || order.status === this.selectedStatus;
      const matchesCalendar = !this.filterCalendar || order.uidCalendar === this.filterCalendar;
      return matchesToday && matchesName && matchesStatus && matchesCalendar;
    });
  }

  isCreatedToday(date: Date | null): boolean {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  export() {
    const ordersToExport = this.filteredOrders();

    if (!ordersToExport.length) {
      this.toastService.error('No hay citas para exportar', 'Sanico Drive Informa');
      return;
    }

    const csvHeader = ['Nombre', 'Fecha', 'Hora', 'Comprobante'];
    const csvRows = ordersToExport.map(order => [
      order.nameofAsistent,
      order.requestedDate || '',
      order.requestedTime || '',
      order.urlFile || ''
    ]);

    const csvContent = [csvHeader, ...csvRows].map(e => e.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `citas-${this.selectedStatus}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  setSelectedStatus(value: string) {
    this.selectedStatus = value;
    this.cd.detectChanges();
  }

  get selectedStatusName(): string {
    return this.statuses.find(s => s.value === this.selectedStatus)?.name ?? 'Todas';
  }

  async acceptApp(order: any) {
    try {
      const user = await this.appService.getUserById(order.uidUser);
      if (!user) {
        this.toastService.error('No existe el usuario asociado', 'Sanico Drive Informa');
        return;
      }

      const calendar = this.calendarList.find(c => c.uid === order.uidCalendar);
      if (!calendar) {
        this.toastService.error('No se encontró el calendario asociado a esta cita', 'Sanico Drive Informa');
        return;
      }
      
      if (calendar.amountSpaces <= 0) {
        this.toastService.error('No hay espacios disponibles para aprobar esta cita.', 'Sanico Drive Informa');
        return;
      }
     
      if (order.status === 'approved') {
        this.toastService.info('La cita ya estaba aprobada.', 'Sanico Drive Informa');
        return;
      }
     
      const newSpaces = calendar.amountSpaces - 1;
     
      await this.appService.updateAppoinmentStatus(order.uid, 'approved');
    
      await this.configService.updateCalendar(calendar.uid!, { amountSpaces: newSpaces });

      this.toastService.success('Se aprobó la cita con éxito.', 'Sanico Drive Informa');
      this.sendNotification('La cita ha sido Aceptada.', user.token);
      this.sendEmail(user.email, 'Cita Aceptada', 'approved', order.requestedDate, order.requestedTime, 'Tu cita ha sido Aceptada.');

      
      await this.loadCalendars();
      this.getAppointments();
      this.cd.detectChanges();

    } catch (err) {
      console.error(err);
      this.toastService.error('Error al aprobar la cita', 'Sanico Drive Informa');
    }
  }

  async rejectApp(order: any) {
    try {
      const user = await this.appService.getUserById(order.uidUser);
      if (!user) {
        this.toastService.error('No existe el usuario asociado', 'Sanico Drive Informa');
        return;
      }

      const calendar = this.calendarList.find(c => c.uid === order.uidCalendar);
      if (!calendar) {
        this.toastService.error('No se encontró el calendario asociado a esta cita', 'Sanico Drive Informa');
        return;
      }

      let newSpaces = calendar.amountSpaces ?? 0;
      
      if (order.status === 'approved') {
        newSpaces += 1;
      }
     
      await this.appService.updateAppoinmentStatus(order.uid, 'rejected');     
      await this.configService.updateCalendar(calendar.uid!, { amountSpaces: newSpaces });

      this.toastService.success('Se rechazó la cita con éxito.', 'Sanico Drive Informa');
      this.sendNotification('La cita ha sido rechazada, favor de validar.', user.token);
      this.sendEmail(user.email, 'Cita Rechazada', 'rejected', order.requestedDate, order.requestedTime, 'Tu cita ha sido Rechazada, favor de validar.');

      await this.loadCalendars();
      this.getAppointments();
      this.cd.detectChanges();

    } catch (err) {
      console.error(err);
      this.toastService.error('Error al rechazar la cita', 'Sanico Drive Informa');
    }
  }

  switchDateApp(order: any) {
    this.selectedOrder = order;
    this.selectedStatusModal = order.status;
    this.selectedCalendar = this.calendarList.find(c => c.uid === order.uidCalendar)!;
    this.comments = '';
    this.showModal = true;
    this.cd.detectChanges();
  }

  closeModal() {
    this.showModal = false;
    this.selectedOrder = null;
    this.selectedStatusModal = '';
    this.comments = '';
    this.cd.detectChanges();
  }

  async saveChange() {
    if (!this.selectedOrder) {
      this.toastService.error('No hay cita seleccionada.', 'Sanico Drive Informa');
      return;
    }
    const order = this.selectedOrder;
    try {
      const user = await this.appService.getUserById(order.uidUser);
      if (!user) {
        this.toastService.error('No existe el usuario asociado', 'Sanico Drive Informa');
        this.showModal = false;
        return;
      }

      const calendar = this.calendarList.find(c => c.uid === order.uidCalendar);
      if (!calendar) {
        this.toastService.error('No se encontró el calendario asociado a esta cita', 'Sanico Drive Informa');
        this.showModal = false;
        return;
      }

      const newStatus = this.selectedStatusModal;
      let newSpaces = calendar.amountSpaces ?? 0;

      if (newStatus === 'approved') {
        if (calendar.amountSpaces <= 0) {
          this.toastService.error('No hay espacios disponibles para aprobar esta cita.', 'Sanico Drive Informa');
          return;
        }
        if (order.status !== 'approved') {
          newSpaces -= 1;
        }
      }
      if (newStatus !== 'approved' && order.status === 'approved') {
        newSpaces += 1;
      }

      if (newStatus === 'rejected' && order.status === 'approved') {
        newSpaces += 1;
      }

      await this.appService.updateAppoinmentStatus(order.uid, newStatus);

      if (newSpaces !== calendar.amountSpaces) {
        await this.configService.updateCalendar(calendar.uid!, { amountSpaces: newSpaces });
      }

      this.toastService.success('Los cambios se guardaron con éxito.', 'Sanico Drive Informa');

      const msg =
        newStatus === 'approved'
          ? 'Tu cita ha sido Aceptada.'
          : newStatus === 'rejected'
            ? 'Tu cita ha sido Rechazada, favor de validar.'
            : 'Tu cita ha cambiado de estado.';
      this.sendNotification(msg, user.token);
      this.sendEmail(user.email, `Cita ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`, newStatus, order.requestedDate, order.requestedTime, msg);
      
      this.showModal = false;
      await this.loadCalendars();
      this.getAppointments();
      this.cd.detectChanges();

    } catch (err) {
      console.error(err);
      this.toastService.error('Error al guardar los cambios', 'Sanico Drive Informa');
    }
  }

  clearFilters() {
    this.filterName = '';
    this.filterCalendar = '';
    this.selectedStatus = 'all';
    this.filterToday = false;
    this.cd.detectChanges();
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'approved': return 'Aprobada';
      case 'finalize': return 'Finalizada';
      case 'complete': return 'Completada';
      case 'canceled': return 'Cancelada';
      default: return status;
    }
  }

  getSelectedCalendarSpaces(): number | string {
    if (!this.selectedBitacoraCalendar) return 'N/A';
    const cal = this.calendarList.find(c => c.uid === this.selectedBitacoraCalendar);
    return cal ? cal.amountSpaces : 'N/A';
  }

  loadBitacoras() {
    if (!this.user?.uidCompany || !this.selectedBitacoraCalendar) {
      this.bitacoras = [];
      this.selectedBitacoraDate = '';
      return;
    }

    this.appService.getOrderBit(this.user.uidCompany, this.selectedBitacoraCalendar).subscribe({
      next: (data) => {             
        this.bitacoras = data.map(order => ({
          nameofAsistent: order.nameofAsistent ?? 'Sin nombre',
          requestedDate: this.getCalendarTitle(order.uidCalendar) ?? '',
          requestedTime: this.getCalendarTime(order.uidCalendar) ?? '',
          status: order.status ?? 'pending',
          reference: order.reference ?? ''
        }));        
        const selectedCalendar = this.calendarList.find(
          c => c.uid?.toString() === this.selectedBitacoraCalendar?.toString()
        );
        this.selectedBitacoraDate = selectedCalendar
          ? `${selectedCalendar.title} (${this.getShortDateRange(selectedCalendar.startDate, selectedCalendar.endDate)})`
          : 'Sin fecha';
      
        this.bitacoraStatusCounts = this.bitacoras.reduce((acc, b) => {
          acc[b.status] = (acc[b.status] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });

        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar bitácoras:', err);
        this.bitacoras = [];
        this.selectedBitacoraDate = '';
        this.bitacoraStatusCounts = {};
        this.cd.detectChanges();
      }
    });
  }

  exportBitacoras() {
    if (!this.bitacoras.length) {
      this.toastService.error('No hay bitácoras para exportar', 'Sanico Drive Informa');
      return;
    }

    const csvHeader = ['Nombre', 'Fecha', 'Hora', 'Status', 'Referencia'];
    const csvRows = this.bitacoras.map(order => [
      order.nameofAsistent,
      order.requestedDate,
      order.requestedTime,
      order.status,
      order.reference
    ]);

    const csvContent = [csvHeader, ...csvRows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `bitacoras-${this.selectedBitacoraDate}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  sendNotification(descripion: string, strtoken: string) {
    const title = 'SanNico Drive Informa';
    const desc = descripion;
    const token = strtoken;

    this.appService.pushNotifications(title, desc, token).subscribe({
      next: (res) => {
        console.log(' Notificación enviada correctamente:', res);
      },
      error: (err) => {
        console.error(' Error al enviar la notificación:', err);
      }
    });
  }

  sendEmail(email: string, subject: string, status: string, date: string, time: string, msg: string) {
    const title = 'SanNico Drive Informa';
    this.appService.sendEmail(title, email, subject, status.toUpperCase(), date, time, msg).subscribe({
      next: (res) => {
        console.log(' Notificación enviada correctamente:', res);
      },
      error: (err) => {
        console.error(' Error al enviar la notificación:', err);
      }
    });
  }

  selectCalendar(cal: calendar) {
    this.selectedCalendar = { ...cal };
  }
  async deleteCalendar(uid: string) {
    if (confirm('¿Seguro que quieres eliminar este horario de citas?')) {
      console.log('Eliminando calendario con UID:', uid);
      
      await this.configService.deleteCalendar(uid);
      await this.loadCalendars();
      this.cd.detectChanges();
    }
  }

  cancelEdit() {    
  }

  getCalendarTitle(uidCalendar: string): string {
    const cal = this.calendarList.find(c => c.uid?.toString() === uidCalendar?.toString());
    if (!cal) return '-';
    const range = this.getShortDateRange(cal.startDate, cal.endDate);
    return `${cal.title} (${range})`;
  }

  getCalendarTime(uidCalendar: string): string {
    const cal = this.calendarList.find(c => c.uid?.toString() === uidCalendar?.toString());
    return cal ? cal.time : '-';
  }

  getShortDateRange(start: string, end: string): string {
    if (!start || !end) return '';

    const [startYear, startMonth, startDay] = start.split('-').map(Number);
    const [endYear, endMonth, endDay] = end.split('-').map(Number);
   
    const startDate = new Date(startYear, startMonth - 1, startDay);
    const endDate = new Date(endYear, endMonth - 1, endDay);

    const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const sameMonth = startDate.getMonth() === endDate.getMonth();

    if (sameMonth) {
      return `${startDate.getDate()} - ${endDate.getDate()} ${monthNames[startDate.getMonth()]}`;
    } else {
      return `${startDate.getDate()} ${monthNames[startDate.getMonth()]} - ${endDate.getDate()} ${monthNames[endDate.getMonth()]}`;
    }
  }

}

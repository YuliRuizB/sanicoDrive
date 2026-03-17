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
  selectedCalendar: calendar | null = null;
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
    amountSpaces: 0,
    uidCompany: 'uHROo7SIDL7kJqr1fUER',
    active: true,
    lastDateofSuscribe: null,
  };
  bitacoraStatusCounts: { [key: string]: number } = {};
  orders: Appointment[] = [];
  filterName: string = '';
  filterDate: string = '';
  selectedStatus: string = 'all';
  calendarList: calendar[] = [];
  availableTimes: string[] = ['9:00 AM', '1:00 PM'];
  selectedTime: string = '';
  usersList: User[] = [];
  pageSize = 15;
  pageIndex = 0;
  municipalityFilter = '';
  dateFrom: string | null = null;
  dateTo: string | null = null;
  filteredUsers: any[] = [];
  paginatedUsers: any[] = [];
  userDocumentMap: { [uid: string]: string | null } = {};
  urlDoc: string = "";
  userDocMap: Record<string, string | null | undefined> = {};
  private loadingUids = new Set<string>();
  calendarPageSize = 10;
  calendarPageIndex = 0;
  paginatedCalendars: calendar[] = [];
  ordersPageSizeOptions = [5, 10, 20, 40];
  ordersPageSize = 10;
  ordersPageIndex = 0;
  paginatedOrders: Appointment[] = [];


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
        this.getUsersList();
      }
    });
  }

  async getUsersList() {
    try {
      this.usersList = await this.appService.getUsersByCompany(this.user.uidCompany);
      console.log(this.usersList);

      this.applyFilters();
    } catch (e) {
      console.error(e);
      this.toastService.error('No se pudieron cargar los usuarios.', 'Sanico Drive Informa');
    }

  }

  calculateAge(birthDateString: string): number {
    const today = new Date();
    const birthDate = new Date(birthDateString);

    let age = today.getFullYear() - birthDate.getFullYear();
    const month = today.getMonth() - birthDate.getMonth();

    if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
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
            lastDateofSuscribe: normalizeDate(order.lastDateofSuscribe),
            folio: order.folio ?? ''
          };
        });

        this.preloadDocsForOrders(this.orders);

        /*  this.orders.sort((a, b) => {
           const dateA = a.requestedDate ? new Date(a.requestedDate).getTime() : 0;
           const dateB = b.requestedDate ? new Date(b.requestedDate).getTime() : 0;
           return dateB - dateA;
         }); */

        this.updateStatusCounts();
        this.selectedStatus = 'all';
        this.ordersPageIndex = 0;
        this.applyOrdersPagination();
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
    try {
      if (this.selectedCalendar?.uid) {
        await this.configService.updateCalendar(this.selectedCalendar.uid, this.selectedCalendar);

        this.toastService.success('Calendario actualizado con éxito.', 'Sanico Drive Informa');
      } else {
        if (!this.newCalendar?.title?.trim()) {
          this.toastService.error('El título es obligatorio.', 'Sanico Drive Informa');
          return;
        }
        if (!this.newCalendar?.startDate || !this.newCalendar?.endDate) {
          this.toastService.error('Fecha inicio y fin son obligatorias.', 'Sanico Drive Informa');
          return;
        }
        if (!this.newCalendar?.time) {
          this.toastService.error('La hora es obligatoria.', 'Sanico Drive Informa');
          return;
        }

        const newCal: calendar = {
          uidCompany: this.newCalendar.uidCompany ?? this.user.uidCompany,
          title: this.newCalendar.title.trim(),
          startDate: this.newCalendar.startDate,
          endDate: this.newCalendar.endDate,
          time: this.newCalendar.time,
          amountSpaces: this.newCalendar.amountSpaces ?? 0,
          maxSpaces: this.newCalendar.maxSpaces ?? 0,
          active: this.newCalendar.active ?? true,
          lastDateofSuscribe: this.newCalendar.lastDateofSuscribe ?? null,
          createdAt: new Date().toISOString(),
        };

        await this.configService.addCalendar(newCal);

        this.toastService.success('Calendario creado con éxito.', 'Sanico Drive Informa');
        this.newCalendar = {};
        this.cd.detectChanges();
      }

      await this.loadCalendars();
    } catch (error) {
      console.error('Error saving calendar:', error);
      this.toastService.error('No se pudo guardar el calendario. Intenta nuevamente.', 'Sanico Drive Informa');
    }
  }

  private timeOrder(t: string): number {
    return t === '9:00 AM' ? 9 : 13;
  }

  loadCalendars(): Promise<void> {

    return new Promise((resolve) => {
      this.configService.getCalendarList(this.user.uidCompany).subscribe({
        next: (data) => {

          this.calendarList = (data ?? []).sort((a, b) => {
            const da = new Date(a.startDate).getTime();
            const db = new Date(b.startDate).getTime();
            if (da !== db) return da - db;
            return this.timeOrder(a.time) - this.timeOrder(b.time);
          });
          this.calendarPageIndex = 0;
          this.applyCalendarPagination();

          this.cd.detectChanges();
          resolve();
        },
        error: (err) => {
          console.error('🔥 Error getCalendarList:', err);
          this.toastService.error('Error cargando calendarios (revisa consola).', 'Sanico Drive Informa');
          resolve();
        }
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
    const csvHeader = ['Nombre', 'Fecha', 'Hora', 'Comprobante', 'Identificacion'];
    const csvRows = ordersToExport.map(order => [
      order.nameofAsistent,
      order.requestedDate || '',
      order.requestedTime || '',
      order.urlFile || '',
      this.userDocMap[order.uidUser] || ''
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
    this.resetOrdersPagination();
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
      const newSpaces = calendar.amountSpaces;
      await this.appService.updateAppoinmentStatus(order.uid, 'approved');
      await this.configService.updateCalendar(calendar.uid!, { amountSpaces: newSpaces });
      this.toastService.success('Se aprobó la cita con éxito.', 'Sanico Drive Informa');
      this.sendNotification('La cita ha sido Aprobada.', user.token);
      this.sendEmail(user.email, 'Cita Aprobada', 'Aprobado', calendar.startDate, calendar.time, 'Tu cita ha sido Aprobada.');

      await this.loadCalendars();
      this.getAppointments();
      this.cd.detectChanges();

    } catch (err) {
      console.error(err);
      this.toastService.error('Error al aprobar la cita' + err, 'Sanico Drive Informa');
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
        newSpaces;
      }
      await this.appService.updateAppoinmentStatus(order.uid, 'rejected');
      await this.configService.updateCalendar(calendar.uid!, { amountSpaces: newSpaces });
      this.toastService.success('Se rechazó la cita con éxito.', 'Sanico Drive Informa');
      this.sendNotification('La cita ha sido rechazada, favor de validar.', user.token);
      this.sendEmail(user.email, 'Cita Rechazada', 'Rechazada', calendar.startDate, calendar.time, 'Tu cita ha sido Rechazada, favor de validar.');

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
    const newStatus = this.selectedStatusModal;
    const reason = (this.comments ?? '').trim();
    if (newStatus === 'canceled' && !reason) {
      this.toastService.error('Escribe la razón de cancelación.', 'SanNico Drive Informa');
      return;
    }

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
      await this.appService.updateAppoinmentStatus(order.uid, newStatus);
      const statusLabel =
        this.statusesList.find(s => s.value === newStatus)?.name
        ?? (newStatus.charAt(0).toUpperCase() + newStatus.slice(1));

      let title = `Cita ${statusLabel}`;
      let description = 'Tu cita ha cambiado de estado.';
      let statusWord = newStatus;
      if (newStatus === 'approved') {
        description = 'Tu cita ha sido Aceptada.';
        statusWord = 'Aceptada';
      } else if (newStatus === 'rejected') {
        description = 'Tu cita ha sido Rechazada, favor de validar.';
        statusWord = 'Rechazada';
      } else if (newStatus === 'finalize') {
        description = 'Tu cita ha sido Finalizada.';
        statusWord = 'Finalizada';
      } else if (newStatus === 'canceled') {
        title = 'Cita Cancelada';
        statusWord = 'Cancelada';
        description = `Tu cita ha sido Cancelada.\nRazón: ${reason}`;
      }

      await this.appService.addMessage({
        uidCompany: this.user.uidCompany,
        uidUser: user.uid,
        uidApoinment: order.uid,
        active: true,
        title,
        description,
        seen: false,
        createdAt: null
      });

      this.sendNotification(description, user.token);
      this.sendEmail(
        user.email,
        title,
        statusWord,
        calendar.startDate,
        calendar.time,
        description
      );

      this.toastService.success('Los cambios se guardaron con éxito.', 'Sanico Drive Informa');


      this.showModal = false;
      this.selectedOrder = null;
      this.selectedStatusModal = '';
      this.comments = '';

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
    this.resetOrdersPagination();
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

    const cal = this.calendarList.find(
      c => c.uid === this.selectedBitacoraCalendar
    );

    if (!cal || cal.amountSpaces == null) return 'N/A';

    const totalSpaces = 20;
    return totalSpaces - cal.amountSpaces;
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
          reference: order.reference ?? '',
          folio: order.folio ?? ''
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
      await this.configService.deleteCalendar(uid);
      await this.loadCalendars();
      this.cd.detectChanges();
    }
  }

  cancelEdit() {
    this.selectedCalendar = null;
    this.newCalendar = {
      title: '',
      time: '',
      maxSpaces: 0,
      startDate: '',
      endDate: '',
      lastDateofSuscribe: null,
    };
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

  exportUsers() {
    const hasFiltersActive =
      !!this.municipalityFilter?.trim() || !!this.dateFrom || !!this.dateTo;

    const listToExport = hasFiltersActive
      ? (this.filteredUsers ?? [])
      : (this.usersList ?? []);

    if (!listToExport.length) {
      this.toastService.error('No hay usuarios para exportar', 'Sanico Drive Informa');
      return;
    }
    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '';
      const s = String(val);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const toDate = (value: any): Date | null => {
      if (!value) return null;
      if (typeof value?.toDate === 'function') return value.toDate();
      if (value?.seconds) return new Date(value.seconds * 1000);
      if (value instanceof Date) return value;
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    };
    const formatDateForExcel = (value: any): string => {
      const d = toDate(value);
      if (!d) return '';
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    const csvHeader = [
      'Nombre',
      'Email',
      'Edad',
      'Teléfono',
      'Colonia',
      'Municipio',
      'Calle',
      'Fecha creación',
      'Código Postal',
      'Identificación'
    ];

    const csvRows = listToExport.map((u: any) => {
      const nombre = u.displayName || `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();

      return [
        nombre || '',
        u.email || '',
        u.age ? this.calculateAge(u.age) : '',
        u.phone || '',
        u.colony || '',
        u.municipality || '',
        u.street || '',
        formatDateForExcel(u.createdAt) || '',
        u.postalCode || '',
        u.urlDocument?.trim() ? u.urlDocument : null
      ].map(escapeCSV);
    });

    const csvContent = '\ufeff' + [csvHeader.map(escapeCSV), ...csvRows]
      .map(row => row.join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    const tag = hasFiltersActive ? 'filtrados' : 'todos';
    a.setAttribute('download', `usuarios-${tag}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  notifyUser(u: any) {

  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredUsers.length / this.pageSize));
  }

  get startItem(): number {
    return this.pageIndex * this.pageSize;
  }

  get endItem(): number {
    return Math.min(this.startItem + this.pageSize, this.filteredUsers.length);
  }

  applyFilters() {
    const muni = this.municipalityFilter.trim().toLowerCase();

    const from = this.dateFrom ? new Date(this.dateFrom + 'T00:00:00') : null;
    const to = this.dateTo ? new Date(this.dateTo + 'T23:59:59') : null;
    this.filteredUsers = (this.usersList ?? []).filter(u => {
      const uMuni = (u.municipality ?? '').toString().toLowerCase();
      const created = this.toDate((u as any).createdAt);
      const muniOk = !muni || uMuni.includes(muni);
      const dateFilteringActive = !!from || !!to;
      if (!dateFilteringActive) return muniOk;
      if (!created) return false;
      const fromOk = !from || created >= from;
      const toOk = !to || created <= to;
      return muniOk && fromOk && toOk;
    });

    this.pageIndex = 0;
    this.applyPagination();
    this.cd.detectChanges();
  }

  applyPagination() {
    const start = this.pageIndex * this.pageSize;
    this.paginatedUsers = this.filteredUsers.slice(start, start + this.pageSize);
  }

  nextPage() {
    if (this.pageIndex < this.totalPages - 1) {
      this.pageIndex++;
      this.applyPagination();
      this.cd.detectChanges();
    }
  }

  prevPage() {
    if (this.pageIndex > 0) {
      this.pageIndex--;
      this.applyPagination();
      this.cd.detectChanges();
    }
  }

  clearUserFilters() {
    this.municipalityFilter = '';
    this.dateFrom = null;
    this.dateTo = null;
    this.applyFilters();
  }

  private toDate(value: any): Date | null {
    if (!value) return null;
    if (typeof value?.toDate === 'function') return value.toDate();
    if (value?.seconds) return new Date(value.seconds * 1000);
    if (value instanceof Date) return value;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  async loadUserDocument(uidUser: string) {
    if (this.userDocMap[uidUser] !== undefined) return;
    if (this.loadingUids.has(uidUser)) return;
    this.loadingUids.add(uidUser);

    try {
      const user = await this.appService.getUserById(uidUser);

      if (!user) {
        this.userDocMap[uidUser] = null; // importante: marcar como "no hay"
        return;
      }

      this.userDocMap[uidUser] = user.urlDocument?.trim() ? user.urlDocument : null;

    } catch (e) {
      this.userDocMap[uidUser] = null;
    } finally {
      this.loadingUids.delete(uidUser);
    }
  }

  private async preloadDocsForOrders(orders: Appointment[]) {
    const uids = Array.from(
      new Set((orders ?? []).map(o => o.uidUser).filter(Boolean))
    );
    await Promise.all(uids.map(uid => this.loadUserDocument(uid)));
    this.cd.detectChanges();
  }

  onStatusChange() {
    if (this.selectedStatusModal !== 'canceled') {
      this.comments = '';
    }
  }

  private applyCalendarPagination() {
    const start = this.calendarPageIndex * this.calendarPageSize;
    this.paginatedCalendars = (this.calendarList ?? []).slice(start, start + this.calendarPageSize);
  }

  get calendarTotalPages(): number {
    return Math.max(1, Math.ceil((this.calendarList?.length ?? 0) / this.calendarPageSize));
  }

  nextCalendarPage() {
    if (this.calendarPageIndex < this.calendarTotalPages - 1) {
      this.calendarPageIndex++;
      this.applyCalendarPagination();
      this.cd.detectChanges();
    }
  }

  prevCalendarPage() {
    if (this.calendarPageIndex > 0) {
      this.calendarPageIndex--;
      this.applyCalendarPagination();
      this.cd.detectChanges();
    }
  }

  private applyOrdersPagination() {
    const list = this.filteredOrders();
    const start = this.ordersPageIndex * this.ordersPageSize;
    this.paginatedOrders = list.slice(start, start + this.ordersPageSize);
  }

  get ordersTotalPages(): number {
    const total = this.filteredOrders().length;
    return Math.max(1, Math.ceil(total / this.ordersPageSize));
  }

  nextOrdersPage() {
    if (this.ordersPageIndex < this.ordersTotalPages - 1) {
      this.ordersPageIndex++;
      this.applyOrdersPagination();
      this.cd.detectChanges();
    }
  }

  prevOrdersPage() {
    if (this.ordersPageIndex > 0) {
      this.ordersPageIndex--;
      this.applyOrdersPagination();
      this.cd.detectChanges();
    }
  }

  onOrdersPageSizeChange() {
    this.ordersPageIndex = 0;
    this.applyOrdersPagination();
    this.cd.detectChanges();
  }

  resetOrdersPagination() {
    this.ordersPageIndex = 0;
    this.applyOrdersPagination();
    this.cd.detectChanges();
  }

}

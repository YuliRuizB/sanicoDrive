import { Injectable } from "@angular/core";
import { Firestore, collection, query, where, collectionData, addDoc, Timestamp, doc, updateDoc, getDoc, orderBy, getDocs, serverTimestamp, setDoc } from "@angular/fire/firestore";
import { ToastService } from "./toast.service";
import { Observable, retry } from "rxjs";
import { User } from "../intarfaces/user";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { messages } from "../intarfaces/calendar";

@Injectable({
  providedIn: 'root'
})
export class AppointmentsService {
  constructor(
    private firestore: Firestore,
    private http: HttpClient,
    private toastService: ToastService
  ) { }

  getOrder(uidCompany: string): Observable<any[]> {
    const ordersRef = collection(this.firestore, 'appointments');
    const q = query(
      ordersRef,
      where('uidCompany', '==', uidCompany),
      where('active', '==', true)

    );

    return collectionData(q, { idField: 'uid' }) as Observable<any[]>;
  }

  getOrderBit(uidCompany: string, calendarId: string): Observable<any[]> {
    const ordersRef = collection(this.firestore, 'appointments');
    const q = query(
      ordersRef,
      where('uidCompany', '==', uidCompany),
      where('uidCalendar', '==', calendarId)
    );

    return collectionData(q, { idField: 'uid' }) as Observable<any[]>;
  }


  async getUsersByCompany(uidCompany: string): Promise<User[]> {
    const colRef = collection(this.firestore, 'users');

    const q = query(
      colRef,
      where('uidCompany', '==', uidCompany),
      orderBy('createTimeStamp', 'desc')
    );

    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      ...(d.data() as User),
      uid: d.id
    }));
  }

  async getUserById(uid: string): Promise<User | null> {
    const userRef = doc(this.firestore, `users/${uid}`);
    const snapshot = await getDoc(userRef);
    return snapshot.exists() ? (snapshot.data() as User) : null;
  }


  updateAppoinmentStatus(appointmentUid: string, status: string) {
    const apptRef = doc(this.firestore, `appointments/${appointmentUid}`);
    return updateDoc(apptRef, { status: status });
  }

  updateCalendar(calendarUid: string, amountSpaces: number) {
    const calendarRef = doc(this.firestore, `calendar/${calendarUid}`);
    return updateDoc(calendarRef, { amountSpaces: amountSpaces });
  }

  updateAppoinmentStatusActive(appointmentUid: string, active: boolean) {
    const apptRef = doc(this.firestore, `appointments/${appointmentUid}`);
    return updateDoc(apptRef, { active: active });
  }

  updateAppointmentDetails(appointmentUid: string, data: any) {
    const apptRef = doc(this.firestore, `appointments/${appointmentUid}`);
    return updateDoc(apptRef, data);
  }

  async seedAppointments() {
    const appointmentsRef = collection(this.firestore, 'appointments');

    const baseData = {
      active: true,
      nameofAsistent: "leonel muñoz",
      uidCompany: "uHROo7SIDL7kJqr1fUER",
      uidUser: "rMYdgmF0kgSmNWlHTfx4ej9LJfS2",
      status: "pending",
      createdDate: new Date()
    };

    const dates = [
      new Date("2025-10-07T10:00:00"),
      new Date("2025-10-08T10:00:00"),
      new Date("2025-10-09T10:00:00")
    ];

    for (const d of dates) {
      await addDoc(appointmentsRef, {
        ...baseData,
        requestedDateComplete: Timestamp.fromDate(d),
        requestedDate: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
        requestedTime: new Date(1970, 0, 1, d.getHours(), d.getMinutes()),
      });
    }
  }

  public pushNotifications(title: string, desc: string, token: string): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }),
    };
    const api = `https://us-central1-citassn-bde85.cloudfunctions.net/sendPushNotification`;
    const body = {
      title: title,
      description: desc,
      token: token
    };

    return this.http.post(api, body, httpOptions).pipe(
      retry(0)
    );
  }

  public sendEmail(title: string, email: string, subject: string,
    status: string, date: string, time: string, msg: string
  ): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }),
    };

    const api = `https://us-central1-citassn-bde85.cloudfunctions.net/sendEmail`;

    const body = {
      title: title,
      email: email,
      subject: subject,
      status: status,
      date: date,
      time: time,
      msg: msg
    };

    return this.http.post(api, body, httpOptions).pipe(
      retry(0)
    );
  }

  async deactivateUserByEmail(email: string): Promise<boolean> {
    try {
      const usersRef = collection(this.firestore, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.warn(`No se encontró ningún usuario con el correo: ${email}`);
        return false;
      }

      const userDoc = querySnapshot.docs[0];
      const userRef = doc(this.firestore, `users/${userDoc.id}`);

      await updateDoc(userRef, { activate: false });

      return true;
    } catch (error) {
      console.error('Error al desactivar usuario por correo:', error);
      return false;
    }
  }

  addMessage(data: Omit<messages, 'uid'>) {
    const messagesRef = collection(this.firestore, 'messages');
    const docRef = doc(messagesRef); // genera ID automático

    return setDoc(docRef, {
      ...data,
      idDoc: docRef.id,
      createdAt: serverTimestamp()
    });
  }
}

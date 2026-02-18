import { Injectable } from "@angular/core";
import { addDoc, collection, deleteDoc, doc, docData, DocumentData, Firestore, getDocs, limit, orderBy, query, QueryDocumentSnapshot, startAfter, updateDoc, where } from "@angular/fire/firestore";
import { ToastService } from "./toast.service";
import { Observable } from "rxjs";
import { collectionData } from "@angular/fire/firestore";
import { calendar } from "../intarfaces/calendar";
import { User } from "../intarfaces/user";

@Injectable({
    providedIn: 'root'
})

export class configurationService {

  private lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;
    constructor(
        private firestore: Firestore,
        private toastService: ToastService
    ) { }

   getCalendarList(uidCompany: string): Observable<any[]> {
    const ref = collection(this.firestore, 'calendar');

    const q = query(
      ref,
      where('uidCompany', '==', uidCompany),
      orderBy('createdAt', 'asc')//,
      //limit(10)
    );

    return collectionData(q, { idField: 'uid' }) as Observable<any[]>;
  }

    async addCalendar(data: calendar) {
        const calRef = collection(this.firestore, 'calendar');
        const docRef = await addDoc(calRef, data);
        await updateDoc(docRef, { uid: docRef.id });
    }

    async updateCalendar(uid: string, data: Partial<calendar>) {
        const docRef = doc(this.firestore, 'calendar', uid);
        await updateDoc(docRef, data);
    }

    async deleteCalendar(uid: string) {
        const docRef = doc(this.firestore, 'calendar', uid);
        await deleteDoc(docRef);
    }

    getUserById(uid: string): Observable<User | null> {
    const userRef = doc(this.firestore, `users/${uid}`);
    return docData(userRef, { idField: 'uid' }) as Observable<User>;
  }

  async getNextPage(uidCompany: string): Promise<any[]> {
    const ref = collection(this.firestore, 'calendar');

    if (!this.lastDoc) return [];

    const q = query(
      ref,
      where('uidCompany', '==', uidCompany),
      orderBy('lastDateofSuscribe', 'desc'),
     // startAfter(this.lastDoc),
     // limit(10)
    );

    const snap = await getDocs(q);
    this.lastDoc = snap.docs[snap.docs.length - 1] ?? this.lastDoc;

    return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
  }

  // primera página (imperativo) para poder setear lastDoc
  async getFirstPage(uidCompany: string): Promise<any[]> {
    const ref = collection(this.firestore, 'calendar');

    const q = query(
      ref,
      where('uidCompany', '==', uidCompany),
      orderBy('lastDateofSuscribe', 'desc'),
      limit(10)
    );

    const snap = await getDocs(q);
    this.lastDoc = snap.docs[snap.docs.length - 1] ?? null;

    return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
  }

  resetPagination() {
    this.lastDoc = null;
  }


}
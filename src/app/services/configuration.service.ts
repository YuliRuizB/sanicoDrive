import { Injectable } from "@angular/core";
import { addDoc, collection, deleteDoc, doc, Firestore, query, updateDoc, where } from "@angular/fire/firestore";
import { ToastService } from "./toast.service";
import { Observable } from "rxjs";
import { collectionData } from "@angular/fire/firestore";
import { calendar } from "../intarfaces/calendar";

@Injectable({
    providedIn: 'root'
})

export class configurationService {
    constructor(
        private firestore: Firestore,
        private toastService: ToastService
    ) { }

    getCalendarList(uidCompany: string): Observable<any[]> {
        const ordersRef = collection(this.firestore, 'calendar');
        const q = query(
            ordersRef,
            where('uidCompany', '==', uidCompany)
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

}
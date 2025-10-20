import { Timestamp } from "firebase/firestore";

export interface Appointment {
  active: boolean;
  createdDate: Date | null;
  nameofAsistent: string;
  requestedDateComplete?: Timestamp;
  requestedDate: string;
  requestedTime: string;
  status: string; // 'pending' | 'approved' | 'complete' | 'canceled' | string;
  uid: string;
  reference:string;
  uidCompany: string;
  uidCalendar:string;
  uidUser: string;
  urlFile?: string;
}

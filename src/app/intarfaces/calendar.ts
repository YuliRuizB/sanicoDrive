import { Timestamp } from "firebase/firestore";

export interface calendar {
    uid?: string;
    uidCompany: string;
    title: string;
    startDate: string;
    endDate: string;
    time: string;
    amountSpaces: number;
    maxSpaces: number;
    createdAt: string;
    active: boolean;
    lastDateofSuscribe?: Timestamp | null; 
}


export interface messages {
    uid: string;
    active:boolean
    uidApoinment:string;
    uidCompany: string;
    uidUser:string;
    title: string;
    description:string;
    createdAt : Timestamp | null; 
    seen : boolean ;
    idDoc?: string;
}
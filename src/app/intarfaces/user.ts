import { Time } from "@angular/common";
import { Timestamp } from "firebase/firestore";

export interface User  {
  firstName: string;
  lastName: string;
  displayName?: string;
  nameOfAssistant?: string;
  email: string;
  phone: number;
  street?: string;
  colony?: string;
  country?:string;
  state: string;
  postalCode?: string;
  uidCompany: string;
  uid: string;
  activate: boolean;
  phoneInfo?: object | any;
  terms: boolean;
  createdAt: string;
  createTimeStamp?: Timestamp;
  role?: string;
  token:string;
  urlDocument?:string;
  municipality?:string;
  
}
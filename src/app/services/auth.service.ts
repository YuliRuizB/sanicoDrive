import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged, User as FirebaseUser } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc, Timestamp } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { sendEmailVerification } from 'firebase/auth';
import { BehaviorSubject } from 'rxjs';
import { User } from '../intarfaces/user';
import { ToastService } from './toast.service';
@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private userSource = new BehaviorSubject<User | null>(null);
    user$ = this.userSource.asObservable();

    constructor(
        private toastService: ToastService,
        private auth: Auth,
        private firestore: Firestore,
        private router: Router
    ) {       
        onAuthStateChanged(this.auth, async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                const userRef = doc(this.firestore, 'users', firebaseUser.uid);
                const snap = await getDoc(userRef);

                if (snap.exists()) {
                    const data = snap.data() as User;
                    this.userSource.next(data);
                    localStorage.setItem('user', JSON.stringify(data));
                } else {                    
                    this.userSource.next({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email || '',
                        firstName: '',
                        lastName: '',
                        displayName: firebaseUser.email || '',
                        nameOfAssistant: '',
                        phone: 0,
                        street: '',
                        colony: '',
                        state: '',
                        uidCompany: '',
                        activate: true,
                        phoneInfo: {},
                        terms: false,
                        createdAt: new Date().toISOString(),
                        createTimeStamp: Timestamp.now(),
                        role: 'admin',
                        token: ''
                    });
                }
            } else {
                this.userSource.next(null);
                localStorage.removeItem('user');
            }
        });
    }

    isAuthenticated(): boolean {
        return !!localStorage.getItem('user');
    }
   
    async login(email: string, password: string) {
        try {
            if (!email || !password) {
                this.toastService.error('Escriba por favor sus datos para tener acceso','Sanico Drive Informa');
                return;
            }

            const result = await signInWithEmailAndPassword(this.auth, email, password);
            const uid = result.user.uid;           
          
            const userRef = doc(this.firestore, 'users', uid);
            const snap = await getDoc(userRef);

            if (snap.exists()) {
                const data = snap.data() as User;
                this.userSource.next(data);                           
                if (data.role !== 'admin') {
                    this.toastService.error('No tienes acceso a este sistema', 'Sanico Drive Informa');
                    throw new Error('No tienes acceso a este sistema');
                }
                localStorage.setItem('user', JSON.stringify(data));
                this.router.navigate(['home']);
            } else {
                this.toastService.error('No se encontraron datos de usuario en Firestore', 'Sanico Drive Informa');
                throw new Error('No se encontraron datos de usuario en Firestore');
            }

            return result.user;

        } catch (error: any) {          
            let message = 'Escriba por favor sus datos para tener acceso';
            if (error.code === 'auth/invalid-email') {
                message = 'Correo inválido';
            } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                message = 'Correo o contraseña incorrectos';
            } else if (error.code === 'auth/invalid-credential') {
                message = 'Credenciales inválidas';
            } 
            this.toastService.error(message,'Sanico Drive Informa');
             return;
        }
    }
   
    async register(form: Partial<User> & { password: string }) {
        const cred = await createUserWithEmailAndPassword(this.auth, form.email!, form.password!);

        const userData: User = {
            uid: cred.user.uid,
            firstName: form.firstName || '',
            lastName: form.lastName || '',
            displayName: `${form.firstName || ''} ${form.lastName || ''}`.trim(),
            nameOfAssistant: form.nameOfAssistant || '',
            email: form.email!,
            phone: form.phone || 0,
            street: form.street || '',
            colony: form.colony || '',
            state: form.state || '',
            uidCompany: form.uidCompany || '',
            activate: form.activate ?? true,
            phoneInfo: form.phoneInfo || {},
            terms: form.terms ?? false,
            createdAt: form.createdAt ? form.createdAt : new Date().toISOString(),
            createTimeStamp: Timestamp.now(),
            role: form.role || 'user',
            token:form.token || ''
        };

        const userRef = doc(this.firestore, 'users', cred.user.uid);
        await setDoc(userRef, userData, { merge: true });

        this.userSource.next(userData);
        localStorage.setItem('user', JSON.stringify(userData));       
        if (!cred.user.emailVerified) {
            await sendEmailVerification(cred.user);
        }

        return cred.user;
    }
    
    forgotPassword(email: string) {
        return sendPasswordResetEmail(this.auth, email);
    }
    
    async logout() {
        await signOut(this.auth);
        this.userSource.next(null);
        localStorage.removeItem('user');
        this.router.navigate(['auth/login']);
    }
}

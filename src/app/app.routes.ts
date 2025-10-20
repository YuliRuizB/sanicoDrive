import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { RegisterComponent } from './auth/register/register';
import { ForgotComponent } from './auth/forgot/forgot';
import { HomeComponent } from './pages/home/home';
import { AuthGuard } from './guards/auth.guard';
import { TermsComponent } from './pages/terms/terms';
import { Policy } from './pages/policy/policy';
import { DownPage } from './pages/down-page/down-page';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'forgot', component: ForgotComponent },
    { path: 'terms', component: TermsComponent },
    { path: 'policy', component: Policy },
   { path: 'downpage', component: DownPage },
    { path: 'home', component: HomeComponent, canActivate: [AuthGuard] }, 
    { path: '**', redirectTo: 'login' }
      
];
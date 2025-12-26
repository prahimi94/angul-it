import { Routes } from '@angular/router';
import { CaptchaComponent } from './captcha/captcha.component';
import { HomeComponent } from './home/home.component';
import { ResultComponent } from './result/result.component';
import { resultGuard } from './guards/result.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'challenge', component: CaptchaComponent },
  { path: 'result', component: ResultComponent, canActivate: [resultGuard] },
  { path: '**', redirectTo: '' }
];

import { Routes } from '@angular/router';
import { CaptchaComponent } from '../components/captcha/captcha.component';
import { HomeComponent } from '../components/home/home.component';
import { NotFoundComponent } from '../components/not-found/not-found.component';
import { ResultComponent } from '../components/result/result.component';
import { completionGuard } from '../guards/completion.guard';
import { resultGuard } from '../guards/result.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'challenge', component: CaptchaComponent, canActivate: [completionGuard] },
  { path: 'result', component: ResultComponent, canActivate: [resultGuard] },
  { path: '**', component: NotFoundComponent }
];

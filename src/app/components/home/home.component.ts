import { Component } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { Router, RouterLink } from '@angular/router';
import { CaptchaStateService } from '../../services/captcha-state.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  animations: [
    trigger('stepTransition', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(12px)' }),
        animate('680ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('560ms ease-in', style({ opacity: 0, transform: 'translateY(-12px)' }))
      ]),
      transition('* <=> *', [
        style({ opacity: 0.2, transform: 'translateY(8px)' }),
        animate('840ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class HomeComponent {
  constructor(
    private readonly router: Router,
    private readonly state: CaptchaStateService
  ) {}

  startChallenge(): void {
    this.state.startNewSession();
    this.router.navigate(['/challenge']);
  }
}

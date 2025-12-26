import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CaptchaStateService } from '../../services/captcha-state.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
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

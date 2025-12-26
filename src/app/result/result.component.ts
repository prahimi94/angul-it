import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CaptchaStateService } from '../services/captcha-state.service';

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './result.component.html',
  styleUrl: './result.component.css'
})
export class ResultComponent {
  private readonly state = inject(CaptchaStateService);
  private readonly router = inject(Router);

  readonly session = this.state.session;

  startOver(): void {
    this.state.reset();
    this.router.navigate(['/challenge']);
  }

  correctCount(): number {
    return this.session().challenges.filter((challenge) => this.isCorrect(challenge.id)).length;
  }

  incorrectCount(): number {
    return this.session().challenges.length - this.correctCount();
  }

  successRate(): number {
    const total = this.session().challenges.length;
    if (!total) {
      return 0;
    }
    return Math.round((this.correctCount() / total) * 100);
  }

  isCorrect(challengeId: string): boolean {
    return this.session().progress[challengeId]?.correct ?? false;
  }

  formatAnswer(answer: unknown): string {
    if (Array.isArray(answer)) {
      return answer.join(', ');
    }
    if (answer === null || answer === undefined || answer === '') {
      return 'No response';
    }
    return String(answer);
  }
}

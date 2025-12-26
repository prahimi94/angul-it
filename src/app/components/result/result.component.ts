import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ChallengeAttempt } from '../../models/captcha.models';
import { CaptchaStateService } from '../../services/captcha-state.service';

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
  readonly minSuccessRate = 70;

  startOver(): void {
    this.state.reset();
    this.router.navigate(['/challenge']);
  }

  correctCount(): number {
    return this.session()
      .challenges.map((challenge) => this.attemptsFor(challenge.id))
      .flat()
      .filter((attempt) => attempt.correct).length;
  }

  incorrectCount(): number {
    return this.totalAttempts() - this.correctCount();
  }

  successRate(): number {
    const total = this.totalAttempts();
    if (!total) {
      return 0;
    }
    return Math.round((this.correctCount() / total) * 100);
  }

  totalAttempts(): number {
    return this.session()
      .challenges.map((challenge) => this.attemptsFor(challenge.id).length)
      .reduce((sum, count) => sum + count, 0);
  }

  isVerified(): boolean {
    return this.successRate() >= this.minSuccessRate;
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

  correctAttemptsFor(challengeId: string): number {
    return this.attemptsFor(challengeId).filter((attempt) => attempt.correct).length;
  }

  incorrectAttemptsFor(challengeId: string): number {
    return this.attemptsFor(challengeId).filter((attempt) => !attempt.correct).length;
  }

  successRateFor(challengeId: string): number {
    const attempts = this.attemptsFor(challengeId);
    if (!attempts.length) {
      return 0;
    }
    const correct = attempts.filter((attempt) => attempt.correct).length;
    return Math.round((correct / attempts.length) * 100);
  }

  private attemptsFor(challengeId: string): ChallengeAttempt[] {
    const progress = this.session().progress[challengeId];
    if (!progress) {
      return [];
    }
    if (Array.isArray(progress.attempts)) {
      return progress.attempts;
    }
    const answer = progress.answer ?? null;
    if (Array.isArray(answer) && answer.length === 0) {
      return [];
    }
    if (typeof answer === 'string' && answer.trim().length === 0) {
      return [];
    }
    if (answer === null) {
      return [];
    }
    return [
      {
        answer,
        correct: progress.correct,
        at: this.session().createdAt
      }
    ];
  }
}

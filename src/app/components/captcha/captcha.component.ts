import { CommonModule } from '@angular/common';
import { Component, OnDestroy, computed, effect, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';
import { CaptchaStateService } from '../../services/captcha-state.service';
import { Challenge, ChallengeProgress } from '../../models/captcha.models';

@Component({
  selector: 'app-captcha',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './captcha.component.html',
  styleUrl: './captcha.component.css',
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
export class CaptchaComponent implements OnDestroy {
  private readonly state = inject(CaptchaStateService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private lastChallengeId: string | null = null;
  private lastSessionId: string | null = null;
  readonly toastQueue: string[] = [];

  readonly session = this.state.session;
  readonly currentChallenge = this.state.currentChallenge;
  readonly currentIndex = computed(() => this.session().currentIndex);
  readonly totalSteps = computed(() => this.session().challenges.length);
  readonly imageChallenge = computed(() => {
    const challenge = this.currentChallenge();
    return challenge?.type === 'image' ? challenge : null;
  });
  readonly mathChallenge = computed(() => {
    const challenge = this.currentChallenge();
    return challenge?.type === 'math' ? challenge : null;
  });
  readonly textChallenge = computed(() => {
    const challenge = this.currentChallenge();
    return challenge?.type === 'text' ? challenge : null;
  });

  form: FormGroup = this.fb.group({});
  private formSubscription?: Subscription;

  constructor() {
    this.state.ensureSession();

    effect(() => {
      const sessionId = this.session().sessionId;
      const challenge = this.currentChallenge();
      if (challenge && (challenge.id !== this.lastChallengeId || sessionId !== this.lastSessionId)) {
        this.lastChallengeId = challenge.id;
        this.lastSessionId = sessionId;
        this.toastQueue.length = 0;
        this.form = this.buildForm(challenge);
        this.formSubscription?.unsubscribe();
        this.formSubscription = this.form.valueChanges.subscribe(() => this.persistProgress());
      }
    });
  }

  ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
  }

  toggleSelection(optionId: string): void {
    const control = this.form.get('selections') as FormControl<string[]> | null;
    if (!control) {
      return;
    }
    const current = new Set(control.value ?? []);
    if (current.has(optionId)) {
      current.delete(optionId);
    } else {
      current.add(optionId);
    }
    control.setValue(Array.from(current));
    control.markAsDirty();
  }

  isSelected(optionId: string): boolean {
    const control = this.form.get('selections') as FormControl<string[]> | null;
    return control?.value?.includes(optionId) ?? false;
  }

  goBack(): void {
    this.persistProgress();
    this.state.goToIndex(this.currentIndex() - 1);
  }

  goNext(): void {
    const challenge = this.currentChallenge();
    if (!challenge) {
      return;
    }

    this.recordAttempt(challenge);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.enqueueToast(this.resolveErrorMessage(challenge));
      return;
    }

    this.toastQueue.length = 0;

    if (this.currentIndex() + 1 >= this.totalSteps()) {
      this.state.markCompleted();
      this.router.navigate(['/result'], { replaceUrl: true });
      return;
    }

    this.state.goToIndex(this.currentIndex() + 1);
  }

  sanitizeNumberInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    if (!target) {
      return;
    }
    const sanitized = target.value.replace(/[^0-9]/g, '');
    if (sanitized !== target.value) {
      target.value = sanitized;
      const control = this.form.get('answer') as FormControl<string> | null;
      control?.setValue(sanitized);
    }
  }

  private resolveErrorMessage(challenge: Challenge): string | null {
    if (challenge.type === 'image') {
      const control = this.form.get('selections');
      if (!control || !control.errors) {
        return null;
      }
      if (control.errors['required']) {
        return 'Select at least one tile.';
      }
      if (control.errors['incorrect']) {
        return 'That selection does not match the target tiles.';
      }
    }

    if (challenge.type === 'math') {
      const control = this.form.get('answer');
      if (!control || !control.errors) {
        return null;
      }
      if (control.errors['required']) {
        return 'Enter the answer to continue.';
      }
      if (control.errors['incorrect']) {
        return 'That answer is not correct.';
      }
    }

    if (challenge.type === 'text') {
      const control = this.form.get('answer');
      if (!control || !control.errors) {
        return null;
      }
      if (control.errors['required']) {
        return 'Type the requested text to continue.';
      }
      if (control.errors['incorrect']) {
        return 'That entry does not match.';
      }
    }

    return null;
  }

  private enqueueToast(message: string | null): void {
    if (!message) {
      return;
    }
    this.toastQueue.push(message);
    window.setTimeout(() => {
      const index = this.toastQueue.indexOf(message);
      if (index !== -1) {
        this.toastQueue.splice(index, 1);
      }
    }, 3600);
  }


  private buildForm(challenge: Challenge): FormGroup {
    const saved = this.session().progress[challenge.id];

    if (challenge.type === 'image') {
      const selections = Array.isArray(saved?.answer) ? saved.answer : [];
      return this.fb.group({
        selections: new FormControl<string[]>(selections, {
          validators: [requiredArray, exactSelection(challenge.solutionIds)]
        })
      });
    }

    if (challenge.type === 'math') {
      const value = typeof saved?.answer === 'number' ? String(saved.answer) : '';
      return this.fb.group({
        answer: new FormControl<string>(value, {
          validators: [Validators.required, exactNumber(challenge.solution)]
        })
      });
    }

    const value = typeof saved?.answer === 'string' ? saved.answer : '';
    return this.fb.group({
      answer: new FormControl<string>(value, {
        validators: [Validators.required, exactText(challenge.solution)]
      })
    });
  }

  private persistProgress(): void {
    const challenge = this.currentChallenge();
    if (!challenge) {
      return;
    }

    const progress = this.extractProgress(challenge);
    this.state.updateProgress(challenge.id, progress);
  }

  private recordAttempt(challenge: Challenge): void {
    const progress = this.extractProgress(challenge);
    this.state.recordAttempt(challenge.id, progress);
  }

  private extractProgress(challenge: Challenge): ChallengeProgress {
    if (challenge.type === 'image') {
      const control = this.form.get('selections') as FormControl<string[]> | null;
      const selections = control?.value ?? [];
      const correct = isSameSet(selections, challenge.solutionIds);
      return { answer: selections, correct };
    }

    if (challenge.type === 'math') {
      const control = this.form.get('answer') as FormControl<string> | null;
      const raw = `${control?.value ?? ''}`.trim();
      if (!raw) {
        return { answer: null, correct: false };
      }
      const value = Number(raw);
      const correct = value === challenge.solution;
      return { answer: Number.isNaN(value) ? raw : value, correct };
    }

    const control = this.form.get('answer') as FormControl<string> | null;
    const raw = control?.value ?? '';
    const normalized = raw.trim();
    if (!normalized) {
      return { answer: null, correct: false };
    }
    const correct = normalized.toLowerCase() === challenge.solution.toLowerCase();
    return { answer: normalized, correct };
  }

}

function requiredArray(control: AbstractControl<string[] | null>): ValidationErrors | null {
  const value = control.value ?? [];
  return Array.isArray(value) && value.length > 0 ? null : { required: true };
}

function exactSelection(expected: string[]) {
  return (control: AbstractControl<string[] | null>): ValidationErrors | null => {
    const value = control.value ?? [];
    if (!Array.isArray(value) || value.length === 0) {
      return null;
    }
    return isSameSet(value, expected) ? null : { incorrect: true };
  };
}

function exactNumber(expected: number) {
  return (control: AbstractControl<string | null>): ValidationErrors | null => {
    const raw = control.value ?? '';
    if (raw === '') {
      return null;
    }
    const value = Number(raw);
    return value === expected ? null : { incorrect: true };
  };
}

function exactText(expected: string) {
  return (control: AbstractControl<string | null>): ValidationErrors | null => {
    const raw = control.value ?? '';
    if (raw === '') {
      return null;
    }
    return raw.trim().toLowerCase() === expected.toLowerCase() ? null : { incorrect: true };
  };
}

function isSameSet(value: string[], expected: string[]): boolean {
  if (value.length !== expected.length) {
    return false;
  }
  const sortedValue = [...value].sort();
  const sortedExpected = [...expected].sort();
  return sortedValue.every((item, index) => item === sortedExpected[index]);
}

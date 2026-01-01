import { Injectable, computed, signal } from '@angular/core';
import {
  CaptchaSessionState,
  Challenge,
  ChallengeProgress,
  ImageChallenge,
  MathChallenge,
  TextChallenge
} from '../models/captcha.models';

const STORAGE_KEY = 'angul-it-session';

const IMAGE_CHALLENGE_TEMPLATES: ImageChallenge[] = [
  {
    id: 'img-trees',
    type: 'image',
    prompt: "Select all 'Tree' tiles",
    options: [
      { id: 't1', label: 'Tree', detail: 'Pine', icon: 'assets/icons/trees/t1.png' },
      { id: 't2', label: 'Car', detail: 'Sedan', icon: 'assets/icons/trees/t2.png' },
      { id: 't3', label: 'Tree', detail: 'Oak', icon: 'assets/icons/trees/t3.png' },
      { id: 't4', label: 'House', detail: 'Brick', icon: 'assets/icons/trees/t4.png' },
      { id: 't5', label: 'Tree', detail: 'Maple', icon: 'assets/icons/trees/t5.png' },
      { id: 't6', label: 'Cloud', detail: 'Cirrus', icon: 'assets/icons/trees/t6.png' },
      { id: 't7', label: 'River', detail: 'Stream', icon: 'assets/icons/trees/t7.png' },
      { id: 't8', label: 'Tree', detail: 'Cedar', icon: 'assets/icons/trees/t8.png' },
      { id: 't9', label: 'Bridge', detail: 'Steel', icon: 'assets/icons/trees/t9.png' }
    ],
    solutionIds: ['t1', 't3', 't5', 't8']
  },
  {
    id: 'img-bikes',
    type: 'image',
    prompt: "Select all 'Bike' tiles",
    options: [
      { id: 'b1', label: 'Bike', detail: 'Road', icon: 'assets/icons/bikes/b1.png' },
      { id: 'b2', label: 'Bus', detail: 'Transit', icon: 'assets/icons/bikes/b2.png' },
      { id: 'b3', label: 'Bike', detail: 'Cargo', icon: 'assets/icons/bikes/b3.png' },
      { id: 'b4', label: 'Taxi', detail: 'Cab', icon: 'assets/icons/bikes/b4.png' },
      { id: 'b5', label: 'Bike', detail: 'Hybrid', icon: 'assets/icons/bikes/b5.png' },
      { id: 'b6', label: 'Train', detail: 'Metro', icon: 'assets/icons/bikes/b6.png' },
      { id: 'b7', label: 'Bike', detail: 'Trail', icon: 'assets/icons/bikes/b7.png' },
      { id: 'b8', label: 'Truck', detail: 'Delivery', icon: 'assets/icons/bikes/b8.png' },
      { id: 'b9', label: 'Boat', detail: 'Ferry', icon: 'assets/icons/bikes/b9.png' }
    ],
    solutionIds: ['b1', 'b3', 'b5', 'b7']
  },
  {
    id: 'img-clouds',
    type: 'image',
    prompt: "Select all 'Cloud' tiles",
    options: [
      { id: 'c1', label: 'Cloud', detail: 'Fluffy', icon: 'assets/icons/clouds/c1.png' },
      { id: 'c2', label: 'Star', detail: 'Bright', icon: 'assets/icons/clouds/c2.png' },
      { id: 'c3', label: 'Cloud', detail: 'Layered', icon: 'assets/icons/clouds/c3.png' },
      { id: 'c4', label: 'Moon', detail: 'Crescent', icon: 'assets/icons/clouds/c4.png' },
      { id: 'c5', label: 'Cloud', detail: 'Stormy', icon: 'assets/icons/clouds/c5.png' },
      { id: 'c6', label: 'Sun', detail: 'Warm', icon: 'assets/icons/clouds/c6.png' },
      { id: 'c7', label: 'Cloud', detail: 'High', icon: 'assets/icons/clouds/c7.png' },
      { id: 'c8', label: 'Plane', detail: 'Jet', icon: 'assets/icons/clouds/c8.png' },
      { id: 'c9', label: 'Hill', detail: 'Rolling', icon: 'assets/icons/clouds/c9.png' }
    ],
    solutionIds: ['c1', 'c3', 'c5', 'c7']
  }
];

@Injectable({ providedIn: 'root' })
export class CaptchaStateService {
  private readonly state = signal<CaptchaSessionState>(this.loadState() ?? this.emptyState());

  readonly session = computed(() => this.state());
  readonly currentChallenge = computed(() => {
    const state = this.state();
    return state.challenges[state.currentIndex] ?? null;
  });

  ensureSession(): void {
    const state = this.state();
    if (!state.challenges.length) {
      this.startNewSession();
    }
  }

  startNewSession(): void {
    const now = Date.now();
    const challenges = this.buildChallenges().map((challenge, index) => {
      if (challenge.type === 'image') {
        const cloned: ImageChallenge = {
          ...challenge,
          options: [...challenge.options]
        };
        return index === 0 ? this.randomizeImageChallenge(cloned) : cloned;
      }
      if (challenge.type === 'math') {
        const cloned: MathChallenge = { ...challenge };
        return index === 1 ? this.randomizeMathChallenge(cloned) : cloned;
      }
      if (challenge.type === 'text') {
        const cloned: TextChallenge = { ...challenge };
        return index === 2 ? this.randomizeTextChallenge(cloned) : cloned;
      }
      return challenge;
    });
    const newState: CaptchaSessionState = {
      sessionId: this.generateId(),
      createdAt: now,
      currentIndex: 0,
      completed: false,
      setId: 'dynamic',
      challenges,
      progress: {}
    };
    this.setState(newState);
  }

  updateProgress(challengeId: string, progress: ChallengeProgress): void {
    const state = this.state();
    const existing = state.progress[challengeId];
    const attempts = Array.isArray(existing?.attempts) ? existing.attempts : [];
    const updated: CaptchaSessionState = {
      ...state,
      progress: {
        ...state.progress,
        [challengeId]: {
          ...progress,
          attempts
        }
      }
    };
    this.setState(updated);
  }

  recordAttempt(challengeId: string, progress: ChallengeProgress): void {
    const state = this.state();
    const existing = state.progress[challengeId];
    const attempts = Array.isArray(existing?.attempts) ? existing.attempts : [];
    const updated: CaptchaSessionState = {
      ...state,
      progress: {
        ...state.progress,
        [challengeId]: {
          ...progress,
          attempts: [
            ...attempts,
            {
              answer: progress.answer ?? null,
              correct: progress.correct,
              at: Date.now()
            }
          ]
        }
      }
    };
    this.setState(updated);
  }

  goToIndex(nextIndex: number): void {
    const state = this.state();
    const clamped = Math.max(0, Math.min(nextIndex, state.challenges.length - 1));
    this.setState({ ...state, currentIndex: clamped });
  }

  markCompleted(): void {
    const state = this.state();
    this.setState({ ...state, completed: true });
  }

  reset(): void {
    this.startNewSession();
  }

  isCompleted(): boolean {
    return this.state().completed;
  }

  private setState(state: CaptchaSessionState): void {
    this.state.set(state);
    this.persist(state);
  }

  private emptyState(): CaptchaSessionState {
    return {
      sessionId: '',
      createdAt: 0,
      currentIndex: 0,
      completed: false,
      setId: '',
      challenges: [],
      progress: {}
    };
  }

  private loadState(): CaptchaSessionState | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as CaptchaSessionState;
      if (!parsed || !Array.isArray(parsed.challenges)) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private persist(state: CaptchaSessionState): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  private generateId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `session-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  private randomizeImageChallenge(challenge: ImageChallenge): ImageChallenge {
    const correctIds = new Set(challenge.solutionIds);
    const correct = this.shuffle(challenge.options.filter((option) => correctIds.has(option.id)));
    const incorrect = this.shuffle(challenge.options.filter((option) => !correctIds.has(option.id)));
    const minCorrect = Math.min(1, correct.length);
    const maxCorrect = correct.length;
    const correctCount = maxCorrect ? this.randomInt(minCorrect, maxCorrect) : 0;
    const pickedCorrect = correct.slice(0, correctCount);
    const minIncorrect = Math.min(2, incorrect.length);
    const maxIncorrect = incorrect.length;
    const incorrectCount = maxIncorrect
      ? this.randomInt(minIncorrect || 1, maxIncorrect)
      : 0;
    const pickedIncorrect = incorrect.slice(0, incorrectCount);
    return {
      ...challenge,
      solutionIds: pickedCorrect.map((option) => option.id),
      options: this.shuffle([...pickedCorrect, ...pickedIncorrect])
    };
  }

  private randomInt(min: number, max: number): number {
    const low = Math.ceil(min);
    const high = Math.floor(max);
    return Math.floor(Math.random() * (high - low + 1)) + low;
  }

  private shuffle<T>(items: T[]): T[] {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  private randomizeMathChallenge(challenge: MathChallenge): MathChallenge {
    const operators = ['+', '-', 'x'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    let a = this.randomInt(0, 9);
    let b = this.randomInt(0, 9);
    if (operator === '-') {
      if (b > a) {
        [a, b] = [b, a];
      }
    }
    const solution =
      operator === '+'
        ? a + b
        : operator === '-'
          ? a - b
          : a * b;
    return {
      ...challenge,
      prompt: 'Solve the equation to proceed',
      equation: `${a} ${operator} ${b}`,
      solution
    };
  }

  private randomizeTextChallenge(challenge: TextChallenge): TextChallenge {
    const length = this.randomInt(5, 8);
    const word = this.randomLetters(length);
    const updatedPrompt = `Type the word '${word}'`;
    return {
      ...challenge,
      prompt: updatedPrompt,
      placeholder: 'Enter the word',
      solution: word
    };
  }

  private buildChallenges(): Challenge[] {
    const pickedImage =
      IMAGE_CHALLENGE_TEMPLATES[Math.floor(Math.random() * IMAGE_CHALLENGE_TEMPLATES.length)];
    return [
      { ...pickedImage, options: [...pickedImage.options], solutionIds: [...pickedImage.solutionIds] },
      {
        id: 'math-random',
        type: 'math',
        prompt: 'Solve the equation to proceed',
        equation: '0 + 0',
        solution: 0
      },
      {
        id: 'text-random',
        type: 'text',
        prompt: "Type the word 'random'",
        placeholder: 'Enter the word',
        solution: 'random'
      }
    ];
  }

  private randomLetters(length: number): string {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i += 1) {
      result += letters[Math.floor(Math.random() * letters.length)];
    }
    return result;
  }
}

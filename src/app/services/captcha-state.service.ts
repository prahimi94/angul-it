import { Injectable, computed, signal } from '@angular/core';
import {
  CaptchaSessionState,
  Challenge,
  ChallengeProgress,
  ImageChallenge,
  MathChallenge,
  TextChallenge
} from '../models/captcha.models';

const STORAGE_KEY = 'angul-it-session-v1';

const CHALLENGE_SETS: { id: string; challenges: Challenge[] }[] = [
  {
    id: 'forest-math-text',
    challenges: [
      {
        id: 'img-trees',
        type: 'image',
        prompt: "Select all tiles labeled 'Tree'",
        options: [
          { id: 't1', label: 'Tree', detail: 'Pine' },
          { id: 't2', label: 'Car', detail: 'Sedan' },
          { id: 't3', label: 'Tree', detail: 'Oak' },
          { id: 't4', label: 'House', detail: 'Brick' },
          { id: 't5', label: 'Tree', detail: 'Maple' },
          { id: 't6', label: 'Cloud', detail: 'Cirrus' },
          { id: 't7', label: 'River', detail: 'Stream' },
          { id: 't8', label: 'Tree', detail: 'Cedar' },
          { id: 't9', label: 'Bridge', detail: 'Steel' }
        ],
        solutionIds: ['t1', 't3', 't5', 't8']
      },
      {
        id: 'math-19',
        type: 'math',
        prompt: 'Solve the sum to proceed',
        equation: '12 + 7',
        solution: 19
      },
      {
        id: 'text-angular',
        type: 'text',
        prompt: "Type the word 'angular'",
        placeholder: 'Enter the word',
        solution: 'angular'
      }
    ]
  },
  {
    id: 'city-math-text',
    challenges: [
      {
        id: 'img-bikes',
        type: 'image',
        prompt: "Select all tiles labeled 'Bike'",
        options: [
          { id: 'b1', label: 'Bike', detail: 'Road' },
          { id: 'b2', label: 'Bus', detail: 'Transit' },
          { id: 'b3', label: 'Bike', detail: 'Cargo' },
          { id: 'b4', label: 'Taxi', detail: 'Cab' },
          { id: 'b5', label: 'Bike', detail: 'Hybrid' },
          { id: 'b6', label: 'Train', detail: 'Metro' },
          { id: 'b7', label: 'Bike', detail: 'Trail' },
          { id: 'b8', label: 'Truck', detail: 'Delivery' },
          { id: 'b9', label: 'Boat', detail: 'Ferry' }
        ],
        solutionIds: ['b1', 'b3', 'b5', 'b7']
      },
      {
        id: 'math-27',
        type: 'math',
        prompt: 'Solve the multiplication to proceed',
        equation: '9 x 3',
        solution: 27
      },
      {
        id: 'text-amber',
        type: 'text',
        prompt: "Type the color 'amber'",
        placeholder: 'Enter the color',
        solution: 'amber'
      }
    ]
  },
  {
    id: 'sky-math-text',
    challenges: [
      {
        id: 'img-clouds',
        type: 'image',
        prompt: "Select all tiles labeled 'Cloud'",
        options: [
          { id: 'c1', label: 'Cloud', detail: 'Fluffy' },
          { id: 'c2', label: 'Star', detail: 'Bright' },
          { id: 'c3', label: 'Cloud', detail: 'Layered' },
          { id: 'c4', label: 'Moon', detail: 'Crescent' },
          { id: 'c5', label: 'Cloud', detail: 'Stormy' },
          { id: 'c6', label: 'Sun', detail: 'Warm' },
          { id: 'c7', label: 'Cloud', detail: 'High' },
          { id: 'c8', label: 'Plane', detail: 'Jet' },
          { id: 'c9', label: 'Hill', detail: 'Rolling' }
        ],
        solutionIds: ['c1', 'c3', 'c5', 'c7']
      },
      {
        id: 'math-42',
        type: 'math',
        prompt: 'Solve the equation to proceed',
        equation: '6 x 7',
        solution: 42
      },
      {
        id: 'text-sunset',
        type: 'text',
        prompt: "Type the word 'sunset'",
        placeholder: 'Enter the word',
        solution: 'sunset'
      }
    ]
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
    const picked = CHALLENGE_SETS[Math.floor(Math.random() * CHALLENGE_SETS.length)];
    const now = Date.now();
    const challenges = picked.challenges.map((challenge, index) => {
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
      setId: picked.id,
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
    const equation = challenge.equation.toLowerCase();
    if (equation.includes('+')) {
      const a = this.randomInt(6, 24);
      const b = this.randomInt(3, 18);
      return {
        ...challenge,
        equation: `${a} + ${b}`,
        solution: a + b
      };
    }
    const a = this.randomInt(3, 12);
    const b = this.randomInt(2, 10);
    return {
      ...challenge,
      equation: `${a} x ${b}`,
      solution: a * b
    };
  }

  private randomizeTextChallenge(challenge: TextChallenge): TextChallenge {
    const prompt = challenge.prompt.toLowerCase();
    const colors = ['amber', 'teal', 'coral', 'olive', 'navy', 'peach'];
    const words = ['angular', 'forest', 'nebula', 'canvas', 'vertex', 'signal'];
    const word = prompt.includes('color')
      ? colors[Math.floor(Math.random() * colors.length)]
      : words[Math.floor(Math.random() * words.length)];
    const updatedPrompt = prompt.includes('color')
      ? `Type the color '${word}'`
      : `Type the word '${word}'`;
    return {
      ...challenge,
      prompt: updatedPrompt,
      placeholder: 'Enter the word',
      solution: word
    };
  }
}

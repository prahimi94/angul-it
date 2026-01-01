export type ChallengeType = 'image' | 'math' | 'text';

export interface ImageOption {
  id: string;
  label: string;
  detail: string;
  icon?: string;
}

export interface BaseChallenge {
  id: string;
  type: ChallengeType;
  prompt: string;
}

export interface ImageChallenge extends BaseChallenge {
  type: 'image';
  options: ImageOption[];
  solutionIds: string[];
}

export interface MathChallenge extends BaseChallenge {
  type: 'math';
  equation: string;
  solution: number;
}

export interface TextChallenge extends BaseChallenge {
  type: 'text';
  placeholder: string;
  solution: string;
}

export type Challenge = ImageChallenge | MathChallenge | TextChallenge;

export type ChallengeAnswer = string | number | string[];

export interface ChallengeAttempt {
  answer: ChallengeAnswer | null;
  correct: boolean;
  at: number;
}

export interface ChallengeProgress {
  answer: ChallengeAnswer | null;
  correct: boolean;
  attempts?: ChallengeAttempt[];
}

export interface CaptchaSessionState {
  sessionId: string;
  createdAt: number;
  currentIndex: number;
  completed: boolean;
  challenges: Challenge[];
  progress: Record<string, ChallengeProgress>;
}

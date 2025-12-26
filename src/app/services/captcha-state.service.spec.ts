import { TestBed } from '@angular/core/testing';
import { CaptchaStateService } from './captcha-state.service';

describe('CaptchaStateService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('starts a new session with challenges', () => {
    const service = TestBed.inject(CaptchaStateService);
    service.startNewSession();

    const session = service.session();
    expect(session.challenges.length).toBeGreaterThan(0);
    expect(session.completed).toBeFalse();
    expect(session.currentIndex).toBe(0);
  });

  it('updates progress and completes', () => {
    const service = TestBed.inject(CaptchaStateService);
    service.startNewSession();
    const first = service.session().challenges[0];

    service.updateProgress(first.id, { answer: ['a'], correct: true });
    service.markCompleted();

    const session = service.session();
    expect(session.progress[first.id]?.correct).toBeTrue();
    expect(session.completed).toBeTrue();
  });
});

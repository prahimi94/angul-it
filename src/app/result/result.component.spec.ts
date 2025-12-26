import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ResultComponent } from './result.component';
import { CaptchaStateService } from '../services/captcha-state.service';

describe('ResultComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ResultComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('creates the component', () => {
    const fixture = TestBed.createComponent(ResultComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('renders the completion message', () => {
    const service = TestBed.inject(CaptchaStateService);
    service.startNewSession();
    service.markCompleted();

    const fixture = TestBed.createComponent(ResultComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Verified');
  });
});

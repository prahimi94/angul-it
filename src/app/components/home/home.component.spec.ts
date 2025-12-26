import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { HomeComponent } from './home.component';
import { CaptchaStateService } from '../../services/captcha-state.service';

describe('HomeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('creates the component', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('starts a new session and navigates', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const state = TestBed.inject(CaptchaStateService);

    spyOn(router, 'navigate');
    spyOn(state, 'startNewSession');

    component.startChallenge();

    expect(state.startNewSession).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/challenge']);
  });
});

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { CaptchaComponent } from './captcha.component';

describe('CaptchaComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [CaptchaComponent],
      providers: [provideRouter([]), provideNoopAnimations()]
    }).compileComponents();
  });

  it('creates the component', () => {
    const fixture = TestBed.createComponent(CaptchaComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('renders the image grid for the first challenge', () => {
    const fixture = TestBed.createComponent(CaptchaComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const tiles = compiled.querySelectorAll('.image-tile');
    expect(tiles.length).toBeGreaterThan(0);
  });
});

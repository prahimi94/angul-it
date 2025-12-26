import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CaptchaStateService } from '../services/captcha-state.service';

export const resultGuard: CanActivateFn = () => {
  const router = inject(Router);
  const state = inject(CaptchaStateService);

  if (state.isCompleted()) {
    return true;
  }

  return router.createUrlTree(['/challenge']);
};

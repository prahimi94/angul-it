import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CaptchaStateService } from '../services/captcha-state.service';

export const completionGuard: CanActivateFn = () => {
  const router = inject(Router);
  const state = inject(CaptchaStateService);

  if (state.isCompleted()) {
    return router.createUrlTree(['/result']);
  }

  return true;
};

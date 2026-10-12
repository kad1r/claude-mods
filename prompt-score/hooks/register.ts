import type { Register } from 'claude-code'

import { score, shouldSkip, toastText } from './score'

export const register: Register = on => {
  on('prompt.submit', ($, e, next) => {
    // Only prompts the person typed (terminal or Remote Control) are scored.
    if ((e.origin.kind === 'composer' || e.origin.kind === 'bridge') && !shouldSkip(e.text)) {
      $.ui.toast(toastText(score(e.text)))
    }
    return next(e)
  }).catch(($, e, next) => next(e)) // scoring must never block a prompt
}

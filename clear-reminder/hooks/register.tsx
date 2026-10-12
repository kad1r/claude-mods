import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

// Prompts allowed between two /clear commands, and when the warning starts.
export const LIMIT = 20
export const WARN_AT = 17
const BAR_WIDTH = 10

const count = atom({ plugin: 'clear-reminder', key: 'count' } as const, 0)

export const bar = (n: number): string => {
  const filled = Math.min(BAR_WIDTH, Math.round((n / LIMIT) * BAR_WIDTH))
  return '▰'.repeat(filled) + '▱'.repeat(BAR_WIDTH - filled)
}

const dot = (n: number): string => (n >= LIMIT ? '🔴' : n >= WARN_AT ? '🟡' : '🟢')

// Drawn like usage-meter's line: dot, label, bar, figures.
export const line = (n: number): string => {
  const hint = n >= LIMIT ? ' · /clear zamanı' : n >= WARN_AT ? ` · ${LIMIT - n} mesaj sonra /clear` : ''
  return `${dot(n)} mesaj ${bar(n)} ${n}/${LIMIT}${hint}`
}

async function show($: EngineInterface) {
  $.ui.status(line(await read($, count)))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await show($)
    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    // Only prompts the person typed (terminal or Remote Control) count.
    if (e.origin.kind === 'composer' || e.origin.kind === 'bridge') {
      await update($, count, n => n + 1)
      await show($)
    }
    return next(e)
  }).catch(($, e, next) => next(e)) // a failing counter must never block a prompt

  on('turn.complete', async ($, e, next) => {
    if (e.agentId !== undefined) {
      return next(e)
    }
    const n = await read($, count)
    if (n >= LIMIT) {
      $.ui.toast(`⚠️ ${n}/${LIMIT} mesaj: /clear zamanı geldi`)
    } else if (n >= WARN_AT) {
      $.ui.toast(`${n}/${LIMIT} mesaj: ${LIMIT - n} mesaj sonra /clear yap`)
    }
    return next(e)
  })

  // A /clear ends the conversation; the process goes on, so reset by hand.
  // A new process starts from the atom's initial 0.
  on('session.end', async ($, e, next) => {
    if (e.reason === 'clear') {
      await update($, count, () => 0)
      await show($)
    }
    return next(e)
  })
}

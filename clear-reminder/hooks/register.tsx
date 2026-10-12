import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

// Prompts allowed between two /clear commands, and when the warning starts.
export const LIMIT = 20
export const WARN_AT = 17
const BAR_WIDTH = 20

const count = atom({ plugin: 'clear-reminder', key: 'count' } as const, 0)

export const bar = (n: number): string => {
  const filled = Math.min(BAR_WIDTH, Math.round((n / LIMIT) * BAR_WIDTH))
  return '█'.repeat(filled) + '░'.repeat(BAR_WIDTH - filled)
}

const colorFor = (n: number): string =>
  n >= LIMIT ? 'red' : n >= WARN_AT ? 'yellow' : 'green'

export const register: Register = on => {
  on('prompt.submit', async ($, e, next) => {
    // Only prompts the person typed (terminal or Remote Control) count.
    if (e.origin.kind === 'composer' || e.origin.kind === 'bridge') {
      await update($, count, n => n + 1)
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
    }
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    // Wrap what other plugins draw here (e.g. clawd-spinner) instead of replacing it.
    const below = await next(e)
    const n = await read($, count)
    if (e.props.hasSurvey || n === 0) {
      return below
    }

    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        {below}
        <Box>
          <Text color={colorFor(n)}>{bar(n)}</Text>
          <Text dimColor> {n}/{LIMIT} mesaj</Text>
          {n >= WARN_AT ? <Text color={colorFor(n)}> · /clear önerilir</Text> : null}
        </Box>
      </Box>
    )
  })
}

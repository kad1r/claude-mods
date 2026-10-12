import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { parse, summary } from './git'

const REFRESH_MS = 15_000

const info = atom({ plugin: 'git-band', key: 'info' } as const, null)

async function refresh($: EngineInterface) {
  // A repo's own config could name an fsmonitor program that `git status` would run.
  const run = await $.process
    .run(['git', '-c', 'core.fsmonitor=false', 'status', '--porcelain=v2', '--branch'], { timeoutMs: 5000 })
    .catch(() => undefined)
  const next = run !== undefined && run.exitCode === 0 ? parse(run.stdout) : null
  await update($, info, () => next)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await refresh($)
    $.clock.every(REFRESH_MS, () => refresh($))
    return next(e)
  })

  // Claude's own edits and commits show as soon as the turn ends.
  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) await refresh($)
    return next(e)
  })

  // Wraps what other plugins draw above the prompt instead of replacing it.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const below = await next(e)
    const g = await read($, info)
    if (g === null || e.props.hasSurvey) {
      return below
    }

    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        {below}
        <Text dimColor color={g.changed > 0 ? 'yellow' : undefined}>
          {summary(g)}
        </Text>
      </Box>
    )
  })
}

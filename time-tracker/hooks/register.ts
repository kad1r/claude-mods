import type { Register } from 'claude-code'

import { add, dayKey, projectName, report } from './report'
import type { DayLog } from './report'

const DAYS = 7
const DAY_MS = 86_400_000

export const register: Register = on => {
  let startedAt = 0
  let project = ''

  on('session.start', async ($, e, next) => {
    project = projectName(e.cwd)
    await $.command.register({ name: 'zaman', description: 'Claude’un son 7 günde proje bazında çalıştığı süre' })
    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    startedAt = await $.clock.now()
    return next(e)
  })

  // Only the main loop's turns: subagents run inside it and would count twice.
  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined && startedAt > 0) {
      const end = await $.clock.now()
      const key = `day:${dayKey(new Date(end))}`
      const log = ((await $.store.get(key)) ?? {}) as DayLog
      await $.store.set(key, add(log, project, Math.round((end - startedAt) / 1000)))
      startedAt = 0
    }
    return next(e)
  }).catch(($, e, next) => next(e))

  on('command.run', { command: 'zaman' }, async $ => {
    const today = await $.clock.now()
    const days: [string, DayLog][] = []
    for (let i = 0; i < DAYS; i++) {
      const day = dayKey(new Date(today - i * DAY_MS))
      days.push([day, ((await $.store.get(`day:${day}`)) ?? {}) as DayLog])
    }
    return { text: report(days) }
  })
}

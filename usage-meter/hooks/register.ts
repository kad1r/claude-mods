import type { Register, SessionMeasureInput, Timer, TurnUsage } from 'claude-code'

const BAR_WIDTH = 10
// Context fill where the dot turns yellow, then red.
export const WARN_PERCENT = 60
export const ALERT_PERCENT = 85

export type Meter = {
  percent?: number
  tokens?: number
  window: number
  usd?: number
  fiveHour?: number
  turnSeconds?: number
  turnTokens?: number
  isWorking: boolean
}

export const compact = (n: number): string =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : String(n)

export const duration = (seconds: number): string =>
  seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m${String(seconds % 60).padStart(2, '0')}s`

const dot = (percent: number): string =>
  percent >= ALERT_PERCENT ? '🔴' : percent >= WARN_PERCENT ? '🟡' : '🟢'

const bar = (percent: number): string => {
  const filled = Math.min(BAR_WIDTH, Math.round((percent / 100) * BAR_WIDTH))
  return '▰'.repeat(filled) + '▱'.repeat(BAR_WIDTH - filled)
}

export const turnTokens = (usage: TurnUsage): number =>
  usage.input_tokens + usage.output_tokens + usage.cache_creation_input_tokens + usage.cache_read_input_tokens

export const line = (m: Meter): string => {
  const parts: string[] = []
  if (m.percent === undefined || m.tokens === undefined) {
    parts.push(`ctx —/${compact(m.window)}`)
  } else {
    parts.push(`${dot(m.percent)} ctx ${bar(m.percent)} %${m.percent} ${compact(m.tokens)}/${compact(m.window)}`)
  }
  if (m.turnSeconds !== undefined) {
    const tokens = m.turnTokens === undefined ? '' : ` ${compact(m.turnTokens)} tok`
    parts.push(m.isWorking ? `⏱ ${duration(m.turnSeconds)}` : `son turn ${duration(m.turnSeconds)}${tokens}`)
  }
  if (m.usd !== undefined) {
    parts.push(`$${m.usd.toFixed(2)}`)
  }
  if (m.fiveHour !== undefined) {
    parts.push(`5s limit %${Math.round(m.fiveHour)}`)
  }
  return parts.join(' · ')
}

export const register: Register = on => {
  const meter: Meter = { window: 0, isWorking: false }
  let startedAt = 0
  let ticker: Timer | undefined

  const take = (e: Pick<SessionMeasureInput, 'context' | 'cost' | 'rateLimits'>) => {
    meter.percent = e.context.percent
    meter.tokens = e.context.tokens
    meter.window = e.context.window
    meter.usd = e.cost?.usd
    meter.fiveHour = e.rateLimits.find(r => r.kind === 'five_hour')?.percentUsed
  }

  const stopTicker = () => {
    ticker?.cancel()
    ticker = undefined
  }

  on('session.start', async ($, e, next) => {
    // Also runs after a hot reload: pick the figures up again.
    take(await $.session.usage())
    $.ui.status(line(meter))
    return next(e)
  })

  on('session.measure', ($, e, next) => {
    take(e)
    $.ui.status(line(meter))
    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    startedAt = await $.clock.now()
    meter.isWorking = true
    meter.turnSeconds = 0
    meter.turnTokens = undefined
    stopTicker()
    ticker = $.clock.every(1000, async () => {
      meter.turnSeconds = Math.round(((await $.clock.now()) - startedAt) / 1000)
      $.ui.status(line(meter))
    })
    $.ui.status(line(meter))
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    // A subagent's run ends inside the main turn; only the main loop's end counts.
    if (e.agentId !== undefined) {
      return next(e)
    }
    stopTicker()
    meter.isWorking = false
    meter.turnSeconds = Math.round(((await $.clock.now()) - startedAt) / 1000)
    meter.turnTokens = e.usage === undefined ? undefined : turnTokens(e.usage)
    $.ui.status(line(meter))
    return next(e)
  })

  on('session.end', async ($, e, next) => {
    if (e.reason === 'clear') {
      stopTicker()
      meter.turnSeconds = undefined
      meter.turnTokens = undefined
      take(await $.session.usage())
      $.ui.status(line(meter))
    }
    return next(e)
  })
}

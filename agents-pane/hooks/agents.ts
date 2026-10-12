import type { AgentInfo } from 'claude-code'

import type { AgentRow } from '../types'

// Finished agents stay listed (dimmed) up to this many.
export const KEEP_DONE = 8

export const isLive = (status: string): boolean =>
  status === 'pending' || status === 'running' || status === 'waiting' || status === 'idle'

// Merges a fresh `$.agent.list()` into the rows: new agents start now, agents
// that left the list or stopped running get an end time.
export const merge = (rows: readonly AgentRow[], list: readonly AgentInfo[], now: number): AgentRow[] => {
  const seen = new Map(list.map(a => [a.id, a]))
  const next: AgentRow[] = rows.map(row => {
    const info = seen.get(row.id)
    const status = info?.status ?? (isLive(row.status) ? 'completed' : row.status)
    const endedAt = row.endedAt ?? (isLive(status) ? undefined : now)
    return { ...row, status, endedAt }
  })
  for (const a of list) {
    if (!rows.some(r => r.id === a.id)) {
      next.push({
        id: a.id,
        type: a.type,
        description: a.description,
        status: a.status,
        startedAt: now,
        endedAt: isLive(a.status) ? undefined : now,
      })
    }
  }
  const live = next.filter(r => isLive(r.status))
  const done = next.filter(r => !isLive(r.status)).slice(-KEEP_DONE)
  return [...live, ...done]
}

export const elapsed = (row: AgentRow, now: number): string => {
  const s = Math.max(0, Math.round(((row.endedAt ?? now) - row.startedAt) / 1000))
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m${String(s % 60).padStart(2, '0')}s`
}

export const ICON: Record<string, string> = {
  pending: '…',
  running: '●',
  waiting: '◌',
  idle: '◌',
  completed: '✔',
  failed: '✖',
  killed: '■',
}

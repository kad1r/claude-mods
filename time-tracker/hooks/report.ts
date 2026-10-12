// Seconds Claude worked and turns it ran, per project, for one day.
export type DayLog = Record<string, { seconds: number; turns: number }>

export const dayKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const projectName = (cwd: string): string => cwd.replace(/[\\/]+$/, '').split(/[\\/]/).pop() || cwd

export const add = (log: DayLog, project: string, seconds: number): DayLog => {
  const cur = log[project] ?? { seconds: 0, turns: 0 }
  return { ...log, [project]: { seconds: cur.seconds + seconds, turns: cur.turns + 1 } }
}

export const hm = (seconds: number): string => {
  const m = Math.round(seconds / 60)
  return m < 60 ? `${m}dk` : `${Math.floor(m / 60)}sa ${String(m % 60).padStart(2, '0')}dk`
}

// `days` is newest first: [dayKey, log] pairs.
export const report = (days: readonly [string, DayLog][]): string => {
  const totals = new Map<string, { seconds: number; turns: number }>()
  for (const [, log] of days) {
    for (const [p, v] of Object.entries(log)) {
      const t = totals.get(p) ?? { seconds: 0, turns: 0 }
      totals.set(p, { seconds: t.seconds + v.seconds, turns: t.turns + v.turns })
    }
  }
  if (totals.size === 0) return 'Son 7 günde kayıt yok.'

  const lines = ['Claude’un çalıştığı süre (son 7 gün):', '']
  for (const [day, log] of days) {
    const sum = Object.values(log).reduce((n, v) => n + v.seconds, 0)
    if (sum > 0) lines.push(`${day}  ${hm(sum).padStart(9)}`)
  }
  lines.push('', 'Proje bazında:')
  for (const [p, v] of [...totals].sort((a, b) => b[1].seconds - a[1].seconds)) {
    lines.push(`  ${p.padEnd(28)} ${hm(v.seconds).padStart(9)}  ${v.turns} turn`)
  }
  const all = [...totals.values()].reduce((n, v) => n + v.seconds, 0)
  lines.push('', `Toplam: ${hm(all)}`)
  return lines.join('\n')
}

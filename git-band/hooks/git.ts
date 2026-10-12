import type { GitInfo } from '../types'

// Parses `git status --porcelain=v2 --branch`.
export const parse = (out: string): GitInfo => {
  const info: GitInfo = { branch: '?', changed: 0, ahead: 0, behind: 0, hasUpstream: false }
  for (const line of out.split(/\r?\n/)) {
    if (line.startsWith('# branch.head ')) {
      const head = line.slice('# branch.head '.length)
      info.branch = head === '(detached)' ? 'detached' : head
    } else if (line.startsWith('# branch.upstream ')) {
      info.hasUpstream = true
    } else if (line.startsWith('# branch.ab ')) {
      const m = /\+(\d+) -(\d+)/.exec(line)
      info.ahead = Number(m?.[1] ?? 0)
      info.behind = Number(m?.[2] ?? 0)
    } else if (line !== '' && !line.startsWith('#')) {
      info.changed += 1
    }
  }
  return info
}

export const summary = (g: GitInfo): string => {
  const parts = [`⎇ ${g.branch}`]
  parts.push(g.changed === 0 ? 'temiz' : `● ${g.changed} değişiklik`)
  if (g.hasUpstream) parts.push(`↑${g.ahead} ↓${g.behind}`)
  else parts.push('upstream yok')
  return parts.join(' · ')
}

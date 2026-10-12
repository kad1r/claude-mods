import type { FileChange, Hunk } from '../types'

// Per file, keep the latest hunks and cap each side so state stays small.
export const MAX_HUNKS = 20
export const MAX_SIDE_CHARS = 4000

export const lineCount = (text: string): number => (text === '' ? 0 : text.replace(/\n$/, '').split('\n').length)

const cap = (text: string) => (text.length > MAX_SIDE_CHARS ? text.slice(0, MAX_SIDE_CHARS) + '\n…' : text)

export const record = (files: readonly FileChange[], path: string, hunk: Hunk, isNew: boolean): FileChange[] => {
  const found = files.find(f => f.path === path)
  const base: FileChange = found ?? { path, added: 0, removed: 0, edits: 0, isNew, hunks: [] }
  const next: FileChange = {
    ...base,
    added: base.added + lineCount(hunk.after),
    removed: base.removed + lineCount(hunk.before),
    edits: base.edits + 1,
    hunks: [...base.hunks, { before: cap(hunk.before), after: cap(hunk.after) }].slice(-MAX_HUNKS),
  }
  // Most recently touched file first.
  return [next, ...files.filter(f => f.path !== path)]
}

const prefixed = (text: string, mark: string) =>
  text === '' ? [] : text.replace(/\n$/, '').split('\n').map(l => mark + l)

// A unified diff the Code element can draw; line numbers are not known, so each hunk counts from 1.
export const unified = (file: FileChange): string => {
  const head = [`--- a/${file.path}`, `+++ b/${file.path}`]
  const hunks = file.hunks.flatMap(h => {
    const before = lineCount(h.before)
    const after = lineCount(h.after)
    return [
      `@@ -${before === 0 ? 0 : 1},${before} +${after === 0 ? 0 : 1},${after} @@`,
      ...prefixed(h.before, '-'),
      ...prefixed(h.after, '+'),
    ]
  })
  return [...head, ...hunks].join('\n')
}

// Path relative to the working directory when inside it, forward slashes either way.
export const shortPath = (path: string, cwd: string): string => {
  const p = path.replace(/\\/g, '/')
  const root = cwd.replace(/\\/g, '/').replace(/\/$/, '') + '/'
  return p.toLowerCase().startsWith(root.toLowerCase()) ? p.slice(root.length) : p
}

export const fit = (text: string, width: number): string =>
  text.length <= width ? text : '…' + text.slice(text.length - Math.max(1, width - 1))

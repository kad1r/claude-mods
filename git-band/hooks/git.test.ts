import { expect, test } from 'claude-code/testing'

import { parse, summary } from './git'

test('branch, upstream and changes are read from porcelain v2', () => {
  const g = parse(
    [
      '# branch.oid 3b98e6e',
      '# branch.head main',
      '# branch.upstream origin/main',
      '# branch.ab +2 -1',
      '1 .M N... 100644 100644 100644 a b src/a.cs',
      '? new.txt',
      '',
    ].join('\n'),
  )
  expect(g).toEqual({ branch: 'main', changed: 2, ahead: 2, behind: 1, hasUpstream: true })
  expect(summary(g)).toBe('⎇ main · ● 2 değişiklik · ↑2 ↓1')
})

test('a clean branch with no upstream', () => {
  const g = parse('# branch.oid abc\r\n# branch.head feature/x\r\n')
  expect(summary(g)).toBe('⎇ feature/x · temiz · upstream yok')
})

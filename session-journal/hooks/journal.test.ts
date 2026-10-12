import { expect, test } from 'claude-code/testing'

import { appendTo, fileFor, firstLine, MAX_TRANSCRIPT_CHARS, transcript, turnLine } from './journal'

test('a day file is named and headed by its date', () => {
  const path = fileFor('C:/Users/me/.claude/journal', new Date(2026, 9, 12, 14, 5))
  expect(path).toBe('C:/Users/me/.claude/journal/2026-10-12.md')
  expect(appendTo('', '2026-10-12', '- a')).toBe('# 2026-10-12\n\n- a\n')
  expect(appendTo('# 2026-10-12\n\n- a\n', '2026-10-12', '- b')).toBe('# 2026-10-12\n\n- a\n- b\n')
})

test('a turn line carries time, project, the prompt’s first line and counts', () => {
  expect(turnLine(new Date(2026, 9, 12, 9, 7), 'LinePulse', 'Raporu hızlandır\nayrıntı', 4, 37)).toBe(
    '- 09:07 **LinePulse** — Raporu hızlandır _(4 araç, 37s)_',
  )
  expect(firstLine('x'.repeat(150)).length).toBe(100)
})

test('the transcript keeps its newest part when too long', () => {
  const long = transcript([
    { role: 'user', text: 'a'.repeat(MAX_TRANSCRIPT_CHARS), toolUses: [] },
    { role: 'assistant', text: 'son cevap', toolUses: [] },
  ])
  expect(long.endsWith('CLAUDE: son cevap')).toBe(true)
  expect(long.length).toBeLessThan(MAX_TRANSCRIPT_CHARS + 10)
})

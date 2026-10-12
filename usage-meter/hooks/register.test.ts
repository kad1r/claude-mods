import { expect, test } from 'claude-code/testing'

import { compact, duration, line } from './register'

test('numbers are compacted', () => {
  expect(compact(950)).toBe('950')
  expect(compact(84_400)).toBe('84k')
  expect(compact(1_000_000)).toBe('1.0M')
})

test('durations read as seconds, then minutes', () => {
  expect(duration(37)).toBe('37s')
  expect(duration(125)).toBe('2m05s')
})

test('the line shows every figure it has', () => {
  expect(
    line({ percent: 42, tokens: 84_000, window: 200_000, usd: 1.234, fiveHour: 23.5, turnSeconds: 37, turnTokens: 12_400, isWorking: false }),
  ).toBe('🟢 ctx ▰▰▰▰▱▱▱▱▱▱ %42 84k/200k · son turn 37s 12k tok · $1.23 · 5s limit %24')
})

test('before the first response, and while working', () => {
  expect(line({ window: 200_000, isWorking: false })).toBe('ctx —/200k')
  expect(line({ percent: 90, tokens: 180_000, window: 200_000, turnSeconds: 65, isWorking: true })).toBe(
    '🔴 ctx ▰▰▰▰▰▰▰▰▰▱ %90 180k/200k · ⏱ 1m05s',
  )
})

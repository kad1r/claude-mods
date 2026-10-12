import { expect, test } from 'claude-code/testing'

import { bar, LIMIT, line, WARN_AT } from './register'

test('bar fills in proportion to the limit', () => {
  expect(bar(0)).toBe('▱'.repeat(10))
  expect(bar(LIMIT / 2)).toBe('▰'.repeat(5) + '▱'.repeat(5))
  expect(bar(LIMIT)).toBe('▰'.repeat(10))
  expect(bar(LIMIT + 5)).toBe('▰'.repeat(10))
})

test('the line reads like usage-meter and warns near the limit', () => {
  expect(line(12)).toBe('🟢 mesaj ▰▰▰▰▰▰▱▱▱▱ 12/20')
  expect(line(18)).toBe('🟡 mesaj ▰▰▰▰▰▰▰▰▰▱ 18/20 · 2 mesaj sonra /clear')
  expect(line(21)).toBe('🔴 mesaj ▰▰▰▰▰▰▰▰▰▰ 21/20 · /clear zamanı')
  expect(WARN_AT < LIMIT).toBe(true)
})

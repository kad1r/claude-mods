import { expect, test } from 'claude-code/testing'

import { bar, LIMIT, WARN_AT } from './register'

test('bar fills in proportion to the limit', () => {
  expect(bar(0)).toBe('░'.repeat(20))
  expect(bar(LIMIT / 2)).toBe('█'.repeat(10) + '░'.repeat(10))
  expect(bar(LIMIT)).toBe('█'.repeat(20))
  expect(bar(LIMIT + 5)).toBe('█'.repeat(20))
})

test('warning starts before the limit', () => {
  expect(WARN_AT < LIMIT).toBe(true)
})

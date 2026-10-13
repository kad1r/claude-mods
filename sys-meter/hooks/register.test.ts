import { expect, test } from 'claude-code/testing'

import { line, parse } from './register'

test('parse reads a sampler row and converts tenths of a kelvin to celsius', () => {
  expect(parse('SYS 13 33186000 7242496 3422')).toEqual({
    cpu: 13,
    ramTotalKb: 33186000,
    ramFreeKb: 7242496,
    celsius: 69,
  })
})

test('parse leaves the temperature out when no thermal zone answers', () => {
  expect(parse('SYS 5 1000 500 ')).toEqual({ cpu: 5, ramTotalKb: 1000, ramFreeKb: 500 })
  expect(parse('noise')).toBe(undefined)
  expect(parse('SYS x 1000 500 3000')).toBe(undefined)
})

test('the line reads like usage-meter and colours by the worst figure', () => {
  const total = 32 * 1024 * 1024
  expect(line({ cpu: 13, ramTotalKb: total, ramFreeKb: total / 2, celsius: 55 })).toBe(
    '🟢 cpu ▰▱▱▱▱▱▱▱▱▱ %13 · ram ▰▰▰▰▰▱▱▱▱▱ %50 16.0/32.0G · 🌡 55°C',
  )
  expect(line({ cpu: 20, ramTotalKb: total, ramFreeKb: total / 10 })).toBe(
    '🔴 cpu ▰▰▱▱▱▱▱▱▱▱ %20 · ram ▰▰▰▰▰▰▰▰▰▱ %90 28.8/32.0G',
  )
  expect(line({ cpu: 10, ramTotalKb: total, ramFreeKb: total, celsius: 82 }).startsWith('🟡')).toBe(true)
})

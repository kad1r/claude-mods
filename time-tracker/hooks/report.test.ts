import { expect, test } from 'claude-code/testing'

import { add, dayKey, hm, projectName, report } from './report'

test('keys and names', () => {
  expect(dayKey(new Date(2026, 9, 5))).toBe('2026-10-05')
  expect(projectName('D:\\Development\\LinePulse\\')).toBe('LinePulse')
  expect(projectName('/home/me/app')).toBe('app')
})

test('durations read as minutes, then hours', () => {
  expect(hm(150)).toBe('3dk')
  expect(hm(3 * 3600 + 5 * 60)).toBe('3sa 05dk')
})

test('turns add up per project and the report totals them', () => {
  let log = add({}, 'LinePulse', 600)
  log = add(log, 'LinePulse', 1200)
  log = add(log, 'Spock', 300)
  expect(log['LinePulse']).toEqual({ seconds: 1800, turns: 2 })
  const text = report([
    ['2026-10-12', log],
    ['2026-10-11', {}],
  ])
  expect(text).toContain('2026-10-12')
  expect(text).not.toContain('2026-10-11')
  expect(text).toContain('LinePulse')
  expect(text).toContain('Toplam: 35dk')
  expect(report([])).toBe('Son 7 günde kayıt yok.')
})

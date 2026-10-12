import { expect, test } from 'claude-code/testing'
import type { AgentInfo } from 'claude-code'

import { elapsed, KEEP_DONE, merge } from './agents'

const info = (id: string, status: AgentInfo['status']): AgentInfo => ({ id, type: 'Explore', description: `task ${id}`, status })

test('new agents start now, finished ones get an end time', () => {
  let rows = merge([], [info('a', 'running')], 1000)
  expect(rows[0]).toMatchObject({ id: 'a', startedAt: 1000, endedAt: undefined })
  rows = merge(rows, [info('a', 'completed')], 6000)
  expect(rows[0]).toMatchObject({ status: 'completed', endedAt: 6000 })
  expect(elapsed(rows[0]!, 99_000)).toBe('5s')
})

test('an agent that leaves the list counts as completed', () => {
  const rows = merge(merge([], [info('a', 'running')], 0), [], 125_000)
  expect(rows[0]).toMatchObject({ status: 'completed', endedAt: 125_000 })
  expect(elapsed(rows[0]!, 0)).toBe('2m05s')
})

test('live agents come first and old finished ones drop off', () => {
  const done = Array.from({ length: KEEP_DONE + 3 }, (_, i) => info(`d${i}`, 'completed'))
  const rows = merge([], [...done, info('live', 'running')], 0)
  expect(rows[0]?.id).toBe('live')
  expect(rows.length).toBe(KEEP_DONE + 1)
})

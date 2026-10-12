import { expect, test } from 'claude-code/testing'

import { created, fromTodoWrite, progress, updated } from './todos'

test('TodoWrite replaces the whole list', () => {
  const list = fromTodoWrite([
    { content: 'Write tests', status: 'completed', activeForm: 'Writing tests' },
    { content: 'Fix bug', status: 'in_progress', activeForm: 'Fixing bug' },
  ])
  expect(list.map(t => t.status)).toEqual(['completed', 'in_progress'])
  expect(progress(list)).toBe('▰▰▰▰▰▰▱▱▱▱▱▱ 1/2')
})

test('Task tools add, update and delete items', () => {
  let list = created([], '1', 'Read code')
  list = created(list, '2', 'Edit code', 'Editing code')
  list = updated(list, '1', { status: 'completed' })
  list = updated(list, '2', { status: 'in_progress', subject: 'Edit service' })
  expect(list).toEqual([
    { id: '1', text: 'Read code', active: 'Read code', status: 'completed' },
    { id: '2', text: 'Edit service', active: 'Editing code', status: 'in_progress' },
  ])
  expect(updated(list, '1', { status: 'deleted' }).map(t => t.id)).toEqual(['2'])
})

test('an empty list shows an empty bar', () => {
  expect(progress([])).toBe('▱▱▱▱▱▱▱▱▱▱▱▱ 0/0')
})

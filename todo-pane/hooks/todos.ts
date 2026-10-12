import type { Todo, TodoStatus } from '../types'

const BAR_WIDTH = 12

export const fromTodoWrite = (todos: readonly { content: string; status: TodoStatus; activeForm: string }[]): Todo[] =>
  todos.map((t, i) => ({ id: `todo-${i}`, text: t.content, active: t.activeForm, status: t.status }))

export const created = (items: readonly Todo[], id: string, subject: string, active?: string): Todo[] => [
  ...items.filter(t => t.id !== id),
  { id, text: subject, active: active ?? subject, status: 'pending' },
]

export const updated = (
  items: readonly Todo[],
  id: string,
  change: { subject?: string; activeForm?: string; status?: TodoStatus | 'deleted' },
): Todo[] => {
  const status = change.status
  if (status === 'deleted') return items.filter(t => t.id !== id)
  return items.map(t =>
    t.id !== id
      ? t
      : {
          ...t,
          text: change.subject ?? t.text,
          active: change.activeForm ?? t.active,
          status: status ?? t.status,
        },
  )
}

export const progress = (items: readonly Todo[]): string => {
  const done = items.filter(t => t.status === 'completed').length
  const filled = items.length === 0 ? 0 : Math.round((done / items.length) * BAR_WIDTH)
  return `${'▰'.repeat(filled)}${'▱'.repeat(BAR_WIDTH - filled)} ${done}/${items.length}`
}

export const MARK: Record<TodoStatus, string> = { completed: '✔', in_progress: '◐', pending: '○' }

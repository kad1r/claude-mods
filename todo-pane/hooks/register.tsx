import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import { created, fromTodoWrite, MARK, progress, updated } from './todos'

const PANE = 'todo-pane'
const TITLE = 'Yapılacaklar'

const items = atom({ plugin: 'todo-pane', key: 'items' } as const, [])

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'todos', description: 'Claude’un yapılacaklar listesini panelde göster' })
    return next(e)
  })

  on('command.run', { command: 'todos' }, async $ => {
    await $.ui.open({ id: PANE, title: TITLE })
    return { text: 'Yapılacaklar paneli açıldı.' }
  })

  // Only the main loop's list: a subagent's todos are its own business.
  on('tool.call', { tool: 'TodoWrite' }, async ($, e, next) => {
    const ran = await next(e)
    if (e.agentId === undefined && ran.result !== undefined && ran.isError !== true) {
      const list = fromTodoWrite(e.todos)
      await update($, items, () => list)
      if (list.length > 0) void $.ui.open({ id: PANE, title: TITLE })
    }
    return ran
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: 'TaskCreate' }, async ($, e, next) => {
    const ran = await next(e)
    if (e.agentId === undefined && ran.result !== undefined && ran.isError !== true) {
      const { id, subject } = ran.result.task
      await update($, items, list => created(list, id, subject, e.activeForm))
      void $.ui.open({ id: PANE, title: TITLE })
    }
    return ran
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: 'TaskUpdate' }, async ($, e, next) => {
    const ran = await next(e)
    if (e.agentId === undefined && ran.result !== undefined && ran.isError !== true) {
      await update($, items, list => updated(list, e.taskId, e))
    }
    return ran
  }).catch(($, e, next) => next(e))

  on('session.end', async ($, e, next) => {
    if (e.reason === 'clear') await update($, items, () => [])
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const list = await read($, items)
    const room = Math.max(3, (e.viewport?.rows ?? 30) - 5)

    if (list.length === 0) {
      return <Text dimColor>Henüz yapılacak listesi yok.</Text>
    }

    return (
      <Box flexDirection="column">
        <Text color="green">{progress(list)}</Text>
        {list.slice(0, room).map(t => (
          <Text
            key={t.id}
            color={t.status === 'in_progress' ? 'yellow' : undefined}
            dimColor={t.status === 'completed'}
            strikethrough={t.status === 'completed'}
          >
            {MARK[t.status]} {t.status === 'in_progress' ? t.active : t.text}
          </Text>
        ))}
        {list.length > room ? <Text dimColor>… {list.length - room} madde daha</Text> : null}
      </Box>
    )
  })
}

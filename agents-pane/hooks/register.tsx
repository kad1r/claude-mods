import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import { elapsed, ICON, isLive, merge } from './agents'

const PANE = 'agents-pane'
const TITLE = 'Subagent’lar'
const POLL_MS = 1000

const agents = atom({ plugin: 'agents-pane', key: 'agents' } as const, [])
const now = atom({ plugin: 'agents-pane', key: 'now' } as const, 0)

let poller: Timer | undefined

async function refresh($: EngineInterface) {
  const t = await $.clock.now()
  const list = await $.agent.list()
  const rows = await update($, agents, rows => merge(rows, list, t))
  await update($, now, () => t)
  if (!rows.some(r => isLive(r.status))) {
    poller?.cancel()
    poller = undefined
  }
}

function watch($: EngineInterface) {
  if (poller === undefined) poller = $.clock.every(POLL_MS, () => refresh($))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'subagents', description: 'Çalışan subagent’ları panelde göster' })
    return next(e)
  })

  on('command.run', { command: 'subagents' }, async $ => {
    await refresh($)
    await $.ui.open({ id: PANE, title: TITLE })
    return { text: 'Subagent paneli açıldı.' }
  })

  // Every spawn, the model's Agent calls included, starts the watch.
  on('agent.spawn', async ($, e, next) => {
    const spawned = await next(e)
    if ('agentId' in spawned && spawned.agentId !== undefined) {
      await refresh($)
      watch($)
      void $.ui.open({ id: PANE, title: TITLE })
    }
    return spawned
  }).catch(($, e, next) => next(e))

  on('session.end', async ($, e, next) => {
    if (e.reason === 'clear') {
      poller?.cancel()
      poller = undefined
      await update($, agents, () => [])
    }
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    const rows = await read($, agents)
    const t = await read($, now)

    if (rows.length === 0) {
      return <Text dimColor>Bu oturumda henüz subagent çalışmadı.</Text>
    }

    const width = Math.max(20, e.props.bodyColumns - 22)

    return (
      <Box flexDirection="column">
        {rows.map(r => {
          const live = isLive(r.status)
          const label = `${r.type}: ${r.description}`
          return (
            <Box key={`agent:${r.id}`}>
              <Text color={live ? 'yellow' : r.status === 'failed' ? 'red' : undefined} dimColor={!live}>
                {ICON[r.status] ?? '?'} {elapsed(r, t).padStart(6)} {label.length > width ? label.slice(0, width - 1) + '…' : label}{' '}
              </Text>
              {live ? (
                <Button
                  key={`stop:${r.id}`}
                  label="Durdur"
                  onPress={async () => {
                    await $.tool.call({ tool: 'TaskStop', task_id: r.id }).catch(() => undefined)
                    await refresh($)
                  }}
                />
              ) : null}
            </Box>
          )
        })}
      </Box>
    )
  })
}

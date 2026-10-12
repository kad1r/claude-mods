import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import { fit, record, shortPath, unified } from './diff'

const PANE = 'session-diff'
const TITLE = 'Oturum değişiklikleri'

const files = atom({ plugin: 'session-diff', key: 'files' } as const, [])
const selected = atom({ plugin: 'session-diff', key: 'selected' } as const, null)
const page = atom({ plugin: 'session-diff', key: 'page' } as const, 0)

export const register: Register = on => {
  let cwd = ''

  on('session.start', async ($, e, next) => {
    cwd = e.cwd
    await $.command.register({
      name: 'session-diff',
      description: 'Bu oturumda değişen dosyaları ve diff’lerini panelde göster',
    })
    return next(e)
  })

  on('command.run', { command: 'session-diff' }, async $ => {
    await update($, selected, () => null)
    await $.ui.open({ id: PANE, title: TITLE })
    return { text: 'Değişiklik paneli açıldı.' }
  })

  on('tool.call', { tool: 'Edit' }, async ($, e, next) => {
    const ran = await next(e)
    if (!('deny' in ran && ran.deny !== undefined) && ran.isError !== true) {
      await update($, files, list =>
        record(list, shortPath(e.file_path, cwd), { before: e.old_string, after: e.new_string }, false),
      )
    }
    return ran
  }).catch(($, e, next) => next(e)) // tracking must never block an edit

  on('tool.call', { tool: 'Write' }, async ($, e, next) => {
    const path = e.file_path
    // Read what the file held before, so an overwrite shows what it replaced.
    const existed = await $.fs.exists(path).catch(() => false)
    const before = existed ? await $.fs.read(path).catch(() => '') : ''
    const ran = await next(e)
    if (!('deny' in ran && ran.deny !== undefined) && ran.isError !== true) {
      await update($, files, list => record(list, shortPath(path, cwd), { before, after: e.content }, !existed))
    }
    return ran
  }).catch(($, e, next) => next(e))

  on('session.end', async ($, e, next) => {
    if (e.reason === 'clear') {
      await update($, files, () => [])
      await update($, selected, () => null)
    }
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Code, Text } = $.ui.resolve(e)
    const list = await read($, files)
    const current = await read($, selected)
    const width = Math.max(20, e.props.bodyColumns)
    const room = Math.max(4, (e.viewport?.rows ?? 30) - 6)
    const file = list.find(f => f.path === current)

    if (file !== undefined) {
      const lines = unified(file).split('\n')
      const pages = Math.max(1, Math.ceil(lines.length / room))
      const at = Math.min(await read($, page), pages - 1)
      const turn = (delta: number) => update($, page, p => Math.max(0, Math.min(pages - 1, p + delta)))

      return (
        <Box flexDirection="column">
          <Box>
            <Button key="back" hotkey="b" label="← Liste" onPress={() => update($, selected, () => null)} />
            <Button key="prev" hotkey="k" label="↑" onPress={() => turn(-1)} />
            <Button key="next" hotkey="j" label="↓" onPress={() => turn(1)} />
            <Text dimColor>
              {' '}
              {at + 1}/{pages} · <Text color="green">+{file.added}</Text> <Text color="red">−{file.removed}</Text> · {file.edits} düzenleme
            </Text>
          </Box>
          <Code format="diff" path={file.path} source={lines.slice(at * room, (at + 1) * room).join('\n')} />
        </Box>
      )
    }

    const added = list.reduce((n, f) => n + f.added, 0)
    const removed = list.reduce((n, f) => n + f.removed, 0)

    return (
      <Box flexDirection="column">
        {list.length === 0 ? (
          <Text dimColor>Bu oturumda henüz Edit/Write ile değişen dosya yok.</Text>
        ) : (
          <Text dimColor>
            {list.length} dosya · <Text color="green">+{added}</Text> <Text color="red">−{removed}</Text>
          </Text>
        )}
        {list.slice(0, room).map(f => (
          <Button
            key={`file:${f.path}`}
            plain
            onPress={async () => {
              await update($, page, () => 0)
              await update($, selected, () => f.path)
            }}
          >
            <Text color="green">{`+${f.added}`.padStart(5)}</Text> <Text color="red">{`−${f.removed}`.padStart(5)}</Text>{' '}
            {fit(f.path, width - 14)}
            {f.isNew ? <Text dimColor> (yeni)</Text> : ''}
          </Button>
        ))}
        {list.length > room ? <Text dimColor>… {list.length - room} dosya daha</Text> : null}
      </Box>
    )
  })
}

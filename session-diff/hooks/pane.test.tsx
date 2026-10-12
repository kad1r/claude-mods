import { expect, test } from 'claude-code/testing'

const PANE = { plugin: 'session-diff', component: 'Pane', requestId: 'session-diff' } as const

test('an Edit shows in the pane and opens its diff', async ($, on) => {
  // Stands for the engine's Edit tool beneath the plugin.
  on('tool.call', { tool: 'Edit' }, () => ({ result: undefined as never, text: 'ok' }))
  on('command.register', () => ({ value: undefined }) as never)
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: 'C:\\proj', surface: 'terminal', isInteractive: true })
  await $.tool.call({ tool: 'Edit', file_path: 'C:\\proj\\src\\a.cs', old_string: 'old', new_string: 'new1\nnew2' } as never)

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({
      ...PANE,
      surface,
      props: { title: 'Oturum değişiklikleri', isFocused: true, bodyColumns: 80 } as never,
    })
    expect(await ui.find({ type: 'Text', text: /1 dosya/ })).toBeDefined()
    await ui.press({ key: 'file:src/a.cs' })
    expect(await ui.find({ key: 'back' })).toBeDefined()
    await ui.press({ key: 'back' })
    await ui.unmount()
  }
})

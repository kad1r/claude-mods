import { expect, test } from 'claude-code/testing'

const BAND = { plugin: 'clawd-spinner', component: 'AbovePrompt', requestId: 'band' } as const
const props = (isWorking: boolean) =>
  ({ isWorking, hasSurvey: false, maxRows: 20, bodyColumns: 100 }) as never

test('the band draws Clawd only while Claude works', async ($, on) => {
  // Stands for the engine's own band beneath the plugin: nothing of its own.
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box key="engine" />
  })
  const working = await $.ui.mount({ ...BAND, surface: 'terminal', props: props(true) })
  expect(await working.find({ key: 'clawd' })).toBeDefined()
  await working.unmount()

  const idle = await $.ui.mount({ ...BAND, surface: 'terminal', props: props(false) })
  expect(await idle.find({ key: 'clawd' })).toBeUndefined()
  await idle.unmount()
})

for (const size of ['small', 'large'] as const) {
  test(`the ${size} band mounts at its size`, { options: { size } }, async ($, on) => {
    on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
      const { Box } = $.ui.resolve(e)
      return <Box key="engine" />
    })
    const ui = await $.ui.mount({ ...BAND, surface: 'terminal', props: props(true) })
    expect(await ui.find({ key: 'clawd' })).toBeDefined()
    await ui.unmount()
  })
}

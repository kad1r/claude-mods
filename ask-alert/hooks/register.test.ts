import { expect, test } from 'claude-code/testing'

const ok = { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }

test('alerts on a permission prompt notification', async ($, on) => {
  const runs: string[][] = []
  on('classic.Notification', () => ({}))
  on('ui.toast', () => ({ value: undefined }))
  on('process.run', (_$, e) => {
    runs.push([...e.argv])
    return ok
  })

  await $.classic.Notification({ message: 'Claude needs your permission to use Bash', notification_type: 'permission_prompt' })

  expect(runs.length).toBe(1)
  expect(runs[0]?.[0]).toBe('powershell.exe')
})

test('ignores other notification types', async ($, on) => {
  const runs: string[][] = []
  on('classic.Notification', () => ({}))
  on('ui.toast', () => ({ value: undefined }))
  on('process.run', (_$, e) => {
    runs.push([...e.argv])
    return ok
  })

  await $.classic.Notification({ message: 'Logged in', notification_type: 'auth_success' })

  expect(runs.length).toBe(0)
})

test('alerts once for AskUserQuestion, not again within the cooldown', async ($, on) => {
  const runs: string[][] = []
  on('classic.Notification', () => ({}))
  on('ui.toast', () => ({ value: undefined }))
  on('tool.call', () => ({ result: 'answered' }))
  on('process.run', (_$, e) => {
    runs.push([...e.argv])
    return ok
  })

  const q = { questions: [{ question: 'Hangisi?', header: 'Seçim', multiSelect: false, options: [{ label: 'A', description: 'a' }, { label: 'B', description: 'b' }] }] }
  await $.tool.call({ tool: 'AskUserQuestion', ...q })
  await $.classic.Notification({ message: 'waiting', notification_type: 'permission_prompt' })

  expect(runs.length).toBe(1)
})

import { expect, test } from 'claude-code/testing'

const turn = { answer: 'ok', durationMs: 1000, isAborted: false, turnId: 't1' }

test('plays the sound once when the main loop answers', async ($, on) => {
  const runs: string[][] = []
  on('process.run', (_$, e) => {
    runs.push([...e.argv])
    return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('turn.complete', () => ({ text: '' }))

  await $.turn.complete({ ...turn, reason: 'answer' })

  expect(runs.length).toBe(1)
  expect(runs[0]?.[0]).toBe('powershell.exe')
})

test('stays silent for subagents and interrupted turns', async ($, on) => {
  const runs: string[][] = []
  on('process.run', (_$, e) => {
    runs.push([...e.argv])
    return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('turn.complete', () => ({ text: '' }))

  await $.turn.complete({ ...turn, reason: 'answer', agentId: 'sub-1' })
  await $.turn.complete({ ...turn, reason: 'aborted', isAborted: true })

  expect(runs.length).toBe(0)
})

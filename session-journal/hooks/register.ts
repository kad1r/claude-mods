import type { EngineInterface, Register } from 'claude-code'

import { appendTo, clock, fileFor, SUMMARY_SYSTEM, transcript, turnLine } from './journal'

async function append($: EngineInterface, dir: string, at: Date, block: string) {
  const path = fileFor(dir, at)
  const existing = (await $.fs.exists(path)) ? await $.fs.read(path) : ''
  await $.fs.write(path, appendTo(existing, path.slice(-13, -3), block))
  return path
}

export const register: Register = on => {
  let dir = ''
  let project = ''
  let prompt = ''
  let tools = 0
  let startedAt = 0

  on('session.start', async ($, e, next) => {
    const home = (await $.env.get('USERPROFILE')) ?? (await $.env.get('HOME')) ?? '.'
    dir = `${home.replace(/\\/g, '/')}/.claude/journal`
    project = e.cwd.replace(/[\\/]+$/, '').split(/[\\/]/).pop() || e.cwd
    await $.command.register({ name: 'gunluk', description: 'Bu oturumun özetini bugünün günlüğüne ekle (Haiku)' })
    return next(e)
  })

  on('prompt.submit', ($, e, next) => {
    if (e.origin.kind === 'composer' || e.origin.kind === 'bridge') prompt = e.text
    return next(e)
  }).catch(($, e, next) => next(e))

  on('turn.start', async ($, e, next) => {
    startedAt = await $.clock.now()
    tools = 0
    return next(e)
  })

  on('tool.call', ($, e, next) => {
    if (e.agentId === undefined) tools += 1
    return next(e)
  })

  // One line per answered main-loop turn; slash commands and empty turns are skipped.
  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined && prompt !== '' && !prompt.startsWith('/')) {
      const end = await $.clock.now()
      await append($, dir, new Date(end), turnLine(new Date(end), project, prompt, tools, Math.round((end - startedAt) / 1000)))
      prompt = ''
    }
    return next(e)
  }).catch(($, e, next) => next(e))

  on('command.run', { command: 'gunluk' }, async $ => {
    const text = transcript(await $.session.messages())
    if (text === '') return { text: 'Özetlenecek bir şey yok.' }

    const reply = await $.model.complete({
      model: 'haiku',
      system: SUMMARY_SYSTEM,
      prompt: text,
      maxTokens: 800,
      effort: 'low',
      timeoutMs: 60_000,
    })
    if (!reply.isAnswered) return { text: `Özet alınamadı (${reply.reason}).` }

    const at = new Date(await $.clock.now())
    const path = await append($, dir, at, `\n### ${clock(at)} ${project} — oturum özeti\n\n${reply.text.trim()}\n`)
    return { text: `Günlüğe eklendi: ${path}\n\n${reply.text.trim()}` }
  })
}

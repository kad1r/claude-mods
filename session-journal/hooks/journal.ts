import type { SessionMessage } from 'claude-code'

// How much of the conversation the summary request may carry.
export const MAX_TRANSCRIPT_CHARS = 24_000

export const pad2 = (n: number): string => String(n).padStart(2, '0')

export const fileFor = (dir: string, d: Date): string =>
  `${dir}/${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}.md`

export const clock = (d: Date): string => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`

export const firstLine = (text: string, max = 100): string => {
  const line = text.trim().split(/\r?\n/)[0] ?? ''
  return line.length > max ? line.slice(0, max - 1) + '…' : line
}

export const turnLine = (at: Date, project: string, prompt: string, tools: number, seconds: number): string =>
  `- ${clock(at)} **${project}** — ${firstLine(prompt) || '(boş)'} _(${tools} araç, ${seconds}s)_`

// A day file starts with its date as heading.
export const appendTo = (existing: string, day: string, block: string): string =>
  (existing === '' ? `# ${day}\n\n` : existing.endsWith('\n') ? existing : existing + '\n') + block + '\n'

// The transcript's newest part when it is too long: what was done last matters most.
export const transcript = (messages: readonly SessionMessage[]): string => {
  const lines = messages
    .filter(m => m.text.trim() !== '')
    .map(m => `${m.role === 'user' ? 'KULLANICI' : 'CLAUDE'}: ${m.text.trim()}`)
  const all = lines.join('\n\n')
  return all.length > MAX_TRANSCRIPT_CHARS ? '…\n' + all.slice(all.length - MAX_TRANSCRIPT_CHARS) : all
}

export const SUMMARY_SYSTEM =
  'Bir geliştirici oturumunun günlük özetini yazıyorsun. Türkçe, 3-8 madde, her madde tek satır. ' +
  'Ne yapıldı, ne karar verildi, ne açık kaldı. Dosya adı, komut ve teknik terimleri olduğu gibi bırak. ' +
  'Giriş veya kapanış cümlesi yazma, sadece maddeler.'

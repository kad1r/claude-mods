import type { EngineInterface, Register } from 'claude-code'

type Mode = 'both' | 'toast' | 'sound'

// One PowerShell call raises a native Windows toast (under PowerShell's AppId, silent)
// and/or plays a system wav synchronously. Text arrives through env vars, never the script.
const ALERT_SCRIPT = [
  "$ErrorActionPreference = 'SilentlyContinue'",
  "if ($env:ASK_TOAST -eq '1') {",
  '  [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null',
  '  [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null',
  '  $t = [Security.SecurityElement]::Escape($env:ASK_TITLE)',
  '  $b = [Security.SecurityElement]::Escape($env:ASK_BODY)',
  '  $x = New-Object Windows.Data.Xml.Dom.XmlDocument',
  '  $x.LoadXml("<toast><visual><binding template=\'ToastGeneric\'><text>$t</text><text>$b</text></binding></visual><audio silent=\'true\'/></toast>")',
  "  $app = '{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\\WindowsPowerShell\\v1.0\\powershell.exe'",
  '  [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($app).Show([Windows.UI.Notifications.ToastNotification]::new($x))',
  '}',
  "if ($env:ASK_SOUND -eq '1') { (New-Object System.Media.SoundPlayer $env:ASK_WAV).PlaySync() }",
].join('\n')

const WAV = 'C:\\Windows\\Media\\Windows Notify System Generic.wav'
// A permission prompt raises both the AskUserQuestion/tool path and a Notification; alert once.
const COOLDOWN_MS = 3000

let mode: Mode = 'both'
let lastAlertAt = 0

function alert($: EngineInterface, title: string, body: string): void {
  const now = Date.now()
  if (now - lastAlertAt < COOLDOWN_MS) return
  lastAlertAt = now
  $.ui.toast(`${title}: ${body}`)
  void $.process
    .run(['powershell.exe', '-NoProfile', '-NonInteractive', '-Command', ALERT_SCRIPT], {
      env: {
        ASK_TITLE: title,
        ASK_BODY: body.slice(0, 200),
        ASK_TOAST: mode === 'sound' ? '0' : '1',
        ASK_SOUND: mode === 'toast' ? '0' : '1',
        ASK_WAV: WAV,
      },
      timeoutMs: 15_000,
    })
    .catch(() => undefined)
}

export const register: Register = (on, options) => {
  const m = options['mode']
  mode = m === 'toast' || m === 'sound' ? m : 'both'

  on('classic.Notification', ($, e, next) => {
    if (e.notification_type === 'permission_prompt') alert($, 'Claude onay bekliyor', e.message)
    else if (e.notification_type === 'idle_prompt') alert($, 'Claude yanıtını bekliyor', e.message)
    else if (e.notification_type === 'elicitation_dialog') alert($, 'Claude bilgi istiyor', e.message)
    return next(e)
  })

  on('tool.call', { tool: 'AskUserQuestion' }, ($, e, next) => {
    if (e.agentId === undefined) {
      const first = e.questions[0]?.question ?? 'Bir sorusu var'
      alert($, 'Claude soru soruyor', first)
    }
    return next(e)
  })
}

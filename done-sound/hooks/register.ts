import type { Register } from 'claude-code'

// $.audio.play has no player on a Windows terminal, so PowerShell's MediaPlayer plays the mp3.
// It waits for the clip's length before exiting, or the sound would be cut off.
const PLAY_SCRIPT = [
  'Add-Type -AssemblyName PresentationCore',
  '$p = New-Object System.Windows.Media.MediaPlayer',
  '$p.Open([uri]$env:DONE_SOUND)',
  '$i = 0',
  'while (-not $p.NaturalDuration.HasTimeSpan -and $i -lt 30) { Start-Sleep -Milliseconds 100; $i++ }',
  '$p.Play()',
  '$d = if ($p.NaturalDuration.HasTimeSpan) { [int]$p.NaturalDuration.TimeSpan.TotalMilliseconds } else { 6000 }',
  'Start-Sleep -Milliseconds ($d + 200)',
  '$p.Close()',
].join('; ')

export const register: Register = on => {
  let isPlaying = false

  on('turn.complete', ($, e, next) => {
    // Main loop answers only: subagent runs and interrupted turns stay silent.
    if (e.agentId === undefined && e.reason === 'answer' && !isPlaying) {
      isPlaying = true
      void $.process
        .run(['powershell.exe', '-NoProfile', '-NonInteractive', '-Command', PLAY_SCRIPT], {
          env: { DONE_SOUND: `${$.plugin.root}/sounds/done.mp3` },
          timeoutMs: 60_000,
        })
        .catch(() => undefined)
        .finally(() => {
          isPlaying = false
        })
    }
    return next(e)
  })
}

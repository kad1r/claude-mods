import type { Register } from 'claude-code'

// $.audio.play has no player on a Windows terminal, so PowerShell's MediaPlayer plays the mp3.
// It picks a random mp3 from the sounds folder, skipping the last one played when it can,
// prints the chosen name, and waits for the clip's length so the sound is not cut off.
const PLAY_SCRIPT = [
  '$all = @(Get-ChildItem -LiteralPath $env:DONE_SOUND_DIR -Filter *.mp3)',
  'if ($all.Count -eq 0) { exit 0 }',
  '$pool = @($all | Where-Object { $_.Name -ne $env:DONE_SOUND_LAST })',
  'if ($pool.Count -eq 0) { $pool = $all }',
  '$f = $pool | Get-Random',
  '[Console]::Out.Write($f.Name)',
  'Add-Type -AssemblyName PresentationCore',
  '$p = New-Object System.Windows.Media.MediaPlayer',
  '$p.Open([uri]$f.FullName)',
  '$i = 0',
  'while (-not $p.NaturalDuration.HasTimeSpan -and $i -lt 30) { Start-Sleep -Milliseconds 100; $i++ }',
  '$p.Play()',
  '$d = if ($p.NaturalDuration.HasTimeSpan) { [int]$p.NaturalDuration.TimeSpan.TotalMilliseconds } else { 6000 }',
  'Start-Sleep -Milliseconds ($d + 200)',
  '$p.Close()',
].join('; ')

export const register: Register = on => {
  let isPlaying = false
  let lastSound = ''

  on('turn.complete', ($, e, next) => {
    // Main loop answers only: subagent runs and interrupted turns stay silent.
    if (e.agentId === undefined && e.reason === 'answer' && !isPlaying) {
      isPlaying = true
      void $.process
        .run(['powershell.exe', '-NoProfile', '-NonInteractive', '-Command', PLAY_SCRIPT], {
          env: { DONE_SOUND_DIR: `${$.plugin.root}/sounds`, DONE_SOUND_LAST: lastSound },
          timeoutMs: 60_000,
        })
        .then(r => {
          if (r.stdout) lastSound = r.stdout.trim()
        })
        .catch(() => undefined)
        .finally(() => {
          isPlaying = false
        })
    }
    return next(e)
  })
}

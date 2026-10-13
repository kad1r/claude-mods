import type { EngineInterface, Register } from 'claude-code'

const BAR_WIDTH = 10
export const INTERVAL_SECONDS = 5
// Load where the dot turns yellow, then red.
export const WARN_PERCENT = 60
export const ALERT_PERCENT = 85
export const WARN_CELSIUS = 80
export const ALERT_CELSIUS = 90
// Wait before starting the sampler again after it died.
const RESTART_MS = 30_000

export type Sample = {
  cpu: number
  ramTotalKb: number
  ramFreeKb: number
  celsius?: number
}

// One long-lived PowerShell samples every few seconds, so no process starts per tick.
// Thermal zone counters are readable without admin rights; values are tenths of a kelvin.
const SCRIPT = `
$ErrorActionPreference = 'SilentlyContinue'
while ($true) {
  $c = (Get-CimInstance Win32_PerfFormattedData_PerfOS_Processor -Filter "Name='_Total'").PercentProcessorTime
  $o = Get-CimInstance Win32_OperatingSystem
  $t = (Get-CimInstance Win32_PerfFormattedData_Counters_ThermalZoneInformation | Measure-Object HighPrecisionTemperature -Maximum).Maximum
  [Console]::Out.WriteLine("SYS $c $($o.TotalVisibleMemorySize) $($o.FreePhysicalMemory) $t")
  [Console]::Out.Flush()
  Start-Sleep -Seconds ${INTERVAL_SECONDS}
}`

export const parse = (row: string): Sample | undefined => {
  const [tag, cpu, total, free, temp] = row.trim().split(/\s+/)
  if (tag !== 'SYS') {
    return undefined
  }
  const sample: Sample = { cpu: Number(cpu), ramTotalKb: Number(total), ramFreeKb: Number(free) }
  if (![sample.cpu, sample.ramTotalKb, sample.ramFreeKb].every(Number.isFinite) || sample.ramTotalKb <= 0) {
    return undefined
  }
  const tenthsKelvin = Number(temp)
  if (temp !== undefined && temp !== '' && Number.isFinite(tenthsKelvin) && tenthsKelvin > 0) {
    sample.celsius = Math.round(tenthsKelvin / 10 - 273.15)
  }
  return sample
}

const bar = (percent: number): string => {
  const filled = Math.max(0, Math.min(BAR_WIDTH, Math.round((percent / 100) * BAR_WIDTH)))
  return '▰'.repeat(filled) + '▱'.repeat(BAR_WIDTH - filled)
}

const level = (value: number, warn: number, alert: number): number => (value >= alert ? 2 : value >= warn ? 1 : 0)

const gb = (kb: number): string => (kb / 1024 / 1024).toFixed(1)

// Drawn like usage-meter's line: dot, label, bar, figures.
export const line = (s: Sample): string => {
  const ramUsedKb = s.ramTotalKb - s.ramFreeKb
  const ram = Math.round((ramUsedKb / s.ramTotalKb) * 100)
  const cpu = Math.round(s.cpu)
  const worst = Math.max(
    level(cpu, WARN_PERCENT, ALERT_PERCENT),
    level(ram, WARN_PERCENT, ALERT_PERCENT),
    s.celsius === undefined ? 0 : level(s.celsius, WARN_CELSIUS, ALERT_CELSIUS),
  )
  const parts = [
    `${['🟢', '🟡', '🔴'][worst]} cpu ${bar(cpu)} %${cpu}`,
    `ram ${bar(ram)} %${ram} ${gb(ramUsedKb)}/${gb(s.ramTotalKb)}G`,
  ]
  if (s.celsius !== undefined) {
    parts.push(`🌡 ${s.celsius}°C`)
  }
  return parts.join(' · ')
}

async function sample($: EngineInterface) {
  let pending = ''
  const child = $.process.spawn({
    argv: ['powershell.exe', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', SCRIPT],
  })
  for await (const { stream, text } of child) {
    if (stream !== 'stdout') {
      continue
    }
    pending += text
    const rows = pending.split(/\r?\n/)
    pending = rows.pop() ?? ''
    const last = rows.map(parse).filter(s => s !== undefined).pop()
    if (last !== undefined) {
      $.ui.status(line(last))
    }
  }
}

export const register: Register = on => {
  let isRunning = false

  // Also runs after a hot reload; the old module's child dies with it.
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    if (!isRunning) {
      isRunning = true
      $.ui.status('⏳ cpu/ram okunuyor…')
      void (async () => {
        for (;;) {
          try {
            await sample($)
          } catch (err) {
            $.ui.log(`sys-meter: sampler stopped: ${String(err)}`, { to: 'debug' })
          }
          $.ui.status(undefined)
          await $.clock.sleep(RESTART_MS)
        }
      })()
    }
    return started
  })
}

import type { EngineInterface, Register, Timer } from 'claude-code'

import { cells, columnsFor, frame, moodAt, octantSpans, pickScene, rowsFor } from './scene'
import type { Mood, Scene, Size } from './scene'

const KEY = 'clawd'
// The small band redraws its text each frame, so it runs a little slower.
const FRAME_MS: Record<Size, number> = { small: 160, large: 125 }

// One animation at a time, for the main loop's turn.
let turnId: string | undefined
let scene: Scene | undefined
let mood: Mood = 'none'
let tick = 0
let timer: Timer | undefined
// The band the large Raster is mounted in, learned when the band draws it.
let bandId: string | undefined
// `small` (16 x 1 cells) unless the person picked `large` (32 x 2) in /config.
let size: Size = 'small'

const canvas = () => frame(scene ?? 'walk', tick, mood)

function stop() {
  timer?.cancel()
  timer = undefined
}

// Large: repaints the mounted Raster alone, the rest of the band stays as drawn;
// a refused blit means the Raster is gone (turn over, band hidden).
// Small: its octant glyphs lie beyond what a Raster takes, so the band redraws.
async function step($: EngineInterface) {
  tick += 1
  if (size === 'small') {
    $.ui.invalidate('ui.render')
    return
  }
  if (bandId === undefined) return
  const done = await $.ui.blit({ requestId: bandId, key: KEY, cells: cells(canvas()) }).catch(() => ({ deny: 'failed' }))
  if ('deny' in done && done.deny !== undefined) stop()
}

export const register: Register = (on, options) => {
  size = options['size'] === 'large' ? 'large' : 'small'

  on('turn.start', ($, e, next) => {
    stop()
    turnId = e.turnId
    tick = 0
    // A random scene for every command, never the same one twice in a row.
    scene = pickScene(scene, Math.random())
    mood = moodAt(new Date())
    timer = $.clock.every(FRAME_MS[size], () => step($))
    return next(e)
  })

  // A subagent's turn ends inside the main one; only the main turn's end stops Clawd.
  on('turn.complete', ($, e, next) => {
    if (e.agentId === undefined && (turnId === undefined || e.turnId === turnId)) {
      stop()
      turnId = undefined
      $.ui.invalidate('ui.render')
    }
    return next(e)
  })

  // Wraps what other plugins draw above the prompt (git-band, ...) instead of replacing it.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const below = await next(e)
    const columns = columnsFor(size)
    const rows = rowsFor(size)
    const hasRoom = e.props.bodyColumns >= columns && e.props.maxRows > rows + 2
    if (!e.props.isWorking || e.props.hasSurvey || e.surface !== 'terminal' || !hasRoom) {
      return below
    }

    const { Box, Raster, Text } = $.ui.resolve(e)
    bandId = e.requestId

    const band =
      size === 'small' ? (
        <Box key={KEY}>
          {octantSpans(canvas()).map(s => (
            <Text color={s.color} backgroundColor={s.background}>
              {s.text}
            </Text>
          ))}
        </Box>
      ) : (
        <Raster key={KEY} columns={columns} rows={rows} cells={cells(canvas())} />
      )

    return (
      <Box flexDirection="column">
        {band}
        {below}
      </Box>
    )
  })
}

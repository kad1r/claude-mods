import type { Register, Timer } from 'claude-code'

import { cells, columnsFor, frame, moodAt, pickScene, ROWS, SCENE_W } from './scene'
import type { Mood } from './scene'

const FRAME_MS = 125

export const register: Register = on => {
  let word = ''
  let mood: Mood = 'none'
  let tick = 0
  let timer: Timer | undefined

  const stop = () => {
    timer?.cancel()
    timer = undefined
  }

  on('turn.start', ($, e, next) => {
    stop()
    tick = 0
    mood = moodAt(new Date())
    timer = $.clock.every(FRAME_MS, () => {
      tick += 1
      $.ui.invalidate('ui.render')
    })
    return next(e)
  })

  on('turn.complete', ($, e, next) => {
    // A subagent's run ends inside the main turn; keep animating until the main loop ends.
    if (e.agentId !== undefined) {
      return next(e)
    }
    stop()
    $.ui.invalidate('ui.render')
    return next(e)
  })

  // Only reads the spinner word; the engine still draws the spinner itself.
  on('ui.render', { component: 'Spinner' }, ($, e, next) => {
    if (e.props.word !== word) {
      word = e.props.word
      $.ui.invalidate('ui.render')
    }
    return next(e)
  })

  // Wraps whatever other plugins draw above the prompt (e.g. clear-reminder) instead of replacing it.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const below = await next(e)
    const hasRoom = columnsFor(e.props.bodyColumns) >= SCENE_W && e.props.maxRows > ROWS + 2
    if (!e.props.isWorking || e.props.hasSurvey || e.surface !== 'terminal' || !hasRoom) {
      return below
    }

    const { Box, Raster } = $.ui.resolve(e)
    // Half the band's own column count, so it follows terminal resizes.
    const columns = columnsFor(e.props.bodyColumns)

    return (
      <Box flexDirection="column">
        <Raster key="clawd" columns={columns} rows={ROWS} cells={cells(frame(pickScene(word), tick, columns, mood))} />
        {below}
      </Box>
    )
  })
}

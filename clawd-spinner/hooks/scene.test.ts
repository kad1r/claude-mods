import { expect, test } from 'claude-code/testing'

import { cells, columnsFor, frame, H, moodAt, pickScene, ROWS, SCENE_W } from './scene'

test('spinner words pick themed scenes', () => {
  expect(pickScene('Beaming')).toBe('ufo')
  expect(pickScene('Sauteing')).toBe('cook')
  expect(pickScene('Pondering')).toBe('think')
  expect(pickScene('Forging')).toBe('build')
  expect(pickScene('Accomplishing')).toBe('board')
  expect(pickScene('Wiggling')).toBe('jump')
  expect(pickScene('Xyzzy')).toBe('walk')
})

test('the band is 3 rows tall and 75% of the terminal wide, up to the Raster limit', () => {
  expect(ROWS).toBe(3)
  expect(columnsFor(80)).toBe(60)
  expect(columnsFor(240)).toBe(180)
  expect(columnsFor(900)).toBe(512)
})

test('every scene renders valid cells at narrow and wide widths', () => {
  for (const width of [SCENE_W, 80, 213]) {
    for (const scene of ['ufo', 'cook', 'think', 'build', 'board', 'jump', 'walk'] as const) {
      for (let t = 0; t < 40; t++) {
        const c = frame(scene, t, width)
        expect(c.px.length).toBe(width * H)
        expect(atob(cells(c)).length).toBe(width * ROWS * 3 * 4)
      }
    }
  }
})

test('the backdrop follows the local clock', () => {
  expect(moodAt(new Date(2026, 9, 12, 8, 30))).toBe('morning') // Monday
  expect(moodAt(new Date(2026, 9, 12, 14, 0))).toBe('none')
  expect(moodAt(new Date(2026, 9, 12, 23, 0))).toBe('night')
  expect(moodAt(new Date(2026, 9, 13, 2, 0))).toBe('night')
  expect(moodAt(new Date(2026, 9, 16, 17, 0))).toBe('party') // Friday
  expect(moodAt(new Date(2026, 9, 16, 9, 0))).toBe('morning')
})

test('every mood renders valid cells behind every scene', () => {
  for (const width of [1, SCENE_W, 80, 213]) {
    for (const mood of ['morning', 'night', 'party', 'none'] as const) {
      for (const scene of ['ufo', 'walk', 'think'] as const) {
        for (let t = 0; t < 20; t++) {
          const c = frame(scene, t, width, mood)
          expect(c.px.length).toBe(width * H)
          expect(atob(cells(c)).length).toBe(width * ROWS * 3 * 4)
        }
      }
    }
  }
  const quiet = frame('jump', 0, 80)
  const party = frame('jump', 0, 80, 'party')
  expect(Array.from(party.px).filter(p => p !== -1).length).toBeGreaterThan(Array.from(quiet.px).filter(p => p !== -1).length)
})

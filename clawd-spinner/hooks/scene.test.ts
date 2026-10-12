import { expect, test } from 'claude-code/testing'

import { OCTANT } from './octants'
import { BAND_W, cells, columnsFor, frame, H, moodAt, octantCells, octantSpans, pickScene, rowsFor, ROWS, SCENES } from './scene'
import type { Mood } from './scene'

const MOODS: Mood[] = ['morning', 'night', 'party', 'none']
const CLAWD = 0xd97757

// Clawd's top-left pixel: the head row ' OOOOO ' starts one pixel in.
const clawdX = (px: Int32Array, width: number) => {
  for (let x = 0; x < width; x++) if (px[x] === CLAWD) return x - 1
  return -1
}

test('17 scenes, picked at random and never twice in a row', () => {
  expect(SCENES.length).toBe(17)
  for (const previous of [undefined, ...SCENES]) {
    for (const roll of [0, 0.25, 0.5, 0.999]) {
      const next = pickScene(previous, roll)
      expect(SCENES).toContain(next)
      expect(next).not.toBe(previous)
    }
  }
  // Every scene is reachable.
  const seen = new Set(Array.from({ length: 160 }, (_, i) => pickScene('walk', i / 160)))
  expect(seen.size).toBe(16)
})

test('small is 16 x 1 cells, large 32 x 2', () => {
  expect([columnsFor('small'), rowsFor('small')]).toEqual([16, 1])
  expect([columnsFor('large'), rowsFor('large')]).toEqual([BAND_W, ROWS])
})

test('every one of the 256 octant patterns has its own glyph', () => {
  expect(OCTANT.length).toBe(256)
  expect(new Set(OCTANT).size).toBe(256)
  expect(OCTANT[0]).toBe(0x20) // empty
  expect(OCTANT[255]).toBe(0x2588) // full block
  expect(OCTANT[0b00001111]).toBe(0x2580) // top half
  expect(OCTANT[0b11110000]).toBe(0x2584) // bottom half
  expect(OCTANT[0b01010101]).toBe(0x258c) // left half
})

test('small cells draw exactly the pixels of each cell main color', () => {
  const glyphBits = new Map(OCTANT.map((g, bits) => [g, bits]))
  for (const scene of SCENES) {
    for (const t of [1, 5, 9]) {
      const c = frame(scene, t, 'night')
      const row = octantCells(c)
      expect(row.length).toBe(16)
      row.forEach((cell, col) => {
        const bits = glyphBits.get(cell.glyph) ?? 0
        for (let k = 0; k < 8; k++) {
          const p = c.px[Math.floor(k / 2) * BAND_W + col * 2 + (k % 2)]
          expect(((bits >> k) & 1) === 1).toBe(cell.fg !== undefined && p === cell.fg)
        }
      })
      // The spans spell the same 16 glyphs.
      expect([...octantSpans(c).map(s => s.text).join('')].length).toBe(16)
    }
  }
})

test('every scene and mood encodes to exactly the band', () => {
  for (const scene of SCENES) {
    for (const mood of MOODS) {
      for (let t = 0; t < 48; t++) {
        const c = frame(scene, t, mood)
        expect(c.px.length).toBe(BAND_W * H)
        expect(atob(cells(c)).length).toBe(BAND_W * ROWS * 3 * 4)
      }
    }
  }
})

test('Clawd is whole in every frame: head, eyes, body and legs', () => {
  for (const scene of SCENES) {
    for (let t = 1; t < 48; t++) {
      if (t % 24 === 0) continue // blink frame
      const { px } = frame(scene, t, 'party')
      const x = clawdX(px, BAND_W)
      expect(x).toBeGreaterThanOrEqual(0)
      const row = (y: number) => Array.from(px.slice(y * BAND_W + x, y * BAND_W + x + 7)).map(p => (p === CLAWD ? 'O' : p === 0x1a1a1a ? 'K' : p === 0xb85c3e ? 'D' : '.')).join('')
      expect(row(0)).toBe('.OOOOO.')
      expect(row(1)).toBe(scene === 'sleep' ? '.ODODO.' : '.OKOKO.')
      expect(row(2)).toBe('OOOOOOO')
    }
  }
})

test('Clawd stands still in every scene but walk', () => {
  for (const scene of SCENES.filter(s => s !== 'walk')) {
    const xs = new Set(Array.from({ length: 24 }, (_, t) => clawdX(frame(scene, t + 1).px, BAND_W)))
    expect([...xs]).toEqual([1])
  }
  const walk = new Set(Array.from({ length: 60 }, (_, t) => clawdX(frame('walk', t + 1).px, BAND_W)))
  expect(walk.size).toBeGreaterThan(10)
})

test('the backdrop follows the local clock', () => {
  expect(moodAt(new Date(2026, 9, 12, 8, 30))).toBe('morning') // Monday
  expect(moodAt(new Date(2026, 9, 12, 14, 0))).toBe('none')
  expect(moodAt(new Date(2026, 9, 12, 23, 0))).toBe('night')
  expect(moodAt(new Date(2026, 9, 13, 2, 0))).toBe('night')
  expect(moodAt(new Date(2026, 9, 16, 17, 0))).toBe('party') // Friday
  expect(moodAt(new Date(2026, 9, 16, 9, 0))).toBe('morning')
})

import { OCTANT } from './octants'

// Pixel scenes for a small band under the spinner: BAND_W x H pixels. The
// `small` size packs 2 x 4 pixels into each terminal cell (block octants), so the
// band is 16 x 1 cells; `large` packs 1 x 2 (half blocks), 32 x 2 cells.
// Clawd keeps his full 7 x 4 shape and stands at CLAWD_X in every scene but
// `walk`; each scene's props stand to his right, the time-of-day backdrop at
// the band's right end. Every turn shows one scene, picked at random.

export const BAND_W = 32
export const H = 4
export const ROWS = H / 2

export type Size = 'small' | 'large'

export const columnsFor = (size: Size): number => (size === 'small' ? BAND_W / 2 : BAND_W)
export const rowsFor = (size: Size): number => (size === 'small' ? H / 4 : ROWS)
const NONE = -1
const DEFAULT_COLOR = 0x01000000

const PALETTE: Record<string, number> = {
  O: 0xd97757, // Clawd orange
  D: 0xb85c3e, // Clawd shade (blink)
  K: 0x1a1a1a, // eyes
  G: 0x8a8a96, // UFO hull
  W: 0xeeeeee, // white
  Y: 0xffd84d, // yellow
  B: 0x8b6a3e, // wood
  P: 0xe8e4d8, // paper
  L: 0xb8b2a6, // light gray
  S: 0x6b6b70, // steel
  C: 0xfff3a0, // beam
  M: 0xf4efc4, // moon
  F: 0x5a3a22, // coffee
  R: 0xe5484d, // confetti red
  U: 0x4c8dff, // confetti blue
  V: 0xb36bff, // confetti purple
  N: 0x46c46e, // confetti green
}

export const SCENES = [
  'walk',
  'ufo',
  'cook',
  'think',
  'build',
  'board',
  'jump',
  'rain',
  'fishing',
  'music',
  'laptop',
  'ball',
  'rocket',
  'plant',
  'bug',
  'blocks',
  'sleep',
] as const

export type Scene = (typeof SCENES)[number]

// A new scene for every turn, never the one just shown. `roll` is in [0, 1).
export const pickScene = (previous: Scene | undefined, roll: number): Scene => {
  const choices = SCENES.filter(s => s !== previous)
  return choices[Math.min(choices.length - 1, Math.floor(roll * choices.length))] ?? 'walk'
}

// Time-of-day backdrop: coffee in the morning, moon and stars at night,
// confetti after 17:00 on Friday.
export type Mood = 'morning' | 'night' | 'party' | 'none'

export const moodAt = (d: Date): Mood => {
  const h = d.getHours()
  if (d.getDay() === 5 && h >= 17) return 'party'
  if (h >= 6 && h < 11) return 'morning'
  if (h >= 20 || h < 6) return 'night'
  return 'none'
}

export type Canvas = { width: number; px: Int32Array }

const sprite = (c: Canvas, x: number, y: number, rows: readonly string[]) => {
  rows.forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx++) {
      const color = PALETTE[row.charAt(dx)]
      const px = x + dx
      const py = y + dy
      if (color !== undefined && px >= 0 && px < c.width && py >= 0 && py < H) {
        c.px[py * c.width + px] = color
      }
    }
  })
}

const dot = (c: Canvas, x: number, y: number, key: string) => sprite(c, x, y, [key])

const pingpong = (t: number, span: number) => {
  if (span <= 0) return 0
  const p = t % (span * 2)
  return p < span ? p : span * 2 - p
}

const CLAWD_W = 7
const CLAWD_X = 1
const PROP_X = CLAWD_X + CLAWD_W + 2

const clawd = (c: Canvas, x: number, t: number, isWalking: boolean, isAsleep = false) => {
  const isBlinking = isAsleep || t % 24 === 0
  const legs = isWalking && t % 2 === 1 ? 'O O O O' : ' O O O '
  sprite(c, x, 0, [' OOOOO ', isBlinking ? ' ODODO ' : ' OKOKO ', 'OOOOOOO', legs])
}

const Z = ['WWW', ' W ', 'WWW']
// Landing spot and color of each block in the `blocks` scene, in drop order.
const BLOCKS: ReadonlyArray<[number, number, string]> = [
  [0, 3, 'R'],
  [3, 3, 'U'],
  [6, 3, 'N'],
  [1, 2, 'Y'],
  [4, 2, 'V'],
]
const BLOCK_FALL = 4

const draw: Record<Scene, (c: Canvas, t: number) => void> = {
  walk: (c, t) => clawd(c, pingpong(t, c.width - CLAWD_W), t, true),

  jump: (c, t) => {
    clawd(c, CLAWD_X, t, true)
    const isUp = t % 4 < 2
    dot(c, PROP_X, isUp ? 0 : 2, 'Y')
    dot(c, PROP_X + 3, isUp ? 2 : 0, 'Y')
  },

  ufo: (c, t) => {
    clawd(c, CLAWD_X, t, false)
    const x = PROP_X + pingpong(t, 4)
    sprite(c, x, 0, ['GGGGGG', t % 2 === 0 ? 'GYGGYG' : 'GGYGGY'])
    if (t % 4 < 2) sprite(c, x + 2, 2, ['CC', 'CC'])
  },

  cook: (c, t) => {
    clawd(c, CLAWD_X, t, false)
    sprite(c, PROP_X, 1, ['S SSS S', 'SSSSSSS', ' SSSSS '])
    for (let k = 0; k < 3; k++) dot(c, PROP_X + 1 + k * 2 + ((t + k) % 2), 0, 'W')
  },

  think: (c, t) => {
    clawd(c, CLAWD_X, t, false)
    const step = t % 12
    if (step >= 3) dot(c, PROP_X - 1, 2, 'W')
    if (step >= 6) dot(c, PROP_X, 1, 'W')
    if (step >= 9) sprite(c, PROP_X + 1, 0, [' WWWWW ', 'WWKKWWW', ' WWWWW '])
  },

  build: (c, t) => {
    clawd(c, CLAWD_X, t, false)
    sprite(c, PROP_X + 1, 2, ['SSSSSS', ' SSSS '])
    if (t % 4 >= 2) {
      sprite(c, PROP_X, 1, ['BBBSS'])
      dot(c, PROP_X + 6 + (t % 2), 0, 'Y')
    } else {
      sprite(c, PROP_X, 0, ['SS', 'B '])
    }
  },

  board: (c, t) => {
    clawd(c, CLAWD_X, t, false)
    const lit = Math.floor(t / 6) % 3
    const item = (i: number) => 'BP' + (i === lit ? 'Y' : 'L') + 'LLLLB'
    sprite(c, PROP_X, 0, [item(0), item(1), item(2), 'BBBBBBBB'])
  },

  rain: (c, t) => {
    clawd(c, CLAWD_X, t, false)
    sprite(c, PROP_X, 0, [' LLLL ', 'LLLLLL'])
    for (let k = 0; k < 3; k++) dot(c, PROP_X + 1 + k * 2, 2 + ((t + k) % 2), 'U')
  },

  fishing: (c, t) => {
    clawd(c, CLAWD_X, t, false)
    dot(c, PROP_X - 2, 1, 'B')
    dot(c, PROP_X - 1, 0, 'B')
    dot(c, PROP_X, 1, 'L')
    dot(c, PROP_X, t % 4 < 2 ? 3 : 2, 'R')
    sprite(c, PROP_X + 3 + pingpong(t, 3), [3, 2, 1, 2][t % 4] ?? 3, ['UU'])
  },

  music: (c, t) => {
    clawd(c, CLAWD_X, t, false)
    for (let k = 0; k < 2; k++) {
      const y = 2 - ((t + k * 2) % 3)
      sprite(c, PROP_X + k * 4 + (k === 0 ? 0 : 1), y, [' Y', 'YY'])
    }
  },

  laptop: (c, t) => {
    clawd(c, CLAWD_X, t, false)
    sprite(c, PROP_X, 0, ['SSSSSS', 'SUUUUS', 'SUUUUS', 'LLLLLLL'])
    if (t % 2 === 0) dot(c, PROP_X + 1 + (Math.floor(t / 2) % 4), 1 + (Math.floor(t / 8) % 2), 'W')
  },

  ball: (c, t) => {
    clawd(c, CLAWD_X, t, false)
    sprite(c, PROP_X + 1, [3, 2, 1, 0, 1, 2][t % 6] ?? 3, ['RR'])
  },

  rocket: (c, t) => {
    clawd(c, CLAWD_X, t, false)
    const x = PROP_X + (t % 14)
    const flame = t % 2 === 0 ? 'Y' : 'R'
    sprite(c, x, 1, [flame + 'GGGM', 'R' + 'GGG'])
  },

  plant: (c, t) => {
    clawd(c, CLAWD_X, t, false)
    const stage = Math.floor(t / 4) % 5
    sprite(c, PROP_X + 1, 3, ['BBB'])
    if (stage >= 1) dot(c, PROP_X + 2, 2, 'N')
    if (stage >= 2) sprite(c, PROP_X + 1, 1, ['NNN'])
    if (stage >= 3) dot(c, PROP_X + 2, 0, stage === 4 ? 'R' : 'N')
  },

  bug: (c, t) => {
    clawd(c, CLAWD_X, t, false)
    const step = t % 10
    if (step < 9) sprite(c, PROP_X + 8 - step, 2, ['NNN', 'N N'])
    else sprite(c, PROP_X - 1, 2, ['Y Y', ' Y '])
  },

  blocks: (c, t) => {
    clawd(c, CLAWD_X, t, false)
    const cycle = t % (BLOCKS.length * BLOCK_FALL + BLOCK_FALL)
    const dropping = Math.floor(cycle / BLOCK_FALL)
    BLOCKS.forEach(([dx, y, color], i) => {
      if (i < dropping) sprite(c, PROP_X + dx, y, [color + color])
      else if (i === dropping) sprite(c, PROP_X + dx, Math.min(y, cycle % BLOCK_FALL), [color + color])
    })
  },

  sleep: (c, t) => {
    clawd(c, CLAWD_X, t, false, true)
    if (t % 8 < 6) sprite(c, PROP_X - 1, 1, Z)
    if (t % 8 >= 3) sprite(c, PROP_X + 3, 0, Z)
  },
}

// Stable pseudo-random per column, so stars and confetti do not jump around.
const hash = (x: number) => {
  let v = Math.imul(x ^ 0x9e3779b9, 0x85ebca6b)
  v ^= v >>> 13
  return (Math.imul(v, 0xc2b2ae35) ^ (v >>> 16)) >>> 0
}

const CONFETTI = ['R', 'Y', 'U', 'V', 'N', 'W']
const BACKDROP_X = PROP_X + 10

const backdrop: Record<Mood, (c: Canvas, t: number) => void> = {
  none: () => {},

  morning: (c, t) => {
    const x = c.width - 5
    sprite(c, x, 1, ['WWW ', 'WFWW', 'WWW '])
    dot(c, x + (t % 2), 0, 'L')
    sprite(c, x - 5, 0, [' Y ', 'YYY', ' Y '])
  },

  night: (c, t) => {
    sprite(c, c.width - 4, 0, [' MM', 'M  ', ' MM'])
    for (let x = BACKDROP_X; x < c.width - 5; x++) {
      const v = hash(x)
      if (v % 3 !== 0) continue
      if ((Math.floor(t / 4) + v) % 5 !== 0) dot(c, x, v % H, v % 2 === 0 ? 'Y' : 'W')
    }
  },

  party: (c, t) => {
    for (let x = BACKDROP_X; x < c.width; x++) {
      const v = hash(x)
      if (v % 2 !== 0) continue
      dot(c, x, (Math.floor(t / (1 + (v % 3))) + v) % H, CONFETTI[v % CONFETTI.length] ?? 'Y')
    }
  },
}

export const frame = (scene: Scene, t: number, mood: Mood = 'none', width = BAND_W): Canvas => {
  const c: Canvas = { width, px: new Int32Array(width * H).fill(NONE) }
  // The walk crosses the whole band, so it gets no backdrop to walk through.
  if (scene !== 'walk') backdrop[mood](c, t)
  draw[scene](c, t)
  return c
}

const toBase64 = (bytes: Uint8Array): string => {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i] ?? 0)
  return btoa(s)
}

// Two pixel rows per terminal row: '▀' with the top pixel as foreground, the bottom as background.
export const cells = (c: Canvas): string => {
  const w = c.width
  const words = new Uint32Array(w * ROWS * 3)
  for (let r = 0; r < ROWS; r++) {
    for (let x = 0; x < w; x++) {
      const top = c.px[r * 2 * w + x] ?? NONE
      const bottom = c.px[(r * 2 + 1) * w + x] ?? NONE
      const i = (r * w + x) * 3
      if (top === NONE && bottom === NONE) {
        words.set([0x20, DEFAULT_COLOR, DEFAULT_COLOR], i)
      } else if (top === NONE) {
        words.set([0x2584, bottom, DEFAULT_COLOR], i)
      } else {
        words.set([0x2580, top, bottom === NONE ? DEFAULT_COLOR : bottom], i)
      }
    }
  }
  return toBase64(new Uint8Array(words.buffer))
}

// Two by four pixels per cell, drawn as text: Raster cells hold BMP characters only
// and the octants lie beyond it. A cell has one foreground color: the one most of
// its pixels have, and only those pixels are drawn. The background is the
// terminal's, unless every pixel is painted, when the next color fills the rest.
// A darker pixel inside Clawd (his eyes) shows as a gap, as on the half-block band.
export type Span = { text: string; color?: string; background?: string }

const hex = (v: number) => '#' + (v & 0xffffff).toString(16).padStart(6, '0')

// One glyph per cell with its colors, left to right.
export const octantCells = (c: Canvas): { glyph: number; fg?: number; bg?: number }[] => {
  const out: { glyph: number; fg?: number; bg?: number }[] = []
  for (let col = 0; col < Math.ceil(c.width / 2); col++) {
    const counts = new Map<number, number>()
    let empty = 0
    const at = (k: number) => {
      const x = col * 2 + (k % 2)
      return x < c.width ? (c.px[Math.floor(k / 2) * c.width + x] ?? NONE) : NONE
    }
    for (let k = 0; k < 8; k++) {
      const p = at(k)
      if (p === NONE) empty += 1
      else counts.set(p, (counts.get(p) ?? 0) + 1)
    }
    const ranked = [...counts].sort((a, b) => b[1] - a[1])
    const fg = ranked[0]?.[0]
    const bg = empty === 0 ? ranked[1]?.[0] : undefined
    let bits = 0
    for (let k = 0; k < 8; k++) if (fg !== undefined && at(k) === fg) bits |= 1 << k
    out.push(bits === 0 ? { glyph: 0x20 } : { glyph: OCTANT[bits] ?? 0x2588, fg, bg })
  }
  return out
}

// Neighbouring cells of the same colors share one span.
export const octantSpans = (c: Canvas): Span[] => {
  const spans: Span[] = []
  for (const cell of octantCells(c)) {
    const color = cell.fg === undefined ? undefined : hex(cell.fg)
    const background = cell.bg === undefined ? undefined : hex(cell.bg)
    const last = spans[spans.length - 1]
    const ch = String.fromCodePoint(cell.glyph)
    if (last !== undefined && last.color === color && last.background === background) last.text += ch
    else spans.push({ text: ch, color, background })
  }
  return spans
}

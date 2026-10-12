// Pixel scenes drawn into a width x H canvas, encoded as Raster cells (two pixels per cell).
// The band is SCALE of the terminal's width; each scene's props sit in a SCENE_W wide block
// centered in it. The canvas is exactly Clawd's height: no sky, no ground line, so the band
// is two rows tall while Clawd keeps his full 7 x 4 pixel shape.

export const H = 4
export const ROWS = Math.ceil(H / 2)
export const SCALE = 0.5
export const SCENE_W = 20
export const MAX_COLUMNS = 512
const NONE = -1
const DEFAULT_COLOR = 0x01000000

const PALETTE: Record<string, number> = {
  O: 0xd97757, // Clawd orange
  D: 0xb85c3e, // Clawd shade
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
  R: 0xe5484d, // confetti red
  U: 0x4c8dff, // confetti blue
  V: 0xb36bff, // confetti purple
  N: 0x46c46e, // confetti green
  F: 0x5a3a22, // coffee
}

export type Scene = 'ufo' | 'cook' | 'think' | 'build' | 'board' | 'jump' | 'walk'

const SCENES: ReadonlyArray<[Scene, RegExp]> = [
  ['ufo', /beam|launch|teleport|orbit|zoom|fly|float|levitat|warp|rocket/i],
  ['cook', /bak|brew|cook|saut|simmer|stew|marinat|roast|boil|fry|frying|whisk|knead|ferment|caramel|season|stir|grill|toast|blanch|flamb|julienn|zest|garnish/i],
  ['think', /think|ponder|cogitat|contemplat|musing|ruminat|deliberat|wonder|reason|consider|mull|percolat|noodl|cerebrat|imagin|envision|hypothes|philosoph/i],
  ['build', /build|craft|forg|hammer|construct|assembl|tinker|smith|engineer|creat|making|sculpt|weld|mold|shaping|architect/i],
  ['board', /accomplish|plan|organiz|orchestrat|schem|calculat|comput|process|synthes|generat|writ|doodl|scribbl|sketch|draft|chart|mapping|analyz|catalog|listing/i],
  ['jump', /spin|whirl|churn|swirl|twist|wiggl|shimm|danc|jitter|boogi|frolic|bounc|hopping|jump|skedaddl|scurr|zigzag|gallivant|moonwalk|flutter/i],
]

export const pickScene = (word: string): Scene =>
  SCENES.find(([, re]) => re.test(word))?.[0] ?? 'walk'

type Canvas = { width: number; px: Int32Array }

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

const CLAWD_W = 7

const clawd = (c: Canvas, x: number, t: number, isWalking: boolean) => {
  const isBlinking = t % 24 === 0
  const legs = isWalking && t % 2 === 1 ? 'O O O O' : ' O O O '
  sprite(c, x, 0, [' OOOOO ', isBlinking ? ' ODODO ' : ' OKOKO ', 'OOOOOOO', legs])
}

const pingpong = (t: number, span: number) => {
  if (span <= 0) return 0
  const p = t % (span * 2)
  return p < span ? p : span * 2 - p
}

// `o` is the left edge of the centered SCENE_W block; props stand beside Clawd, at most H tall.
const draw: Record<Scene, (c: Canvas, t: number, o: number) => void> = {
  walk: (c, t) => clawd(c, 1 + pingpong(t, c.width - CLAWD_W - 2), t, true),

  jump: (c, t, o) => {
    clawd(c, o + 6, t, true)
    const isUp = t % 4 < 2
    dot(c, o + 3, isUp ? 0 : 2, 'Y')
    dot(c, o + 15, isUp ? 2 : 0, 'Y')
  },

  ufo: (c, t, o) => {
    clawd(c, o + 2, t, false)
    const x = o + 11 + pingpong(t, 3)
    sprite(c, x, 0, ['GGGGGG', t % 2 === 0 ? 'GYGGYG' : 'GGYGGY'])
    if (t % 4 < 2) sprite(c, x + 2, 2, ['CC', 'CC'])
  },

  cook: (c, t, o) => {
    clawd(c, o + 2, t, false)
    sprite(c, o + 11, 1, ['S SSS S', 'SSSSSSS', ' SSSSS '])
    for (let k = 0; k < 3; k++) dot(c, o + 12 + k * 2 + ((t + k) % 2), 0, 'W')
  },

  think: (c, t, o) => {
    clawd(c, o + 2, t, false)
    const step = t % 12
    if (step >= 3) dot(c, o + 10, 2, 'W')
    if (step >= 6) dot(c, o + 11, 1, 'W')
    if (step >= 9) sprite(c, o + 12, 0, [' WWWWW ', 'WWKKWWW', ' WWWWW '])
  },

  build: (c, t, o) => {
    clawd(c, o + 2, t, false)
    sprite(c, o + 11, 2, ['SSSSSS', ' SSSS '])
    if (t % 4 >= 2) {
      sprite(c, o + 10, 1, ['BBBSS'])
      dot(c, o + 16 + (t % 2), 0, 'Y')
    } else {
      sprite(c, o + 10, 0, ['SS', 'B '])
    }
  },

  board: (c, t, o) => {
    clawd(c, o + 2, t, false)
    const lit = Math.floor(t / 6) % 3
    const item = (i: number) => 'BP' + (i === lit ? 'Y' : 'L') + 'LLLLB'
    sprite(c, o + 11, 0, [item(0), item(1), item(2), 'BBBBBBBB'])
  },
}

// Time-of-day backdrop drawn behind every scene: coffee in the morning, moon and
// stars at night, confetti after 17:00 on Friday.
export type Mood = 'morning' | 'night' | 'party' | 'none'

export const moodAt = (d: Date): Mood => {
  const h = d.getHours()
  if (d.getDay() === 5 && h >= 17) return 'party'
  if (h >= 6 && h < 11) return 'morning'
  if (h >= 20 || h < 6) return 'night'
  return 'none'
}

// Stable pseudo-random per column, so stars and confetti do not jump around.
const hash = (x: number) => {
  let v = Math.imul(x ^ 0x9e3779b9, 0x85ebca6b)
  v ^= v >>> 13
  return (Math.imul(v, 0xc2b2ae35) ^ (v >>> 16)) >>> 0
}

const CONFETTI = ['R', 'Y', 'U', 'V', 'N', 'W']

const backdrop: Record<Mood, (c: Canvas, t: number) => void> = {
  none: () => {},

  morning: (c, t) => {
    const x = c.width - 5
    sprite(c, x, 1, ['WWW ', 'WFWW', 'WWW '])
    dot(c, x + (t % 2), 0, 'L')
    if (c.width > 12) sprite(c, 0, 0, [' Y ', 'YYY', ' Y '])
  },

  night: (c, t) => {
    if (c.width > 6) sprite(c, c.width - 4, 0, [' MM', 'M  ', ' MM'])
    for (let x = 0; x < c.width - 5; x++) {
      const v = hash(x)
      if (v % 7 !== 0) continue
      const isLit = (Math.floor(t / 4) + v) % 5 !== 0
      if (isLit) dot(c, x, v % H, v % 3 === 0 ? 'Y' : 'W')
    }
  },

  party: (c, t) => {
    for (let x = 0; x < c.width; x++) {
      const v = hash(x)
      if (v % 4 !== 0) continue
      const y = (Math.floor(t / (1 + (v % 2))) + v) % H
      dot(c, x, y, CONFETTI[v % CONFETTI.length] ?? 'Y')
    }
  },
}

export const columnsFor = (available: number): number =>
  Math.max(1, Math.min(MAX_COLUMNS, Math.round(available * SCALE)))

export const frame = (scene: Scene, t: number, width: number, mood: Mood = 'none'): Canvas => {
  const c: Canvas = { width, px: new Int32Array(width * H).fill(NONE) }
  backdrop[mood](c, t)
  draw[scene](c, t, Math.floor((width - SCENE_W) / 2))
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
      const bottom = r * 2 + 1 < H ? (c.px[(r * 2 + 1) * w + x] ?? NONE) : NONE
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

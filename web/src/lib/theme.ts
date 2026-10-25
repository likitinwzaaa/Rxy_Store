export type Theme = {
  primary: string
  secondary?: string | null
}

const DEFAULT_PRIMARY = '#FF7A1A'

export const isHex = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)

function toHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return [h * 60, s, l]
}

function toHex(h: number, s: number, l: number) {
  h = ((h % 360) + 360) % 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return ('#' + to(r) + to(g) + to(b)).toUpperCase()
}

export function turn(hex: string, deg: number) {
  const [h, s, l] = toHsl(hex)
  return toHex(h + deg, Math.max(s, 0.55), Math.min(Math.max(l, 0.55), 0.68))
}

export function applyTheme(theme?: Partial<Theme>) {
  const primary = isHex(theme?.primary) ? theme.primary : DEFAULT_PRIMARY
  const secondary = isHex(theme?.secondary) ? theme.secondary : turn(primary, 180)

  const root = document.documentElement.style
  root.setProperty('--accent', primary)
  root.setProperty('--accent-2', secondary)
}

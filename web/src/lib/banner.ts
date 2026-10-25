import type { Banner } from '../types'

export type BannerState = 'live' | 'scheduled' | 'ended' | 'off'

export function bannerState(b: Banner, now = Date.now()): BannerState {
  if (b.enabled === false) return 'off'
  if (b.endsAt && b.endsAt <= now) return 'ended'
  if (b.startsAt && b.startsAt > now) return 'scheduled'
  return 'live'
}

export function bannerLook(s: BannerState) {
  if (s === 'live') return { label: 'กำลังโชว์', tone: 'ok' }
  if (s === 'scheduled') return { label: 'ตั้งเวลาไว้', tone: 'accent-2' }
  if (s === 'ended') return { label: 'หมดเวลาแล้ว', tone: 'off' }
  return { label: 'ปิดอยู่', tone: 'off' }
}

export function toLocalInput(ms?: number | null) {
  if (!ms) return ''
  const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60000)
  return d.toISOString().slice(0, 16)
}

export function fromLocalInput(v: string) {
  if (!v) return null
  const ms = new Date(v).getTime()
  return Number.isNaN(ms) ? null : ms
}

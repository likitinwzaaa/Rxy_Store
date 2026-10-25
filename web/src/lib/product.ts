import type { Product } from '../types'
import { dateShort } from './format'

export function blockReason(p: Product, now = Date.now()) {
  if (p.startsAt && p.startsAt > now) return 'เปิดขาย ' + dateShort(p.startsAt)
  if (p.stock === 0) return 'หมดแล้ว'
  if (p.limit && (p.bought ?? 0) >= p.limit) return 'ซื้อครบแล้ว'
  return null
}

export function maxQty(p: Product) {
  let max = 99
  if (p.stock != null) max = Math.min(max, p.stock)
  if (p.limit) max = Math.min(max, p.limit - (p.bought ?? 0))
  return Math.max(max, 0)
}

export function discount(p: Product) {
  if (!p.oldPrice || p.oldPrice <= p.price) return 0
  return Math.round((1 - p.price / p.oldPrice) * 100)
}

let imageHosts: string[] = []

export function setImageHosts(list: unknown) {
  imageHosts = Array.isArray(list) ? list.filter((h): h is string => typeof h === 'string').map((h) => h.toLowerCase()) : []
}

export function imageAllowed(url: string) {
  if (!/^https:\/\/[^\s"'()<>]+$/i.test(url)) return false
  if (imageHosts.length === 0) return true
  try {
    return imageHosts.includes(new URL(url).hostname.toLowerCase())
  } catch {
    return false
  }
}

export function safeImage(url?: string | null) {
  if (!url) return null
  return imageAllowed(url) ? url : null
}

import type { Product } from '../types'
import { dateShort } from './format'

// เหตุผลที่ซื้อสินค้านี้ไม่ได้ ถ้าซื้อได้คืน null
export function blockReason(p: Product, now = Date.now()) {
  if (p.startsAt && p.startsAt > now) return 'เปิดขาย ' + dateShort(p.startsAt)
  if (p.stock === 0) return 'หมดแล้ว'
  if (p.limit && (p.bought ?? 0) >= p.limit) return 'ซื้อครบแล้ว'
  return null
}

// จำนวนสูงสุดที่ใส่ตะกร้าได้
export function maxQty(p: Product) {
  let max = 99
  if (p.stock != null) max = Math.min(max, p.stock)
  if (p.limit) max = Math.min(max, p.limit - (p.bought ?? 0))
  return Math.max(max, 0)
}

// ส่วนลดเป็นเปอร์เซ็นต์ ไม่ลดคืน 0
export function discount(p: Product) {
  if (!p.oldPrice || p.oldPrice <= p.price) return 0
  return Math.round((1 - p.price / p.oldPrice) * 100)
}

// ใช้ลิงก์รูปได้แค่ https
export function safeImage(url?: string | null) {
  if (!url) return null
  return /^https:\/\/[^\s"'()<>]+$/i.test(url) ? url : null
}

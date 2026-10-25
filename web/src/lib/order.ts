import type { Order, OrderStatus } from '../types'

export function statusLook(s: OrderStatus) {
  if (s === 'pending') return { label: 'รอชำระ', tone: 'accent' }
  if (s === 'paid') return { label: 'ส่งของแล้ว', tone: 'ok' }
  if (s === 'refunded') return { label: 'คืนเงินแล้ว', tone: 'accent-2' }
  return { label: 'หมดเวลา', tone: 'off' }
}

export function orderItems(o: Order) {
  const text = o.lines.map((l) => (l.qty > 1 ? `${l.name} ×${l.qty}` : l.name)).join(', ')
  return o.recipient ? `${text} · ให้ ${o.recipient}` : text
}

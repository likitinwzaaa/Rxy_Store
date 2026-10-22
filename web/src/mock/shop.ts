import type { Banner, CartLine, Category, Delivery, Discount, InboxItem, Order, Owned, Product } from '../types'
import { cartTotals } from '../lib/cart'

const day = 24 * 60 * 60 * 1000
const now = Date.now()

export const categories: Category[] = [
  { id: 'item', name: 'ไอเทม', icon: 'box' },
  { id: 'vehicle', name: 'รถ', icon: 'car' },
  { id: 'vip', name: 'VIP', icon: 'crown' },
  { id: 'points', name: 'พอยท์', icon: 'coin' },
]

export const banners: Banner[] = [
  { id: 'b1', label: 'โปรเปิดเซิร์ฟ รถลด 30%', productId: 'sultan_rs' },
  { id: 'b2', label: 'VIP Gold ได้พอยท์เพิ่ม 2 เท่า', productId: 'vip_gold' },
  { id: 'b3', label: 'ชุดฮาโลวีน มาแล้ว 31 ต.ค.' },
]

export const products: Product[] = [
  {
    id: 'noroi_skin',
    name: 'บัตรสกิน Noroi ทุกชิ้น',
    category: 'item',
    price: 299,
    featured: true,
    rewards: [{ kind: 'item', label: 'บัตรสกิน Noroi', amount: 9 }],
  },
  {
    id: 'sultan_rs',
    name: 'Sultan RS Classic',
    category: 'vehicle',
    price: 455,
    oldPrice: 650,
    featured: true,
    description: 'รถสายแข่งท่อแต่งมาให้แล้ว ซื้อแล้วได้ชุดซ่อมกับเงินติดตัวไปด้วย',
    limit: 1,
    bought: 0,
    saleEndsAt: now + 2 * 60 * 60 * 1000,
    rewards: [
      { kind: 'vehicle', label: 'Sultan RS Classic', amount: 1 },
      { kind: 'item', label: 'ชุดซ่อมรถ', amount: 2 },
      { kind: 'money', label: 'เงินในเกม', amount: 5000 },
    ],
  },
  {
    id: 'vip_gold',
    name: 'VIP Gold 30 วัน',
    category: 'vip',
    price: 199,
    featured: true,
    rewards: [{ kind: 'rank', label: 'VIP Gold', amount: 1, days: 30 }],
  },
  {
    id: 'points_1000',
    name: '1,000 พอยท์',
    category: 'points',
    price: 100,
    featured: true,
    rewards: [{ kind: 'points', label: 'พอยท์', amount: 1000 }],
  },
  {
    id: 'starter_pack',
    name: 'ชุดเริ่มต้น ข้าวกล่อง น้ำ ผ้าพันแผล',
    category: 'item',
    price: 59,
    featured: true,
    stock: 12,
    limit: 3,
    bought: 0,
    rewards: [
      { kind: 'item', label: 'ข้าวกล่อง', amount: 5 },
      { kind: 'item', label: 'น้ำเปล่า', amount: 5 },
      { kind: 'item', label: 'ผ้าพันแผล', amount: 3 },
    ],
  },
  {
    id: 'birthday_box',
    name: 'กล่องของขวัญวันเกิดเซิร์ฟ',
    category: 'item',
    price: 89,
    featured: true,
    stock: 0,
    rewards: [{ kind: 'item', label: 'กล่องของขวัญ', amount: 1 }],
  },
  {
    id: 'halloween_set',
    name: 'ชุดฮาโลวีน',
    category: 'item',
    price: 129,
    featured: true,
    startsAt: now + 9 * day,
    rewards: [{ kind: 'item', label: 'ชุดฮาโลวีน', amount: 1, days: 14 }],
  },
  {
    id: 'custom_plate',
    name: 'ป้ายทะเบียนสั่งทำ',
    category: 'item',
    price: 149,
    featured: true,
    limit: 1,
    bought: 1,
    rewards: [{ kind: 'item', label: 'ป้ายทะเบียน', amount: 1 }],
  },
  {
    id: 'macan_gts',
    name: 'Porsche Macan GTS',
    category: 'vehicle',
    price: 890,
    rewards: [{ kind: 'vehicle', label: 'Porsche Macan GTS', amount: 1 }],
  },
  {
    id: 'elegy_rent',
    name: 'Elegy Retro Custom เช่า 7 วัน',
    category: 'vehicle',
    price: 150,
    rewards: [{ kind: 'vehicle', label: 'Elegy Retro Custom', amount: 1, days: 7 }],
  },
  {
    id: 'tractor',
    name: 'Tractor Mach II',
    category: 'vehicle',
    price: 120,
    rewards: [{ kind: 'vehicle', label: 'Tractor Mach II', amount: 1 }],
  },
  {
    id: 'machete_skin',
    name: 'บัตรสกิน Machete Noroi',
    category: 'item',
    price: 59,
    rewards: [{ kind: 'item', label: 'บัตรสกิน Machete', amount: 1 }],
  },
  {
    id: 'macaron',
    name: 'MACARON กล่อง 10 ชิ้น',
    category: 'item',
    price: 25,
    rewards: [{ kind: 'item', label: 'มาการอง', amount: 10 }],
  },
  {
    id: 'vip_silver',
    name: 'VIP Silver 7 วัน',
    category: 'vip',
    price: 59,
    rewards: [{ kind: 'rank', label: 'VIP Silver', amount: 1, days: 7 }],
  },
  {
    id: 'points_5000',
    name: '5,000 พอยท์',
    category: 'points',
    price: 450,
    oldPrice: 500,
    rewards: [{ kind: 'points', label: 'พอยท์', amount: 5000 }],
  },
]


export const characterName = 'Somchai Jaidee'

const codes: Record<string, Discount & { startsAt?: number }> = {
  RXY10: { code: 'RXY10', kind: 'percent', value: 10 },
  NEWBIE: { code: 'NEWBIE', kind: 'fixed', value: 20 },
  HALLOWEEN: { code: 'HALLOWEEN', kind: 'percent', value: 25, startsAt: now + 9 * day },
}

// ตรวจโค้ดส่วนลด
export function checkCode(input: string): { ok: true; discount: Discount } | { ok: false; error: string } {
  const c = codes[input.trim().toUpperCase()]
  if (!c) return { ok: false, error: 'ไม่มีโค้ดนี้' }
  if (c.startsAt && c.startsAt > Date.now()) return { ok: false, error: 'โค้ดนี้ยังใช้ไม่ได้' }
  return { ok: true, discount: { code: c.code, kind: c.kind, value: c.value } }
}

const online: Record<string, string> = { '5': 'Mint T.', '23': 'Ploy Wong', '112': 'Apiploy S.' }

// หาชื่อผู้เล่นที่ออนไลน์จาก ID
export function findPlayer(id: string) {
  return online[id.trim()] ?? null
}

const where: Record<string, string> = {
  item: 'เข้ากระเป๋าแล้ว',
  vehicle: 'เข้าการาจหลักแล้ว',
  rank: 'ได้ยศแล้ว',
  points: 'เข้าบัญชีพอยท์แล้ว',
  money: 'เข้าบัญชีธนาคารแล้ว',
  command: 'ส่งแล้ว',
}

let seq = 90

// เลขคำสั่งซื้อ เช่น RXY-261022-0091
function nextId() {
  const d = new Date()
  const ymd = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0')
  seq += 1
  return `RXY-${ymd}-${String(seq).padStart(4, '0')}`
}

// สร้างคำสั่งซื้อจำลอง
export function createOrder(cart: CartLine[], list: Product[], discount: Discount | null, recipient: string | null): Order {
  const { subtotal, off, total } = cartTotals(cart, list, discount)

  return {
    id: nextId(),
    lines: cart.map((l) => {
      const p = list.find((x) => x.id === l.id)!
      return { id: p.id, name: p.name, price: p.price, qty: l.qty }
    }),
    subtotal,
    off,
    total,
    code: discount?.code ?? null,
    recipient,
    createdAt: Date.now(),
    expiresAt: Date.now() + 10 * 60 * 1000,
    status: 'pending',
  }
}

// จำลองการส่งของหลังจ่ายเงิน ไอเทมที่ซื้อหลายชิ้นจะเข้ากล่องรับของ 1 ชิ้น เหมือนกระเป๋าเต็ม
export function deliver(order: Order, list: Product[]): Delivery[] {
  return order.lines.map((l) => {
    const p = list.find((x) => x.id === l.id)
    const kind = p?.rewards[0]?.kind ?? 'item'
    const name = l.qty > 1 ? `${l.name} ×${l.qty}` : l.name

    if (order.recipient) return { name, where: `ส่งเข้ากล่องรับของของ ${order.recipient} แล้ว`, inbox: 0 }

    const days = p?.rewards.find((r) => r.days)?.days
    if (days) {
      const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      return { name, where: 'หมดอายุ ' + until.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }), inbox: 0 }
    }

    if (kind === 'item' && l.qty > 1) {
      return { name, where: `เข้ากระเป๋า ${l.qty - 1} ชุด · รอรับ 1 ชุด`, inbox: 1 }
    }
    return { name, where: where[kind], inbox: 0 }
  })
}

// สร้าง QR ใหม่จากคำสั่งซื้อเดิมที่หมดเวลา
export function renewOrder(old: Order): Order {
  return { ...old, id: nextId(), createdAt: Date.now(), expiresAt: Date.now() + 10 * 60 * 1000, status: 'pending' }
}

const hour = 60 * 60 * 1000

// ประวัติการซื้อจำลอง
export const pastOrders: Order[] = [
  {
    id: 'RXY-261020-0077',
    lines: [{ id: 'vip_silver', name: 'VIP Silver 7 วัน', price: 59, qty: 1 }],
    subtotal: 59,
    off: 0,
    total: 59,
    recipient: 'Ploy Wong',
    createdAt: now - 2 * day,
    expiresAt: now - 2 * day + 10 * 60 * 1000,
    paidAt: now - 2 * day + 60 * 1000,
    status: 'paid',
    ref: 'chrg_5x9k2f1a',
    delivery: [{ name: 'VIP Silver 7 วัน', where: 'ส่งเข้ากล่องรับของของ Ploy Wong แล้ว', inbox: 0 }],
  },
  {
    id: 'RXY-261019-0064',
    lines: [{ id: 'noroi_skin', name: 'บัตรสกิน Noroi ทุกชิ้น', price: 299, qty: 1 }],
    subtotal: 299,
    off: 0,
    total: 299,
    createdAt: now - 3 * day,
    expiresAt: now - 3 * day + 10 * 60 * 1000,
    paidAt: now - 3 * day + 2 * 60 * 1000,
    status: 'paid',
    ref: 'chrg_8b2m1k0q',
    delivery: [{ name: 'บัตรสกิน Noroi ทุกชิ้น', where: 'เข้ากระเป๋าแล้ว', inbox: 0 }],
  },
  {
    id: 'RXY-261015-0040',
    lines: [{ id: 'points_1000', name: '1,000 พอยท์', price: 100, qty: 1 }],
    subtotal: 100,
    off: 0,
    total: 100,
    createdAt: now - 7 * day,
    expiresAt: now - 7 * day + 10 * 60 * 1000,
    paidAt: now - 7 * day + 3 * 60 * 1000,
    status: 'paid',
    ref: 'chrg_1q9w8e7r',
    delivery: [{ name: '1,000 พอยท์', where: 'เข้าบัญชีพอยท์แล้ว', inbox: 0 }],
  },
  {
    id: 'RXY-261015-0039',
    lines: [{ id: 'points_1000', name: '1,000 พอยท์', price: 100, qty: 1 }],
    subtotal: 100,
    off: 0,
    total: 100,
    createdAt: now - 7 * day - 6 * 60 * 1000,
    expiresAt: now - 7 * day + 4 * 60 * 1000,
    status: 'expired',
  },
  {
    id: 'RXY-261008-0012',
    lines: [{ id: 'elegy_rent', name: 'Elegy Retro Custom เช่า 7 วัน', price: 150, qty: 1 }],
    subtotal: 150,
    off: 0,
    total: 150,
    createdAt: now - 14 * day,
    expiresAt: now - 14 * day + 10 * 60 * 1000,
    paidAt: now - 14 * day + 60 * 1000,
    status: 'refunded',
    ref: 'chrg_0p9o8i7u',
  },
]

// ของที่มีวันหมดจำลอง
export const owned: Owned[] = [
  { id: 'o1', productId: 'elegy_rent', name: 'Elegy Retro Custom', label: 'รถเช่า 7 วัน', startsAt: now - 140 * hour, endsAt: now + 28 * hour },
  { id: 'o2', productId: 'vip_gold', name: 'VIP Gold', label: 'VIP 30 วัน', startsAt: now - 168 * hour, endsAt: now + 552 * hour },
  { id: 'o3', productId: 'halloween_set', name: 'ชุดปีกเทวดา', label: 'ไอเทม 14 วัน', startsAt: now - 216 * hour, endsAt: now + 120 * hour },
  { id: 'o4', productId: 'vip_silver', name: 'VIP Silver', label: 'VIP 7 วัน', startsAt: now - 30 * day, endsAt: now - 23 * day, pulledAt: now - 23 * day },
]

// กล่องรับของจำลอง
export const inbox: InboxItem[] = [
  { id: 'i1', name: 'VIP Gold 30 วัน', orderId: 'RXY-261022-0088', from: 'Mint T.', reason: 'กดรับได้เลย เริ่มนับวันตอนกดรับ' },
  { id: 'i2', name: 'ชุดเริ่มต้น ×1', orderId: 'RXY-261021-0083', reason: 'กระเป๋าเต็ม ต้องว่างอย่างน้อย 3 ช่อง', blocked: true },
  { id: 'i3', name: 'Elegy Retro Custom', orderId: 'RXY-261018-0072', reason: 'การาจเต็ม ต้องมีช่องว่าง 1 ช่อง', blocked: true },
  { id: 'i4', name: '1,000 พอยท์', orderId: 'RXY-261015-0040', reason: 'กดรับได้เลย' },
  { id: 'i5', name: 'บัตรสกิน Noroi ทุกชิ้น', orderId: 'RXY-261019-0064', reason: 'เข้ากระเป๋าแล้ว', claimedAt: now - day },
]

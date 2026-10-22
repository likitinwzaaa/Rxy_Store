export type RewardKind = 'item' | 'vehicle' | 'rank' | 'points' | 'money' | 'command'

export type Reward = {
  kind: RewardKind
  label: string
  value?: string
  amount: number
  days?: number | null
}

export type Product = {
  id: string
  name: string
  category: string
  price: number
  oldPrice?: number | null
  image?: string | null
  description?: string
  rewards: Reward[]
  featured?: boolean
  stock?: number | null
  limit?: number | null
  bought?: number
  startsAt?: number | null
  saleEndsAt?: number | null
  enabled?: boolean
  hideWhenBlocked?: boolean
}

export type Category = {
  id: string
  name: string
  icon: string
  enabled?: boolean
  groups?: string[] | null
  hideEmpty?: boolean
}

export type BannerLink = { kind: 'none' } | { kind: 'product'; id: string } | { kind: 'category'; id: string }

export type Banner = {
  id: string
  image?: string | null
  label: string
  link: BannerLink
  startsAt?: number | null
  endsAt?: number | null
  enabled?: boolean
}

export type CartLine = {
  id: string
  qty: number
}

export type Discount = {
  code: string
  kind: 'percent' | 'fixed'
  value: number
}

export type OrderLine = {
  id: string
  name: string
  price: number
  qty: number
}

export type Delivery = {
  name: string
  where: string
  inbox: number
}

export type OrderStatus = 'pending' | 'paid' | 'expired' | 'refunded'

export type Order = {
  id: string
  lines: OrderLine[]
  subtotal: number
  off: number
  total: number
  code?: string | null
  recipient?: string | null
  qr?: string | null
  createdAt: number
  expiresAt: number
  status: OrderStatus
  ref?: string
  paidAt?: number
  delivery?: Delivery[]
}

export type Owned = {
  id: string
  productId: string
  name: string
  label: string
  startsAt: number
  endsAt: number
  pulledAt?: number | null
}

export type InboxItem = {
  id: string
  name: string
  orderId: string
  from?: string | null
  reason: string
  blocked?: boolean
  claimedAt?: number | null
}

export type Notice = {
  key: number
  title: string
  lines: string[]
  footer?: string
}

export type Page = 'home' | 'cart' | 'payment' | 'history' | 'owned' | 'inbox'

export type LogEntry = {
  at: number
  text: string
  by: string
  tone?: 'ok' | 'warn'
}

export type AdminOrder = Order & {
  buyer: { name: string; id: number | null; license: string; online: boolean }
  log: LogEntry[]
  note?: string
}

export type AdminPage = 'products' | 'categories' | 'orders' | 'banners' | 'settings'

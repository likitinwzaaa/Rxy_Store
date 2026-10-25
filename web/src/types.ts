export type RewardKind = 'item' | 'money' | 'vehicle' | 'role'

export type PlateMode = 'random' | 'fixed' | 'prefix'

export type Reward = {
  kind: RewardKind
  label: string
  value?: string
  amount: number
  days?: number | null
  plateMode?: PlateMode
  plate?: string | null
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
  limitPeriod?: LimitPeriod
  rev?: number
}

export type LimitPeriod = 'ever' | 'day' | 'week' | 'month'

export type Category = {
  id: string
  name: string
  icon: string
  enabled?: boolean
  groups?: string[] | null
  hideEmpty?: boolean
  rev?: number
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
  rev?: number
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

export type DiscountCode = Discount & {
  limit: number | null
  perPlayer: boolean
  used: number
  startsAt?: number | null
  endsAt?: number | null
  enabled?: boolean
  allowOnSale?: boolean
  minTotal?: number | null
  maxOff?: number | null
  onlyCategories?: string[]
  onlyProducts?: string[]
  rev?: number
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

export type GatewayId = 'opn' | 'beam'

export type LogKind = 'paid' | 'fail' | 'admin' | 'daily' | 'refund' | 'big' | 'expire' | 'stock' | 'code' | 'expired'

export type ShopSettings = {
  name: string
  openKey: string
  theme: { primary: string; secondary: string | null }
  gateway: GatewayId
  qrMinutes: number
  minAmount: number
  logs: Record<LogKind, boolean>
  dailyAt: string
  bigOver: number
  debug: boolean
}

export type ServerStatus = {
  keys: Record<GatewayId, string | null>
  webhook: string | null
}

export type UpdateInfo = {
  current: string
  latest: string
  security: boolean
  notes: string[]
}

export type ServerProduct = {
  id: string
  name: string
  category: string
  description?: string | null
  image?: string | null
  price: number
  salePrice?: number | null
  saleEndsAt?: number | null
  stock?: number | null
  limit?: number | null
  limitPeriod?: LimitPeriod
  rewards: Reward[]
  featured?: boolean
  startsAt?: number | null
  hideWhenBlocked?: boolean
  enabled?: boolean
  rev?: number
}

export type ServerCatalog = {
  categories: Category[]
  products: ServerProduct[]
  banners: Banner[]
}

export type PublicSettings = {
  name: string
  theme: { primary: string; secondary?: string | null } | null
  openKey: string
  bannerSeconds: number
  imageHosts: string[]
}

export type ShopOpen = {
  version: number
  vis: string
  catalog?: ServerCatalog
  stock: Record<string, number>
  bought: Record<string, number>
  settings: PublicSettings
  player: { name: string; mismatch: boolean }
}

export type QuoteIssue = { id: string; reason: string; max: number }

export type Quote = {
  lines: { id: string; qty: number; price: number }[]
  issues: QuoteIssue[]
  subtotal: number
  codeOff: number
  tierOff: number
  total: number
  code?: string | null
  codeError?: string | null
  tier?: string | null
}

export type AdminStatus = {
  bot: boolean
  guild: boolean
  debug: boolean
  webhooks: Record<'finance' | 'delivery' | 'admin' | 'daily' | 'error' | 'logbackup', boolean>
}

export type AdminLoad = {
  savedId?: string
  errors?: Record<string, string>
  roles: { id: string; name: string }[]
  status: AdminStatus
  dev: boolean
  categories: Category[]
  products: ServerProduct[]
  banners: Banner[]
  codes: DiscountCode[]
  groups: { id: string; name: string }[]
  settings: {
    name: string
    theme: { primary: string; secondary?: string | null } | null
    openKey: string
    bannerSeconds: number
    locked: { name: boolean; theme: boolean; openKey: boolean }
  }
  imageHosts: string[]
}

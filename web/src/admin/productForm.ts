import type { Product, Reward, RewardKind } from '../types'

export const rewardKinds: { kind: RewardKind; name: string; hint: string }[] = [
  { kind: 'item', name: 'ไอเทม', hint: 'ชื่อไอเทม' },
  { kind: 'vehicle', name: 'รถ', hint: 'โมเดลรถ' },
  { kind: 'rank', name: 'VIP/ยศ', hint: 'ชื่อยศ' },
  { kind: 'points', name: 'พอยท์', hint: 'ชื่อพอยท์' },
  { kind: 'money', name: 'เงินในเกม', hint: 'bank หรือ cash' },
  { kind: 'command', name: 'คำสั่งเซิร์ฟ', hint: 'คำสั่ง' },
]

export const canExpire = (k: RewardKind) => k === 'item' || k === 'vehicle' || k === 'rank'

export type RewardRow = {
  kind: RewardKind
  value: string
  amount: string
  days: string
}

export type ProductForm = {
  id: string
  name: string
  description: string
  image: string
  category: string
  price: string
  salePrice: string
  saleEnds: string
  stock: string
  limit: string
  featured: boolean
  hideWhenBlocked: boolean
  rewards: RewardRow[]
}

export type FormErrors = Partial<Record<'name' | 'price' | 'salePrice' | 'image' | 'stock' | 'limit' | 'rewards', string>>

function toLocalInput(ms?: number | null) {
  if (!ms) return ''
  const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60000)
  return d.toISOString().slice(0, 16)
}

export function toForm(p: Product): ProductForm {
  const onSale = !!p.oldPrice && p.oldPrice > p.price
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? '',
    image: p.image ?? '',
    category: p.category,
    price: String(onSale ? p.oldPrice : p.price),
    salePrice: onSale ? String(p.price) : '',
    saleEnds: toLocalInput(p.saleEndsAt),
    stock: p.stock == null ? '' : String(p.stock),
    limit: p.limit ? String(p.limit) : '',
    featured: !!p.featured,
    hideWhenBlocked: !!p.hideWhenBlocked,
    rewards: p.rewards.map((r) => ({
      kind: r.kind,
      value: r.value ?? r.label,
      amount: String(r.amount),
      days: r.days ? String(r.days) : '',
    })),
  }
}

export function emptyForm(category: string): ProductForm {
  return {
    id: '',
    name: '',
    description: '',
    image: '',
    category,
    price: '',
    salePrice: '',
    saleEnds: '',
    stock: '',
    limit: '',
    featured: false,
    hideWhenBlocked: false,
    rewards: [{ kind: 'item', value: '', amount: '1', days: '' }],
  }
}

const isInt = (v: string) => /^\d+$/.test(v.trim())

export function validate(f: ProductForm): FormErrors {
  const e: FormErrors = {}
  if (!f.name.trim()) e.name = 'ต้องใส่ชื่อสินค้า'
  if (!f.price.trim()) e.price = 'ต้องใส่ราคา'
  else if (!isInt(f.price) || Number(f.price) < 1) e.price = 'ราคาต้องเป็นจำนวนเต็มบาท'
  if (f.salePrice.trim()) {
    if (!isInt(f.salePrice)) e.salePrice = 'ราคาลดต้องเป็นจำนวนเต็ม'
    else if (Number(f.salePrice) >= Number(f.price)) e.salePrice = 'ราคาลดต้องน้อยกว่าราคาปกติ'
  }
  if (f.image.trim() && !/^https:\/\/[^\s"'()<>]+$/i.test(f.image.trim())) e.image = 'ลิงก์รูปต้องขึ้นต้นด้วย https://'
  if (f.stock.trim() && !isInt(f.stock)) e.stock = 'ใส่เป็นตัวเลข'
  if (f.limit.trim() && !isInt(f.limit)) e.limit = 'ใส่เป็นตัวเลข'
  const badRow = f.rewards.some(
    (r) => !r.value.trim() || !isInt(r.amount) || Number(r.amount) < 1 || (r.days.trim() && !isInt(r.days)),
  )
  if (f.rewards.length === 0) e.rewards = 'ต้องมีของอย่างน้อย 1 อย่าง'
  else if (badRow) e.rewards = 'ใส่ชื่อและจำนวนให้ครบทุกบรรทัด'
  return e
}

export function slug(name: string, taken: string[]) {
  let base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  if (!base) base = 'item'
  let id = base
  let n = 2
  while (taken.includes(id)) id = `${base}_${n++}`
  return id
}

export function fromForm(f: ProductForm, old: Product | null, taken: string[]): Product {
  const price = Number(f.price)
  const sale = f.salePrice.trim() ? Number(f.salePrice) : null
  const rewards: Reward[] = f.rewards.map((r) => ({
    kind: r.kind,
    value: r.value.trim(),
    label: old?.rewards.find((x) => (x.value ?? x.label) === r.value.trim())?.label ?? r.value.trim(),
    amount: Number(r.amount),
    days: canExpire(r.kind) && r.days.trim() ? Number(r.days) : null,
  }))

  return {
    ...(old ?? {}),
    id: old?.id ?? slug(f.name, taken),
    name: f.name.trim(),
    description: f.description.trim() || undefined,
    image: f.image.trim() || null,
    category: f.category,
    price: sale ?? price,
    oldPrice: sale ? price : null,
    saleEndsAt: sale && f.saleEnds ? new Date(f.saleEnds).getTime() : null,
    stock: f.stock.trim() ? Number(f.stock) : null,
    limit: f.limit.trim() ? Number(f.limit) : null,
    featured: f.featured,
    hideWhenBlocked: f.hideWhenBlocked,
    rewards,
    enabled: old?.enabled ?? true,
  }
}

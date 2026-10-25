import type { LimitPeriod, PlateMode, Product, RewardKind } from '../types'
import { fromLocalInput, toLocalInput } from '../lib/banner'
import { imageAllowed } from '../lib/product'

export const rewardKinds: { kind: RewardKind; name: string; hint: string }[] = [
  { kind: 'item', name: 'ไอเทม', hint: 'ชื่อไอเทม เช่น bread' },
  { kind: 'money', name: 'เงิน', hint: '' },
  { kind: 'vehicle', name: 'รถ', hint: 'โมเดลรถ เช่น sultan' },
  { kind: 'role', name: 'Discord role', hint: '' },
]

export const accounts = [
  { id: 'money', name: 'เงินสด' },
  { id: 'bank', name: 'เงินในธนาคาร' },
  { id: 'black_money', name: 'เงินแดง' },
]

export const periods: { id: LimitPeriod; name: string }[] = [
  { id: 'ever', name: 'ตลอด' },
  { id: 'day', name: 'ต่อวัน' },
  { id: 'week', name: 'ต่อสัปดาห์' },
  { id: 'month', name: 'ต่อเดือน' },
]

export const plateModes: { id: PlateMode; name: string }[] = [
  { id: 'random', name: 'สุ่มป้าย' },
  { id: 'fixed', name: 'ป้ายตายตัว' },
  { id: 'prefix', name: 'ตัวหน้า + สุ่มเลข' },
]

export const canExpire = (k: RewardKind) => k !== 'money'

export type RewardRow = {
  kind: RewardKind
  value: string
  amount: string
  days: string
  plateMode: PlateMode
  plate: string
}

export type ProductForm = {
  name: string
  description: string
  image: string
  category: string
  price: string
  salePrice: string
  saleEnds: string
  startsAt: string
  stock: string
  stockSeen: string
  limit: string
  limitPeriod: LimitPeriod
  featured: boolean
  hideWhenBlocked: boolean
  rewards: RewardRow[]
}

export type FormErrors = Partial<
  Record<'name' | 'description' | 'price' | 'salePrice' | 'image' | 'category' | 'stock' | 'limit' | 'startsAt' | 'rewards', string>
>

export const emptyRow = (): RewardRow => ({ kind: 'item', value: '', amount: '1', days: '', plateMode: 'random', plate: '' })

export function toForm(p: Product): ProductForm {
  const onSale = p.oldPrice != null && p.oldPrice > p.price
  return {
    name: p.name,
    description: p.description ?? '',
    image: p.image ?? '',
    category: p.category,
    price: String(onSale ? p.oldPrice : p.price),
    salePrice: onSale ? String(p.price) : '',
    saleEnds: toLocalInput(p.saleEndsAt),
    startsAt: toLocalInput(p.startsAt),
    stock: p.stock == null ? '' : String(p.stock),
    stockSeen: p.stock == null ? '' : String(p.stock),
    limit: p.limit ? String(p.limit) : '',
    limitPeriod: p.limitPeriod ?? 'ever',
    featured: !!p.featured,
    hideWhenBlocked: !!p.hideWhenBlocked,
    rewards: p.rewards.map((r) => ({
      kind: r.kind,
      value: r.value ?? '',
      amount: String(r.amount),
      days: r.days ? String(r.days) : '',
      plateMode: r.plateMode ?? 'random',
      plate: r.plate ?? '',
    })),
  }
}

export function emptyForm(category: string): ProductForm {
  return {
    name: '',
    description: '',
    image: '',
    category,
    price: '',
    salePrice: '',
    saleEnds: '',
    startsAt: '',
    stock: '',
    stockSeen: '',
    limit: '',
    limitPeriod: 'ever',
    featured: false,
    hideWhenBlocked: false,
    rewards: [emptyRow()],
  }
}

const isInt = (v: string) => /^\d+$/.test(v.trim())
const isMoney = (v: string) => /^\d+(\.\d{1,2})?$/.test(v.trim())

export function plateError(row: RewardRow) {
  const plate = row.plate.trim().toUpperCase().replace(/\s+/g, ' ')
  if (row.plateMode === 'fixed') {
    if (plate.length < 3 || plate.length > 8) return 'ป้ายต้องยาว 3 ถึง 8 ตัว'
    if (/[^A-Z0-9 ]/.test(plate)) return 'ป้ายใช้ได้แค่ A-Z, 0-9 และเว้นวรรค'
    if (!/\d/.test(plate)) return 'ป้ายต้องมีตัวเลขอย่างน้อย 1 ตัว'
  }
  if (row.plateMode === 'prefix') {
    if (plate.length < 1 || plate.length > 3) return 'ตัวหน้าป้ายต้องยาว 1 ถึง 3 ตัว'
    if (/[^A-Z0-9]/.test(plate)) return 'ตัวหน้าป้ายใช้ได้แค่ A-Z และ 0-9'
  }
  return null
}

function rowError(r: RewardRow) {
  if (r.days.trim() && (!isInt(r.days) || Number(r.days) < 1)) return 'อายุต้องเป็นจำนวนวัน'
  if (r.kind === 'item') {
    if (!/^[\w-]+$/.test(r.value.trim())) return 'ใส่ชื่อไอเทม a-z, 0-9, _ หรือ -'
    if (!isInt(r.amount) || Number(r.amount) < 1) return 'จำนวนไอเทมต้องเป็น 1 ขึ้นไป'
  }
  if (r.kind === 'money') {
    if (!accounts.some((a) => a.id === r.value)) return 'เลือกประเภทเงิน'
    if (!isInt(r.amount) || Number(r.amount) < 1) return 'จำนวนเงินต้องเป็น 1 ขึ้นไป'
  }
  if (r.kind === 'vehicle') {
    if (!/^\w+$/.test(r.value.trim())) return 'ใส่โมเดลรถ a-z, 0-9 หรือ _'
    if (!isInt(r.amount) || Number(r.amount) < 1 || Number(r.amount) > 20) return 'จำนวนรถ 1 ถึง 20 คัน'
    if (r.plateMode === 'fixed' && Number(r.amount) !== 1) return 'ป้ายตายตัวใช้ได้กับรถคันเดียว'
    return plateError(r)
  }
  if (r.kind === 'role' && !r.value) return 'เลือก Discord role'
  return null
}

export function validate(f: ProductForm): FormErrors {
  const e: FormErrors = {}
  if (!f.name.trim()) e.name = 'ต้องใส่ชื่อสินค้า'
  if (!f.category) e.category = 'เลือกหมวด'
  if (!f.price.trim()) e.price = 'ต้องใส่ราคา'
  else if (!isMoney(f.price) || Number(f.price) < 1) e.price = 'ราคาต้องเป็น 1 ขึ้นไป ทศนิยมไม่เกิน 2 ตำแหน่ง'
  if (f.salePrice.trim()) {
    if (!isMoney(f.salePrice)) e.salePrice = 'ราคาลดทศนิยมไม่เกิน 2 ตำแหน่ง'
    else if (Number(f.salePrice) >= Number(f.price)) e.salePrice = 'ราคาลดต้องน้อยกว่าราคาปกติ'
  }
  if (f.image.trim() && !imageAllowed(f.image.trim())) e.image = 'ใช้รูปจากเว็บนี้ไม่ได้'
  if (f.stock.trim() && !isInt(f.stock)) e.stock = 'ใส่เป็นตัวเลข'
  if (f.limit.trim() && (!isInt(f.limit) || Number(f.limit) < 1)) e.limit = 'ใส่เป็นตัวเลข 1 ขึ้นไป'
  if (f.rewards.length === 0) e.rewards = 'ต้องมีของอย่างน้อย 1 อย่าง'
  else if (f.rewards.filter((r) => r.kind === 'vehicle' && r.plateMode === 'fixed').length > 1)
    e.rewards = 'ป้ายตายตัวใส่ได้แค่รถคันเดียวต่อสินค้า'
  else {
    const bad = f.rewards.map(rowError).find((x) => x)
    if (bad) e.rewards = bad
  }
  return e
}

export function hasFixedPlate(f: ProductForm) {
  return f.rewards.some((r) => r.kind === 'vehicle' && r.plateMode === 'fixed')
}

export function toPayload(f: ProductForm, old: Product | null) {
  const sale = f.salePrice.trim() ? Number(f.salePrice) : null
  return {
    id: old?.id,
    rev: old?.rev,
    name: f.name.trim(),
    description: f.description.trim(),
    image: f.image.trim(),
    category: f.category,
    price: Number(f.price),
    salePrice: sale,
    saleEndsAt: sale ? fromLocalInput(f.saleEnds) : null,
    startsAt: fromLocalInput(f.startsAt),
    stock: f.stock.trim() ? Number(f.stock) : null,
    stockSeen: f.stockSeen.trim() ? Number(f.stockSeen) : null,
    limit: f.limit.trim() ? Number(f.limit) : null,
    limitPeriod: f.limitPeriod,
    featured: f.featured,
    hideWhenBlocked: f.hideWhenBlocked,
    rewards: f.rewards.map((r) => ({
      kind: r.kind,
      value: r.kind === 'item' || r.kind === 'vehicle' ? r.value.trim() : r.value,
      amount: r.kind === 'role' ? 1 : Number(r.amount),
      days: canExpire(r.kind) && r.days.trim() ? Number(r.days) : null,
      plateMode: r.kind === 'vehicle' ? r.plateMode : undefined,
      plate: r.kind === 'vehicle' && r.plateMode !== 'random' ? r.plate.trim().toUpperCase() : undefined,
    })),
  }
}

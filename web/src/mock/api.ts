import type { AdminLoad, Quote, ServerProduct, ShopOpen } from '../types'
import type { Result } from '../lib/api'
import { toServerProduct } from '../lib/catalog'
import { banners, categories, characterName, checkCode, discountCodes, findPlayer, groups, products } from './shop'
import { shopSettings } from './admin'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
const rid = (p: string) => p + Math.random().toString(36).slice(2, 8)

function open(): ShopOpen {
  const shown = categories.filter((c) => c.enabled !== false && !c.groups?.length)
  return {
    version: 1,
    vis: shown.map((c) => c.id).join(','),
    catalog: {
      categories: shown,
      products: products.filter((p) => p.enabled !== false && shown.some((c) => c.id === p.category)).map(toServerProduct),
      banners: banners.filter((b) => b.enabled !== false),
    },
    stock: Object.fromEntries(products.filter((p) => p.stock != null).map((p) => [p.id, p.stock as number])),
    bought: Object.fromEntries(products.filter((p) => p.bought).map((p) => [p.id, p.bought as number])),
    settings: {
      name: shopSettings.name,
      theme: shopSettings.theme,
      openKey: shopSettings.openKey,
      bannerSeconds: 5,
      imageHosts: [],
    },
    player: { name: characterName, mismatch: false },
  }
}

function quote(payload: { lines?: { id: string; qty: number }[]; code?: string }): Quote {
  const lines = (payload.lines ?? [])
    .map((l) => ({ l, p: products.find((x) => x.id === l.id) }))
    .filter((x) => x.p)
    .map(({ l, p }) => ({ id: l.id, qty: l.qty, price: p!.price }))
  const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0)
  let codeOff = 0
  let codeError: string | null = null
  let code: string | null = null
  if (payload.code) {
    const res = checkCode(payload.code, discountCodes)
    if (res.ok) {
      code = res.discount.code
      codeOff = res.discount.kind === 'percent' ? Math.floor((subtotal * res.discount.value) / 100) : res.discount.value
      codeOff = Math.min(codeOff, subtotal)
    } else {
      codeError = res.error
    }
  }
  return { lines, issues: [], subtotal, codeOff, tierOff: 0, total: subtotal - codeOff, code, codeError, tier: null }
}

const admin: AdminLoad = {
  dev: true,
  categories: categories.map((c) => ({ ...c, rev: 1 })),
  products: products.map((p) => ({ ...toServerProduct(p), rev: 1 })),
  banners: banners.map((b) => ({ ...b, rev: 1 })),
  codes: discountCodes.map((c) => ({ ...c, rev: 1 })),
  groups,
  roles: [
    { id: 'vip_gold', name: 'VIP Gold' },
    { id: 'vip_silver', name: 'VIP Silver' },
  ],
  settings: {
    name: shopSettings.name,
    theme: shopSettings.theme,
    openKey: shopSettings.openKey,
    bannerSeconds: 5,
    locked: { name: false, theme: false, openKey: true },
  },
  imageHosts: [],
  status: {
    bot: true,
    guild: true,
    debug: false,
    webhooks: { finance: false, delivery: false, admin: true, daily: false, error: false, logbackup: false },
  },
}

type Row = { id?: string; rev?: number; enabled?: boolean }

function upsert<T extends Row>(list: T[], p: Record<string, unknown>, prefix: string): { list: T[]; id: string } {
  if (p.id) {
    return { list: list.map((x) => (x.id === p.id ? ({ ...x, ...p, rev: (x.rev ?? 1) + 1 } as T) : x)), id: String(p.id) }
  }
  const id = rid(prefix)
  return { list: [...list, { ...p, id, rev: 1, enabled: true } as unknown as T], id }
}

function sorted<T extends Row>(list: T[], ids: string[]) {
  return ids.map((id) => list.find((x) => x.id === id)).filter((x): x is T => !!x)
}

function adminOp(name: string, p: Record<string, any>): AdminLoad | string {
  const [, kind, op] = name.split(':')
  const key = ({ product: 'products', category: 'categories', banner: 'banners' } as const)[kind as 'product']
  if (key && op === 'save') {
    const res = upsert(admin[key] as Row[], p, kind[0])
    ;(admin as any)[key] = res.list
    return { ...admin, savedId: res.id }
  }
  if (key && op === 'delete') {
    if (kind === 'category' && admin.products.some((x: ServerProduct) => x.category === p.id)) return 'in_use'
    ;(admin as any)[key] = (admin[key] as Row[]).filter((x) => x.id !== p.id)
  }
  if (key && op === 'toggle') (admin as any)[key] = (admin[key] as Row[]).map((x) => (x.id === p.id ? { ...x, enabled: p.enabled } : x))
  if (key && op === 'sort') (admin as any)[key] = sorted(admin[key] as Row[], p.ids)
  if (name === 'admin:banner:seconds') admin.settings = { ...admin.settings, bannerSeconds: p.seconds }
  if (name === 'admin:settings:save') admin.settings = { ...admin.settings, name: p.name, theme: p.theme }
  if (name === 'admin:code:save') {
    const code = { ...p, used: 0, rev: 1 } as any
    admin.codes = p.old ? admin.codes.map((c) => (c.code === p.old ? { ...c, ...code, used: c.used } : c)) : [...admin.codes, code]
  }
  if (name === 'admin:code:delete') admin.codes = admin.codes.filter((c) => c.code !== p.code)
  return { ...admin }
}

export async function mockCall<T>(name: string, payload: object): Promise<Result<T>> {
  await wait(300)
  if (name === 'shop:open') return { ok: true, data: open() as T }
  if (name === 'cart:quote') return { ok: true, data: quote(payload) as T }
  if (name === 'admin:load') return { ok: true, data: { ...admin } as T }
  if (name.startsWith('admin:')) {
    const res = adminOp(name, payload as Record<string, unknown>)
    return typeof res === 'string' ? { ok: false, error: res } : { ok: true, data: res as T }
  }
  if (name === 'player:find') {
    const id = String((payload as { id?: unknown }).id ?? '')
    const found = findPlayer(id)
    return found ? { ok: true, data: { id: Number(id), name: found } as T } : { ok: false, error: 'not_found' }
  }
  return { ok: false, error: 'unknown' }
}

import type { AdminLoad, Quote, ShopOpen } from '../types'
import type { Result } from '../lib/api'
import { toServerProduct } from '../lib/catalog'
import { banners, categories, characterName, checkCode, discountCodes, findPlayer, groups, products } from './shop'
import { shopSettings } from './admin'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

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

function adminLoad(): AdminLoad {
  return {
    dev: true,
    categories,
    products: products.map(toServerProduct),
    banners,
    codes: discountCodes,
    groups,
    settings: {
      name: shopSettings.name,
      theme: shopSettings.theme,
      openKey: shopSettings.openKey,
      bannerSeconds: 5,
      locked: { name: false, theme: false, openKey: true },
    },
    imageHosts: [],
  }
}

export async function mockCall<T>(name: string, payload: object): Promise<Result<T>> {
  await wait(300)
  if (name === 'shop:open') return { ok: true, data: open() as T }
  if (name === 'cart:quote') return { ok: true, data: quote(payload) as T }
  if (name === 'admin:load') return { ok: true, data: adminLoad() as T }
  if (name === 'player:find') {
    const id = String((payload as { id?: unknown }).id ?? '')
    const found = findPlayer(id)
    return found ? { ok: true, data: { id: Number(id), name: found } as T } : { ok: false, error: 'not_found' }
  }
  return { ok: false, error: 'unknown' }
}

import type { Product, ServerProduct } from '../types'

export function toProduct(
  p: ServerProduct,
  stock: Record<string, number> = {},
  bought: Record<string, number> = {},
  keepSale = false,
): Product {
  const now = Date.now()
  const onSale = p.salePrice != null && (keepSale || !p.saleEndsAt || p.saleEndsAt > now)
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    description: p.description ?? undefined,
    image: p.image ?? null,
    price: onSale ? (p.salePrice as number) : p.price,
    oldPrice: onSale ? p.price : null,
    saleEndsAt: onSale ? (p.saleEndsAt ?? null) : null,
    stock: p.id in stock ? stock[p.id] : (p.stock ?? null),
    limit: p.limit ?? null,
    limitPeriod: p.limitPeriod ?? 'ever',
    bought: bought[p.id] ?? 0,
    rewards: p.rewards ?? [],
    featured: !!p.featured,
    startsAt: p.startsAt ?? null,
    hideWhenBlocked: !!p.hideWhenBlocked,
    enabled: p.enabled ?? true,
    rev: p.rev,
  }
}

export function toServerProduct(p: Product): ServerProduct {
  const onSale = p.oldPrice != null && p.oldPrice > p.price
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    description: p.description ?? null,
    image: p.image ?? null,
    price: onSale ? (p.oldPrice as number) : p.price,
    salePrice: onSale ? p.price : null,
    saleEndsAt: onSale ? (p.saleEndsAt ?? null) : null,
    stock: p.stock ?? null,
    limit: p.limit ?? null,
    limitPeriod: p.limitPeriod ?? 'ever',
    rewards: p.rewards,
    featured: !!p.featured,
    startsAt: p.startsAt ?? null,
    hideWhenBlocked: !!p.hideWhenBlocked,
    enabled: p.enabled ?? true,
    rev: p.rev,
  }
}

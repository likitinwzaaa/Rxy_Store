import type { CartLine, Discount, Product } from '../types'

export function cartTotals(lines: CartLine[], products: Product[], discount: Discount | null) {
  const subtotal = lines.reduce((sum, l) => {
    const p = products.find((x) => x.id === l.id)
    return p ? sum + p.price * l.qty : sum
  }, 0)

  let off = 0
  if (discount) {
    off = discount.kind === 'percent' ? Math.floor((subtotal * discount.value) / 100) : discount.value
    off = Math.min(off, subtotal)
  }

  return { subtotal, off, total: subtotal - off }
}

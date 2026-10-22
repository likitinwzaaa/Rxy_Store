import { useCallback, useEffect, useState } from 'react'
import type { CartLine, Product } from './types'
import { useNuiEvent } from './hooks/useNuiEvent'
import { fetchNui, isBrowser } from './lib/nui'
import { applyTheme, type Theme } from './lib/theme'
import { maxQty } from './lib/product'
import { banners, categories, inboxCount, products } from './mock/shop'
import { Home } from './pages/Home'
import { Toast, type ToastData } from './components/Toast'

if (isBrowser) applyTheme({ primary: '#FF7A1A' })

// หน้าหลักของร้าน
export default function App() {
  const [visible, setVisible] = useState(isBrowser)
  const [cart, setCart] = useState<CartLine[]>([])
  const [toast, setToast] = useState<ToastData | null>(null)

  useNuiEvent<boolean>('setVisible', setVisible)
  useNuiEvent<Theme>('setTheme', applyTheme)

  useEffect(() => {
    if (!visible) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible])

  const hideToast = useCallback(() => setToast(null), [])

  // ปิดร้าน
  function close() {
    setVisible(false)
    fetchNui('close')
  }

  // ใส่สินค้าลงตะกร้า
  function addToCart(p: Product) {
    const inCart = cart.find((l) => l.id === p.id)?.qty ?? 0
    const max = maxQty(p)

    if (inCart >= max) {
      const detail = p.limit ? `ซื้อได้คนละ ${p.limit} ชิ้น` : `เหลือในสต็อก ${p.stock} ชิ้น`
      setToast({ key: Date.now(), tone: 'warn', title: 'ใส่เพิ่มไม่ได้แล้ว', detail })
      return
    }

    setCart((lines) =>
      inCart ? lines.map((l) => (l.id === p.id ? { ...l, qty: l.qty + 1 } : l)) : [...lines, { id: p.id, qty: 1 }],
    )
    setToast({ key: Date.now(), title: 'ใส่ตะกร้าแล้ว', detail: p.name })
  }

  if (!visible) return null

  const cartCount = cart.reduce((n, l) => n + l.qty, 0)

  return (
    <div className="shop">
      <Home
        shopName="RXY STORE"
        products={products}
        categories={categories}
        banners={banners}
        cartCount={cartCount}
        inboxCount={inboxCount}
        onAdd={addToCart}
        onOpen={() => {}}
        onClose={close}
      />
      <Toast toast={toast} onDone={hideToast} />
    </div>
  )
}

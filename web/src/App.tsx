import { useCallback, useEffect, useState } from 'react'
import type { CartLine, Discount, Page, Product } from './types'
import { useNuiEvent } from './hooks/useNuiEvent'
import { fetchNui, isBrowser } from './lib/nui'
import { applyTheme, type Theme } from './lib/theme'
import { maxQty } from './lib/product'
import { banners, categories, characterName, checkCode, findPlayer, inboxCount, products } from './mock/shop'
import { Home } from './pages/Home'
import { Cart, type Gift } from './pages/Cart'
import { Toast, type ToastData } from './components/Toast'
import { ProductModal } from './components/ProductModal'

if (isBrowser) applyTheme({ primary: '#FF7A1A' })

// หน้าหลักของร้าน
export default function App() {
  const [visible, setVisible] = useState(isBrowser)
  const [cart, setCart] = useState<CartLine[]>([])
  const [toast, setToast] = useState<ToastData | null>(null)
  const [detail, setDetail] = useState<Product | null>(null)
  const [page, setPage] = useState<Page>('home')
  const [discount, setDiscount] = useState<Discount | null>(null)
  const [gift, setGift] = useState<Gift>({ on: false, id: '' })

  useNuiEvent<boolean>('setVisible', setVisible)
  useNuiEvent<Theme>('setTheme', applyTheme)

  useEffect(() => {
    if (!visible) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (detail) setDetail(null)
      else if (page !== 'home') setPage('home')
      else close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible, detail, page])

  const hideToast = useCallback(() => setToast(null), [])

  // ปิดร้าน
  function close() {
    setDetail(null)
    setVisible(false)
    fetchNui('close')
  }

  // ใส่สินค้าลงตะกร้า
  function addToCart(p: Product, qty = 1) {
    const inCart = cart.find((l) => l.id === p.id)?.qty ?? 0
    const max = maxQty(p)

    if (inCart + qty > max) {
      const detail = p.limit ? `ซื้อได้คนละ ${p.limit} ชิ้น` : `เหลือในสต็อก ${p.stock} ชิ้น`
      setToast({ key: Date.now(), tone: 'warn', title: 'ใส่เพิ่มไม่ได้แล้ว', detail })
      return
    }

    setCart((lines) =>
      inCart ? lines.map((l) => (l.id === p.id ? { ...l, qty: l.qty + qty } : l)) : [...lines, { id: p.id, qty }],
    )
    setToast({
      key: Date.now(),
      title: 'ใส่ตะกร้าแล้ว',
      detail: qty > 1 ? `${p.name} ×${qty}` : p.name,
      action: { label: 'ดูตะกร้า', onClick: () => go('cart') },
    })
  }

  // เปลี่ยนหน้า
  function go(next: Page) {
    setDetail(null)
    setToast(null)
    setPage(next)
  }

  // เปลี่ยนจำนวนของในตะกร้า
  function setQty(id: string, qty: number) {
    setCart((lines) => lines.map((l) => (l.id === id ? { ...l, qty } : l)))
  }

  // เอาของออกจากตะกร้า
  function remove(id: string) {
    setCart((lines) => lines.filter((l) => l.id !== id))
  }

  // ใช้โค้ดส่วนลด คืนข้อความ error ถ้าใช้ไม่ได้
  function applyCode(code: string) {
    const res = checkCode(code)
    if (!res.ok) return res.error
    setDiscount(res.discount)
    return null
  }

  if (!visible) return null

  const cartCount = cart.reduce((n, l) => n + l.qty, 0)
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? ''

  return (
    <div className="shop">
      {page === 'home' && (
        <Home
          shopName="RXY STORE"
          products={products}
          categories={categories}
          banners={banners}
          cartCount={cartCount}
          inboxCount={inboxCount}
          onAdd={addToCart}
          onOpen={setDetail}
          onGo={go}
          onClose={close}
        />
      )}
      {page === 'cart' && (
        <Cart
          lines={cart}
          products={products}
          categoryName={catName}
          discount={discount}
          gift={gift}
          characterName={characterName}
          findPlayer={findPlayer}
          onQty={setQty}
          onRemove={remove}
          onCode={applyCode}
          onClearCode={() => setDiscount(null)}
          onGift={setGift}
          onPay={() => setToast({ key: Date.now(), title: 'หน้าจ่ายเงินยังไม่ได้ทำ', tone: 'warn' })}
          onBack={() => go('home')}
          onClose={close}
        />
      )}
      {detail && (
        <ProductModal
          product={detail}
          categoryName={catName(detail.category)}
          inCart={cart.find((l) => l.id === detail.id)?.qty ?? 0}
          onAdd={addToCart}
          onClose={() => setDetail(null)}
        />
      )}
      <Toast toast={toast} onDone={hideToast} />
    </div>
  )
}

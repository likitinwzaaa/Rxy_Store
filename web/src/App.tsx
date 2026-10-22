import { useCallback, useEffect, useState } from 'react'
import type { CartLine, Discount, Order, Page, Product } from './types'
import { useNuiEvent } from './hooks/useNuiEvent'
import { fetchNui, isBrowser } from './lib/nui'
import { applyTheme, type Theme } from './lib/theme'
import { maxQty } from './lib/product'
import {
  banners,
  categories,
  characterName,
  checkCode,
  createOrder,
  deliver,
  findPlayer,
  inboxCount,
  owned,
  pastOrders,
  products,
  renewOrder,
} from './mock/shop'
import { Home } from './pages/Home'
import { Cart, type Gift } from './pages/Cart'
import { Payment } from './pages/Payment'
import { History } from './pages/History'
import { Toast, type ToastData } from './components/Toast'
import { ProductModal } from './components/ProductModal'
import { OrderModal } from './components/OrderModal'

if (isBrowser) applyTheme({ primary: '#FF7A1A' })

// หน้าหลักของร้าน
export default function App() {
  const [visible, setVisible] = useState(isBrowser)
  const [page, setPage] = useState<Page>('home')
  const [cart, setCart] = useState<CartLine[]>([])
  const [discount, setDiscount] = useState<Discount | null>(null)
  const [gift, setGift] = useState<Gift>({ on: false, id: '' })
  const [orders, setOrders] = useState<Order[]>(pastOrders)
  const [payId, setPayId] = useState<string | null>(null)
  const [cartOrderId, setCartOrderId] = useState<string | null>(null)
  const [detail, setDetail] = useState<Product | null>(null)
  const [viewOrder, setViewOrder] = useState<Order | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)

  useNuiEvent<boolean>('setVisible', setVisible)
  useNuiEvent<Theme>('setTheme', applyTheme)

  useEffect(() => {
    if (!visible) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (detail) setDetail(null)
      else if (viewOrder) setViewOrder(null)
      else if (page === 'home' || page === 'payment') close()
      else setPage('home')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible, detail, viewOrder, page])

  const hideToast = useCallback(() => setToast(null), [])

  const expire = useCallback(() => {
    setOrders((list) => list.map((o) => (o.id === payId && o.status === 'pending' ? { ...o, status: 'expired' } : o)))
  }, [payId])

  // ปิดร้าน
  function close() {
    setDetail(null)
    setViewOrder(null)
    setVisible(false)
    fetchNui('close')
  }

  // เปลี่ยนหน้า
  function go(next: Page) {
    setDetail(null)
    setViewOrder(null)
    setToast(null)
    setPage(next)
  }

  // ใส่สินค้าลงตะกร้า
  function addToCart(p: Product, qty = 1) {
    const inCart = cart.find((l) => l.id === p.id)?.qty ?? 0
    const max = maxQty(p)

    if (inCart + qty > max) {
      const detail = p.limit ? `ซื้อได้คนละ ${p.limit} ชิ้น` : `เหลือในสต็อก ${p.stock} ชิ้น`
      setToast({ key: Date.now(), tone: 'warn', title: 'ใส่เพิ่มไม่ได้แล้ว', detail })
      return false
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
    return true
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

  // เปิดหน้าจ่ายเงินของคำสั่งซื้อนี้
  function startPay(o: Order) {
    setOrders((list) => [o, ...list.filter((x) => x.id !== o.id)])
    setPayId(o.id)
    go('payment')
  }

  // สร้างคำสั่งซื้อจากตะกร้า
  function checkout() {
    const recipient = gift.on ? findPlayer(gift.id) : null
    const o = createOrder(cart, products, discount, recipient)
    setCartOrderId(o.id)
    startPay(o)
  }

  // สร้าง QR ใหม่จากคำสั่งซื้อที่หมดเวลา
  function renew(old: Order) {
    const o = renewOrder(old)
    if (old.id === cartOrderId) setCartOrderId(o.id)
    startPay(o)
  }

  // ยกเลิกคำสั่งซื้อที่ยังไม่จ่าย
  function cancel(o: Order) {
    setOrders((list) => list.filter((x) => x.id !== o.id))
    setPayId(null)
    go(o.id === cartOrderId ? 'cart' : 'history')
  }

  // จ่ายเงินสำเร็จ
  function paid(o: Order) {
    const done: Order = {
      ...o,
      status: 'paid',
      paidAt: Date.now(),
      ref: 'chrg_' + Math.random().toString(36).slice(2, 10),
      delivery: deliver(o, products),
    }
    setOrders((list) => list.map((x) => (x.id === o.id ? done : x)))
    if (o.id === cartOrderId) {
      setCart([])
      setDiscount(null)
      setGift({ on: false, id: '' })
      setCartOrderId(null)
    }
  }

  // ต่ออายุของ ใส่ตะกร้าแล้วไปหน้าตะกร้า
  function renewItem(productId: string) {
    const p = products.find((x) => x.id === productId)
    if (p && addToCart(p)) go('cart')
  }

  if (!visible) return null

  const cartCount = cart.reduce((n, l) => n + l.qty, 0)
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? ''
  const order = orders.find((o) => o.id === payId) ?? null

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
          onPay={checkout}
          onBack={() => go('home')}
          onClose={close}
        />
      )}

      {page === 'payment' && order && (
        <Payment
          shopName="RXY STORE"
          order={order}
          characterName={characterName}
          dev={isBrowser}
          onLater={close}
          onCancel={() => cancel(order)}
          onRenew={() => renew(order)}
          onEditCart={() => go('cart')}
          onHome={() => {
            setPayId(null)
            go('home')
          }}
          onHistory={() => {
            setPayId(null)
            go('history')
          }}
          onInbox={() => setToast({ key: Date.now(), title: 'กล่องรับของยังไม่ได้ทำ', tone: 'warn' })}
          onExpire={expire}
          onDevPaid={() => paid(order)}
          onClose={close}
        />
      )}

      {(page === 'history' || page === 'owned') && (
        <History
          tab={page}
          orders={orders}
          owned={owned}
          priceOf={(id) => products.find((p) => p.id === id)?.price ?? null}
          onTab={go}
          onPay={startPay}
          onView={setViewOrder}
          onRenew={renewItem}
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

      {viewOrder && <OrderModal order={viewOrder} onClose={() => setViewOrder(null)} />}

      <Toast toast={toast} onDone={hideToast} />
    </div>
  )
}

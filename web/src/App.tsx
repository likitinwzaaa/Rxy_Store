import { useCallback, useEffect, useState } from 'react'
import type { Banner, CartLine, Category, Discount, InboxItem, Notice, Order, Page, Product } from './types'
import { useNuiEvent } from './hooks/useNuiEvent'
import { fetchNui, isBrowser } from './lib/nui'
import { applyTheme, type Theme } from './lib/theme'
import { blockReason, maxQty } from './lib/product'
import { bannerState } from './lib/banner'
import {
  banners,
  categories,
  characterName,
  checkCode,
  createOrder,
  deliver,
  findPlayer,
  groups,
  inbox,
  owned,
  pastOrders,
  playerGroups,
  products,
  renewOrder,
} from './mock/shop'
import { Home } from './pages/Home'
import { Cart, type Gift } from './pages/Cart'
import { Payment } from './pages/Payment'
import { History } from './pages/History'
import { Inbox } from './pages/Inbox'
import { GameToast } from './components/GameToast'
import { AdminApp } from './admin/AdminApp'
import { Toast, type ToastData } from './components/Toast'
import { ProductModal } from './components/ProductModal'
import { OrderModal } from './components/OrderModal'

if (isBrowser) applyTheme({ primary: '#FF7A1A' })

// หน้าหลักของร้าน
export default function App() {
  const [visible, setVisible] = useState(isBrowser)
  const [admin, setAdmin] = useState(isBrowser && location.hash === '#admin')
  const [catalog, setCatalog] = useState<Product[]>(products)
  const [cats, setCats] = useState<Category[]>(categories)
  const [bannerList, setBannerList] = useState<Banner[]>(banners)
  const [bannerSeconds, setBannerSeconds] = useState(5)
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
  const [inboxItems, setInboxItems] = useState<InboxItem[]>(inbox)
  const [notice, setNotice] = useState<Notice | null>(null)

  useNuiEvent<boolean>('setVisible', setVisible)
  useNuiEvent<Theme>('setTheme', applyTheme)
  useNuiEvent<boolean>('setAdmin', setAdmin)
  useNuiEvent<Omit<Notice, 'key'>>('notify', (n) => {
    if (!n || typeof n.title !== 'string') return
    const lines = Array.isArray(n.lines) ? n.lines.filter((l) => typeof l === 'string').slice(0, 5) : []
    setNotice({ key: Date.now(), title: n.title, lines, footer: typeof n.footer === 'string' ? n.footer : undefined })
  })

  useEffect(() => {
    if (!visible) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (admin) close()
      else if (detail) setDetail(null)
      else if (viewOrder) setViewOrder(null)
      else if (page === 'home' || page === 'payment') close()
      else setPage('home')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible, admin, detail, viewOrder, page])

  const hideToast = useCallback(() => setToast(null), [])
  const hideNotice = useCallback(() => setNotice(null), [])

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
    const o = createOrder(cart, catalog, discount, recipient)
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

  // จ่ายเงินสำเร็จ ถ้าร้านปิดอยู่จะแจ้งเตือนมุมจอแทน
  function paid(o: Order, shopClosed = false) {
    const delivery = deliver(o, catalog)
    const done: Order = {
      ...o,
      status: 'paid',
      paidAt: Date.now(),
      ref: 'chrg_' + Math.random().toString(36).slice(2, 10),
      delivery,
    }
    setOrders((list) => list.map((x) => (x.id === o.id ? done : x)))

    const waiting = o.recipient ? 0 : delivery.reduce((n, d) => n + d.inbox, 0)
    if (waiting) {
      const items: InboxItem[] = delivery
        .filter((d) => d.inbox > 0)
        .map((d, i) => ({
          id: `${o.id}-${i}`,
          name: d.name.replace(/ ×\d+$/, '') + ` ×${d.inbox}`,
          orderId: o.id,
          reason: 'กระเป๋าเต็ม ต้องว่างอย่างน้อย 3 ช่อง',
          blocked: true,
        }))
      setInboxItems((list) => [...items, ...list])
    }

    if (shopClosed) {
      setNotice({
        key: Date.now(),
        title: o.recipient ? `จ่ายเรียบร้อย ส่งของให้ ${o.recipient} แล้ว` : 'จ่ายเรียบร้อย ได้ของแล้ว',
        lines: delivery.map((d) => `${d.name} · ${d.where}`),
        footer: waiting ? `อีก ${waiting} รายการรออยู่ในกล่องรับของ` : undefined,
      })
    }

    if (o.id === cartOrderId) {
      setCart([])
      setDiscount(null)
      setGift({ on: false, id: '' })
      setCartOrderId(null)
    }
  }

  // รับของจากกล่องรับของ
  function claim(item: InboxItem) {
    if (item.blocked) {
      setToast({ key: Date.now(), tone: 'warn', title: 'ยังรับไม่ได้', detail: item.reason })
      return
    }
    setInboxItems((list) =>
      list.map((x) => (x.id === item.id ? { ...x, claimedAt: Date.now(), reason: 'เข้าตัวละครแล้ว' } : x)),
    )
    setToast({ key: Date.now(), title: 'รับของแล้ว', detail: item.name })
  }

  // รับทุกชิ้นที่รับได้
  function claimAll() {
    const ready = inboxItems.filter((x) => !x.claimedAt && !x.blocked)
    const stuck = inboxItems.filter((x) => !x.claimedAt && x.blocked).length
    if (ready.length === 0) {
      setToast({ key: Date.now(), tone: 'warn', title: 'ยังไม่มีของที่รับได้', detail: 'เคลียร์ที่ว่างก่อนแล้วลองใหม่' })
      return
    }
    const ids = new Set(ready.map((x) => x.id))
    setInboxItems((list) =>
      list.map((x) => (ids.has(x.id) ? { ...x, claimedAt: Date.now(), reason: 'เข้าตัวละครแล้ว' } : x)),
    )
    setToast({
      key: Date.now(),
      title: `รับแล้ว ${ready.length} รายการ`,
      detail: stuck ? `อีก ${stuck} รายการยังรับไม่ได้` : undefined,
    })
  }

  // ต่ออายุของ ใส่ตะกร้าแล้วไปหน้าตะกร้า
  function renewItem(productId: string) {
    const p = catalog.find((x) => x.id === productId)
    if (p && addToCart(p)) go('cart')
  }

  if (!visible) {
    return notice ? <GameToast notice={notice} shopName="RXY STORE" openKey="F5" onDone={hideNotice} /> : null
  }

  if (admin) {
    return (
      <div className="shop">
        <AdminApp
          shopName="RXY STORE"
          products={catalog}
          categories={cats}
          groups={groups}
          onProducts={setCatalog}
          onCategories={setCats}
          banners={bannerList}
          bannerSeconds={bannerSeconds}
          onBanners={setBannerList}
          onBannerSeconds={setBannerSeconds}
          onToast={(title) => setToast({ key: Date.now(), title })}
          onClose={close}
        />
        <Toast toast={toast} onDone={hideToast} />
      </div>
    )
  }

  const cartCount = cart.reduce((n, l) => n + l.qty, 0)
  const shownCats = cats.filter((c) => {
    if (c.enabled === false) return false
    if (c.groups?.length && !c.groups.some((g) => playerGroups.includes(g))) return false
    if (c.hideEmpty && !catalog.some((p) => p.category === c.id && p.enabled !== false && !blockReason(p))) return false
    return true
  })
  const onSale = catalog.filter(
    (p) =>
      p.enabled !== false &&
      !(p.hideWhenBlocked && blockReason(p)) &&
      shownCats.some((c) => c.id === p.category),
  )
  const catName = (id: string) => cats.find((c) => c.id === id)?.name ?? ''
  const order = orders.find((o) => o.id === payId) ?? null

  return (
    <div className="shop">
      {page === 'home' && (
        <Home
          shopName="RXY STORE"
          products={onSale}
          categories={shownCats}
          banners={bannerList.filter((b) => bannerState(b) === 'live')}
          bannerSeconds={bannerSeconds}
          cartCount={cartCount}
          inboxCount={inboxItems.filter((x) => !x.claimedAt).length}
          onAdd={addToCart}
          onOpen={setDetail}
          onGo={go}
          onClose={close}
        />
      )}

      {page === 'cart' && (
        <Cart
          lines={cart}
          products={catalog}
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
          onInbox={() => {
            setPayId(null)
            go('inbox')
          }}
          onExpire={expire}
          onDevPaid={() => paid(order)}
          onDevPaidLater={() => {
            close()
            setTimeout(() => paid(order, true), 1500)
          }}
          onClose={close}
        />
      )}

      {(page === 'history' || page === 'owned') && (
        <History
          tab={page}
          orders={orders}
          owned={owned}
          priceOf={(id) => catalog.find((p) => p.id === id)?.price ?? null}
          onTab={go}
          onPay={startPay}
          onView={setViewOrder}
          onRenew={renewItem}
          onBack={() => go('home')}
          onClose={close}
        />
      )}

      {page === 'inbox' && (
        <Inbox items={inboxItems} onClaim={claim} onClaimAll={claimAll} onBack={() => go('home')} onClose={close} />
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

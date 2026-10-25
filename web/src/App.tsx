import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  AdminLoad,
  Banner,
  CartLine,
  Category,
  DiscountCode,
  InboxItem,
  Notice,
  Order,
  Page,
  Product,
  PublicSettings,
  Quote,
  ServerCatalog,
  ShopOpen,
  ShopSettings,
} from './types'
import { useNuiEvent } from './hooks/useNuiEvent'
import { fetchNui, isBrowser } from './lib/nui'
import { applyTheme, type Theme } from './lib/theme'
import { blockReason, maxQty, setImageHosts } from './lib/product'
import { call, errorText } from './lib/api'
import { toProduct } from './lib/catalog'
import { bannerState } from './lib/banner'
import { createOrder, deliver, inbox, owned, pastOrders, renewOrder } from './mock/shop'
import { Home } from './pages/Home'
import { Cart, type Gift } from './pages/Cart'
import { Payment } from './pages/Payment'
import { History } from './pages/History'
import { Inbox } from './pages/Inbox'
import { GameToast } from './components/GameToast'
import { AdminApp } from './admin/AdminApp'
import { shopSettings } from './mock/admin'
import { Toast, type ToastData } from './components/Toast'
import { ProductModal } from './components/ProductModal'
import { OrderModal } from './components/OrderModal'
import { Waiting } from './components/Waiting'

if (isBrowser) applyTheme({ primary: '#FF7A1A' })

export default function App() {
  const [visible, setVisible] = useState(isBrowser)
  const [admin, setAdmin] = useState(isBrowser && location.hash.startsWith('#admin'))
  const [shop, setShop] = useState<{ catalog: ServerCatalog; stock: Record<string, number>; bought: Record<string, number> } | null>(null)
  const cacheRef = useRef<{ version: number; vis: string; catalog: ServerCatalog } | null>(null)
  const [load, setLoad] = useState<{ busy: boolean; slow?: boolean; error?: string | null }>({ busy: false })
  const [playerName, setPlayerName] = useState('')
  const [adminData, setAdminData] = useState<AdminLoad | null>(null)
  const [aProducts, setAProducts] = useState<Product[]>([])
  const [aCats, setACats] = useState<Category[]>([])
  const [aBanners, setABanners] = useState<Banner[]>([])
  const [bannerSeconds, setBannerSeconds] = useState(5)
  const [settings, setSettings] = useState<ShopSettings>(shopSettings)
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [page, setPage] = useState<Page>('home')
  const [cart, setCart] = useState<CartLine[]>([])
  const [code, setCode] = useState<string | null>(null)
  const [quote, setQuote] = useState<Quote | null>(null)
  const quoteSeq = useRef(0)
  const [gift, setGift] = useState<Gift>({ on: false, id: '' })
  const [giftName, setGiftName] = useState<string | null>(null)
  const [giftChecking, setGiftChecking] = useState(false)
  const [orders, setOrders] = useState<Order[]>(isBrowser ? pastOrders : [])
  const [payId, setPayId] = useState<string | null>(null)
  const [cartOrderId, setCartOrderId] = useState<string | null>(null)
  const [detail, setDetail] = useState<Product | null>(null)
  const [viewOrder, setViewOrder] = useState<Order | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [inboxItems, setInboxItems] = useState<InboxItem[]>(isBrowser ? inbox : [])
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

  const catalog = useMemo(
    () => (shop ? shop.catalog.products.map((p) => toProduct(p, shop.stock, shop.bought)) : []),
    [shop],
  )
  const cats = shop?.catalog.categories ?? []
  const bannerList = shop?.catalog.banners ?? []

  const applySettings = useCallback((s: Pick<PublicSettings, 'name' | 'theme' | 'openKey' | 'bannerSeconds'>) => {
    applyTheme(s.theme ?? undefined)
    setBannerSeconds(s.bannerSeconds || 5)
    setSettings((prev) => ({
      ...prev,
      name: s.name,
      openKey: s.openKey,
      theme: { primary: s.theme?.primary ?? '#FF7A1A', secondary: s.theme?.secondary ?? null },
    }))
  }, [])

  const loadShop = useCallback(async () => {
    setLoad({ busy: true })
    const cached = cacheRef.current
    const res = await call<ShopOpen>('shop:open', { version: cached?.version, vis: cached?.vis })
    if (!res.ok) {
      setLoad({ busy: false, error: errorText(res.error) })
      return
    }
    const d = res.data
    const catalog = d.catalog ?? cached?.catalog
    if (!catalog) {
      cacheRef.current = null
      setLoad({ busy: false, error: errorText('error') })
      return
    }
    cacheRef.current = { version: d.version, vis: d.vis, catalog }
    setShop({ catalog, stock: d.stock ?? {}, bought: d.bought ?? {} })
    setImageHosts(d.settings.imageHosts)
    applySettings(d.settings)
    setPlayerName(d.player.name)
    setLoad({ busy: false })
  }, [applySettings])

  const loadAdmin = useCallback(async () => {
    setLoad({ busy: true })
    const res = await call<AdminLoad>('admin:load')
    if (!res.ok) {
      setLoad({ busy: false, error: errorText(res.error) })
      return
    }
    const d = res.data
    setAdminData(d)
    setAProducts(d.products.map((p) => toProduct(p, {}, {}, true)))
    setACats(d.categories)
    setABanners(d.banners)
    setCodes(d.codes)
    setImageHosts(d.imageHosts)
    applySettings(d.settings)
    setLoad({ busy: false })
  }, [applySettings])

  const reload = useCallback(() => (admin ? loadAdmin() : loadShop()), [admin, loadAdmin, loadShop])

  useEffect(() => {
    if (visible) reload()
  }, [visible, reload])

  useEffect(() => {
    if (!load.busy) return
    const t = setTimeout(() => setLoad((l) => (l.busy ? { ...l, slow: true } : l)), 10000)
    return () => clearTimeout(t)
  }, [load.busy])

  useEffect(() => {
    if (!visible || admin || page !== 'cart' || cart.length === 0) return
    const seq = ++quoteSeq.current
    const t = setTimeout(async () => {
      const res = await call<Quote>('cart:quote', { lines: cart, code })
      if (res.ok && seq === quoteSeq.current) setQuote(res.data)
    }, 250)
    return () => clearTimeout(t)
  }, [visible, admin, page, cart, code])

  useEffect(() => {
    setGiftName(null)
    if (!gift.on || !gift.id) {
      setGiftChecking(false)
      return
    }
    setGiftChecking(true)
    let alive = true
    const t = setTimeout(async () => {
      const res = await call<{ id: number; name: string }>('player:find', { id: Number(gift.id) })
      if (!alive) return
      setGiftName(res.ok ? res.data.name : null)
      setGiftChecking(false)
    }, 400)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [gift.on, gift.id])

  const hideToast = useCallback(() => setToast(null), [])
  const hideNotice = useCallback(() => setNotice(null), [])

  const expire = useCallback(() => {
    setOrders((list) => list.map((o) => (o.id === payId && o.status === 'pending' ? { ...o, status: 'expired' } : o)))
  }, [payId])

  function close() {
    setDetail(null)
    setViewOrder(null)
    setVisible(false)
    fetchNui('close')
  }

  function saveSettings(next: ShopSettings) {
    setSettings(next)
    applyTheme(next.theme)
  }

  function closeLoad() {
    setLoad({ busy: false })
    close()
  }

  function go(next: Page) {
    setDetail(null)
    setViewOrder(null)
    setToast(null)
    setPage(next)
  }

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

  function setQty(id: string, qty: number) {
    setCart((lines) => lines.map((l) => (l.id === id ? { ...l, qty } : l)))
  }

  function remove(id: string) {
    setCart((lines) => lines.filter((l) => l.id !== id))
  }

  async function applyCode(text: string) {
    const res = await call<Quote>('cart:quote', { lines: cart, code: text })
    if (!res.ok) return errorText(res.error)
    if (res.data.codeError || !res.data.code) return res.data.codeError ?? 'ไม่มีโค้ดนี้'
    quoteSeq.current++
    setQuote(res.data)
    setCode(res.data.code)
    return null
  }

  function startPay(o: Order) {
    setOrders((list) => [o, ...list.filter((x) => x.id !== o.id)])
    setPayId(o.id)
    go('payment')
  }

  function checkout() {
    if (!isBrowser) {
      setToast({ key: Date.now(), tone: 'warn', title: 'ยังจ่ายเงินไม่ได้', detail: 'ระบบจ่ายเงินยังไม่เปิดใช้' })
      return
    }
    const recipient = gift.on ? giftName : null
    const off = quote?.code ? quote.codeOff : 0
    const o = createOrder(cart, catalog, off ? { code: quote?.code ?? '', kind: 'fixed', value: off } : null, recipient)
    setCartOrderId(o.id)
    startPay(o)
  }

  function renew(old: Order) {
    const o = renewOrder(old)
    if (old.id === cartOrderId) setCartOrderId(o.id)
    startPay(o)
  }

  function cancel(o: Order) {
    setOrders((list) => list.filter((x) => x.id !== o.id))
    setPayId(null)
    go(o.id === cartOrderId ? 'cart' : 'history')
  }

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
      setCode(null)
      setQuote(null)
      setGift({ on: false, id: '' })
      setCartOrderId(null)
    }
  }

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

  function renewItem(productId: string) {
    const p = catalog.find((x) => x.id === productId)
    if (p && addToCart(p)) go('cart')
  }

  if (!visible) {
    return notice ? <GameToast notice={notice} shopName={settings.name} openKey={settings.openKey} onDone={hideNotice} /> : null
  }

  if (load.busy || load.error) {
    return (
      <div className="shop">
        <Waiting slow={load.slow} error={load.error} onRetry={reload} onClose={closeLoad} />
      </div>
    )
  }

  if (admin) {
    return (
      <div className="shop">
        <AdminApp
          settings={settings}
          codes={codes}
          onSettings={saveSettings}
          onCodes={setCodes}
          products={aProducts}
          categories={aCats}
          groups={adminData?.groups ?? []}
          onProducts={setAProducts}
          onCategories={setACats}
          banners={aBanners}
          bannerSeconds={bannerSeconds}
          onBanners={setABanners}
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
          shopName={settings.name}
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
          code={code}
          quote={quote}
          gift={gift}
          giftName={giftName}
          giftChecking={giftChecking}
          characterName={playerName}
          onQty={setQty}
          onRemove={remove}
          onCode={applyCode}
          onClearCode={() => setCode(null)}
          onGift={setGift}
          onPay={checkout}
          onBack={() => go('home')}
          onClose={close}
        />
      )}

      {page === 'payment' && order && (
        <Payment
          shopName={settings.name}
          order={order}
          characterName={playerName}
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

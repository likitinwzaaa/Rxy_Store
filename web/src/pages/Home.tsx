import { useMemo, useState } from 'react'
import type { Banner, Category, Page, Product } from '../types'
import { blockReason } from '../lib/product'
import { IconButton } from '../components/Button'
import { SearchBox } from '../components/SearchBox'
import { CategoryNav, type NavItem } from '../components/CategoryNav'
import { BannerSlider } from '../components/BannerSlider'
import { ProductCard } from '../components/ProductCard'

type Props = {
  shopName: string
  products: Product[]
  categories: Category[]
  banners: Banner[]
  cartCount: number
  inboxCount: number
  onAdd: (p: Product) => boolean | void
  onOpen: (p: Product) => void
  onGo: (page: Page) => void
  onClose: () => void
}

type View = { cat: string; q?: string }

// หน้าแรกของร้าน
export function Home(props: Props) {
  const { shopName, products, categories, banners, cartCount, inboxCount, onAdd, onOpen, onGo, onClose } = props
  const [view, setView] = useState<View>({ cat: 'all' })

  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? ''

  const nav: NavItem[] = useMemo(
    () => [
      { id: 'all', name: 'ทั้งหมด', count: products.length },
      { id: 'featured', name: 'แนะนำ', count: products.filter((p) => p.featured).length },
      ...categories.map((c) => ({ id: c.id, name: c.name, count: products.filter((p) => p.category === c.id).length })),
    ],
    [products, categories],
  )

  const shown = useMemo(() => {
    let list = products
    if (view.q) {
      const needle = view.q.toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(needle))
    } else if (view.cat === 'featured') {
      list = list.filter((p) => p.featured)
    } else if (view.cat !== 'all') {
      list = list.filter((p) => p.category === view.cat)
    }
    return [...list].sort((a, b) => Number(!!blockReason(a)) - Number(!!blockReason(b)))
  }, [products, view])

  const title = view.q ? `ผลค้นหา "${view.q}"` : view.cat === 'all' ? 'สินค้าทั้งหมด' : nav.find((n) => n.id === view.cat)?.name

  function openBanner(b: Banner) {
    const p = products.find((x) => x.id === b.productId)
    if (p) onOpen(p)
  }

  return (
    <>
      <header className="shop-head">
        <span className="shop-name">{shopName}</span>
        <SearchBox
          products={products}
          categoryName={catName}
          onPick={onOpen}
          onShowAll={(q) => setView({ cat: 'all', q })}
        />
        <button type="button" className="ulink head-link" onClick={() => onGo('history')}>
          ประวัติ
        </button>
        <IconButton icon="gift" label="กล่องรับของ" badge={inboxCount} badgeColor="accent-2" />
        <IconButton icon="cart" label="ตะกร้า" badge={cartCount} onClick={() => onGo('cart')} />
        <IconButton icon="close" label="ปิดร้าน" onClick={onClose} />
      </header>

      <div className="home">
        <CategoryNav items={nav} active={view.q ? '' : view.cat} onSelect={(cat) => setView({ cat })} />

        <main className="home-main">
          {view.cat === 'all' && !view.q && <BannerSlider banners={banners} onOpen={openBanner} />}

          <div className="home-title">
            <h2>{title}</h2>
            {view.q ? (
              <button type="button" className="ulink" onClick={() => setView({ cat: 'all' })}>
                ล้างคำค้น
              </button>
            ) : (
              <span>{shown.length} รายการ</span>
            )}
          </div>

          {shown.length === 0 ? (
            <p className="home-empty">ไม่มีสินค้าในหมวดนี้</p>
          ) : (
            <div className="grid">
              {shown.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  categoryName={catName(p.category)}
                  delay={Math.min(i, 12) * 35}
                  onAdd={onAdd}
                  onOpen={onOpen}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  )
}

import { useState } from 'react'
import type { AdminOrder, AdminPage, Banner, Category, DiscountCode, Product, ShopSettings } from '../types'
import { adminOrders, serverStatus, updateInfo } from '../mock/admin'
import { IconButton } from '../components/Button'
import { AdminProducts } from './AdminProducts'
import { AdminCategories } from './AdminCategories'
import { AdminOrders } from './AdminOrders'
import { AdminBanners } from './AdminBanners'
import { AdminSettings } from './AdminSettings'
import { UpdateBar } from './UpdateBar'

type Props = {
  settings: ShopSettings
  codes: DiscountCode[]
  onSettings: (next: ShopSettings) => void
  onCodes: (list: DiscountCode[]) => void
  products: Product[]
  categories: Category[]
  groups: { id: string; name: string }[]
  onProducts: (list: Product[]) => void
  onCategories: (list: Category[]) => void
  banners: Banner[]
  bannerSeconds: number
  onBanners: (list: Banner[]) => void
  onBannerSeconds: (n: number) => void
  onToast: (msg: string) => void
  onClose: () => void
}

const tabs: { id: AdminPage; name: string }[] = [
  { id: 'products', name: 'สินค้า' },
  { id: 'categories', name: 'หมวด' },
  { id: 'orders', name: 'คำสั่งซื้อ' },
  { id: 'banners', name: 'แบนเนอร์' },
  { id: 'settings', name: 'ตั้งค่าร้าน' },
]

export function AdminApp(props: Props) {
  const { settings, codes, onSettings, onCodes, products, categories, groups, onProducts, onCategories, onToast, onClose } = props
  const { banners, bannerSeconds, onBanners, onBannerSeconds } = props
  const [page, setPage] = useState<AdminPage>('products')
  const [orders, setOrders] = useState<AdminOrder[]>(adminOrders)
  const [skipped, setSkipped] = useState<string | null>(null)
  const [hidden, setHidden] = useState(false)
  const update = updateInfo
  const showUpdate = update.security || (!hidden && skipped !== update.latest)

  return (
    <>
      <header className="shop-head adm-head">
        <span className="adm-name">{settings.name}</span>
        <span className="adm-pill">แอดมิน</span>
        <nav className="adm-tabs" aria-label="เมนูแอดมิน">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={page === t.id ? 'tab on' : 'tab'}
              aria-current={page === t.id ? 'page' : undefined}
              onClick={() => setPage(t.id)}
            >
              {t.name}
            </button>
          ))}
        </nav>
        <div className="page-tools">
          {page === 'settings' && (
            <button type="submit" form="shop-settings" className="btn btn-solid btn-sm pill">
              บันทึก
            </button>
          )}
        </div>
        <IconButton icon="close" label="ปิด" onClick={onClose} />
      </header>

      {showUpdate && (
        <UpdateBar
          info={update}
          onSkip={() => {
            setSkipped(update.latest)
            onToast(`ข้าม v${update.latest} แล้ว จะเตือนอีกทีตอนมีเวอร์ชันถัดไป`)
          }}
          onHide={() => setHidden(true)}
        />
      )}

      {page === 'products' && (
        <AdminProducts products={products} categories={categories} onChange={onProducts} onSaved={onToast} />
      )}
      {page === 'categories' && (
        <AdminCategories
          categories={categories}
          products={products}
          groups={groups}
          onChange={onCategories}
          onSaved={onToast}
        />
      )}
      {page === 'orders' && <AdminOrders orders={orders} onChange={setOrders} onToast={onToast} />}
      {page === 'banners' && (
        <AdminBanners
          banners={banners}
          seconds={bannerSeconds}
          products={products}
          categories={categories}
          onChange={onBanners}
          onSeconds={onBannerSeconds}
          onSaved={onToast}
        />
      )}
      {page === 'settings' && (
        <AdminSettings
          settings={settings}
          codes={codes}
          status={serverStatus}
          onSave={onSettings}
          onCodes={onCodes}
          onToast={onToast}
        />
      )}
    </>
  )
}

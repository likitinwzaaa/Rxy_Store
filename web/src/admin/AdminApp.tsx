import { useMemo, useState } from 'react'
import type { AdminLoad, AdminOrder, AdminPage } from '../types'
import { adminOrders, updateInfo } from '../mock/admin'
import { call, errorText } from '../lib/api'
import { toProduct } from '../lib/catalog'
import { IconButton } from '../components/Button'
import { AdminProducts } from './AdminProducts'
import { AdminCategories } from './AdminCategories'
import { AdminOrders } from './AdminOrders'
import { AdminBanners } from './AdminBanners'
import { AdminSettings } from './AdminSettings'
import { UpdateBar } from './UpdateBar'

export type Run = (name: string, payload: object) => Promise<AdminLoad | null>

type Props = {
  data: AdminLoad
  onData: (d: AdminLoad) => void
  onToast: (msg: string, tone?: 'warn') => void
  onClose: () => void
}

const tabs: { id: AdminPage; name: string }[] = [
  { id: 'products', name: 'สินค้า' },
  { id: 'categories', name: 'หมวด' },
  { id: 'orders', name: 'คำสั่งซื้อ' },
  { id: 'banners', name: 'แบนเนอร์' },
  { id: 'settings', name: 'ตั้งค่าร้าน' },
]

const reloadOn = new Set(['conflict', 'stock_changed'])

export function AdminApp({ data, onData, onToast, onClose }: Props) {
  const [page, setPage] = useState<AdminPage>('products')
  const [orders, setOrders] = useState<AdminOrder[]>(adminOrders)
  const [skipped, setSkipped] = useState<string | null>(null)
  const [hidden, setHidden] = useState(false)
  const update = updateInfo
  const showUpdate = update.security || (!hidden && skipped !== update.latest)

  const products = useMemo(() => data.products.map((p) => toProduct(p, {}, {}, true)), [data.products])

  const run: Run = async (name, payload) => {
    const res = await call<AdminLoad>(name, payload)
    if (!res.ok) {
      onToast(errorText(res.error), 'warn')
      if (reloadOn.has(res.error)) {
        const fresh = await call<AdminLoad>('admin:load')
        if (fresh.ok) onData(fresh.data)
      }
      return null
    }
    if (!res.data.errors) onData(res.data)
    return res.data
  }

  return (
    <>
      <header className="shop-head adm-head">
        <span className="adm-name">{data.settings.name}</span>
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
            onToast('ข้ามเวอร์ชันนี้แล้ว จะเตือนอีกทีตอนมีเวอร์ชันถัดไป')
          }}
          onHide={() => setHidden(true)}
        />
      )}

      {page === 'products' && (
        <AdminProducts products={products} categories={data.categories} roles={data.roles} run={run} onToast={onToast} />
      )}
      {page === 'categories' && (
        <AdminCategories categories={data.categories} products={products} groups={data.groups} run={run} onToast={onToast} />
      )}
      {page === 'orders' && <AdminOrders orders={orders} onChange={setOrders} onToast={onToast} />}
      {page === 'banners' && (
        <AdminBanners
          banners={data.banners}
          seconds={data.settings.bannerSeconds}
          products={products}
          categories={data.categories}
          run={run}
          onToast={onToast}
        />
      )}
      {page === 'settings' && <AdminSettings data={data} products={products} run={run} onToast={onToast} />}
    </>
  )
}

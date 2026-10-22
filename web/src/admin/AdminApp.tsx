import { useState } from 'react'
import type { AdminPage, Category, Product } from '../types'
import { IconButton } from '../components/Button'
import { AdminProducts } from './AdminProducts'
import { AdminCategories } from './AdminCategories'

type Props = {
  shopName: string
  products: Product[]
  categories: Category[]
  groups: { id: string; name: string }[]
  onProducts: (list: Product[]) => void
  onCategories: (list: Category[]) => void
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

// หน้าแอดมิน
export function AdminApp(props: Props) {
  const { shopName, products, categories, groups, onProducts, onCategories, onToast, onClose } = props
  const [page, setPage] = useState<AdminPage>('products')

  return (
    <>
      <header className="shop-head adm-head">
        <span className="adm-name">{shopName}</span>
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
        <div className="page-tools" />
        <IconButton icon="close" label="ปิด" onClick={onClose} />
      </header>

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
      {page !== 'products' && page !== 'categories' && <p className="hist-empty">หน้านี้ยังไม่ได้ทำ</p>}
    </>
  )
}

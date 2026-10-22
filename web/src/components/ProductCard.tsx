import type { Product } from '../types'
import { baht } from '../lib/format'
import { blockReason, discount, safeImage } from '../lib/product'
import { Icon } from './Icon'

type Props = {
  product: Product
  categoryName: string
  delay: number
  onAdd: (p: Product) => void
  onOpen: (p: Product) => void
}

// การ์ดสินค้าในหน้าร้าน
export function ProductCard({ product: p, categoryName, delay, onAdd, onOpen }: Props) {
  const why = blockReason(p)
  const off = discount(p)
  const img = safeImage(p.image)
  const lowStock = p.stock != null && p.stock > 0 && p.stock <= 20

  return (
    <article
      className={why ? 'card off' : 'card'}
      style={{ animationDelay: delay + 'ms' }}
      onClick={() => onOpen(p)}
    >
      <div className="card-shot">
        {img ? <img src={img} alt="" draggable={false} /> : <span className="mono">รูปสินค้า</span>}
        {!why && off > 0 && <span className="tag tag-accent">ลด {off}%</span>}
        {!why && !off && lowStock && <span className="tag tag-accent-2">เหลือ {p.stock}</span>}
      </div>

      <div className="card-meta">
        <span className="card-cat">{categoryName}</span>
        <span className="card-name">{p.name}</span>
        <div className="card-foot">
          <div className="card-price mono">
            <span className={off && !why ? 'now sale' : 'now'}>{baht(p.price)}</span>
            {!!off && <span className="old">{baht(p.oldPrice!)}</span>}
          </div>

          {why ? (
            <span className="card-why">{why}</span>
          ) : (
            <button
              type="button"
              className="card-add"
              aria-label={`ใส่ ${p.name} ลงตะกร้า`}
              onClick={(e) => {
                e.stopPropagation()
                onAdd(p)
              }}
            >
              <Icon name="cart" size={17} />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

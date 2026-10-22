import { useEffect, useState } from 'react'
import type { Product, Reward } from '../types'
import { baht, countdown, dateTimeShort } from '../lib/format'
import { blockReason, discount, maxQty, safeImage } from '../lib/product'
import { useNow } from '../hooks/useNow'
import { Icon } from './Icon'

type Props = {
  product: Product
  categoryName: string
  inCart: number
  onAdd: (p: Product, qty: number) => void
  onClose: () => void
}

const where: Record<Reward['kind'], string> = {
  item: 'กระเป๋า',
  vehicle: 'การาจ',
  rank: 'ยศ',
  points: 'พอยท์',
  money: 'บัญชีธนาคาร',
  command: 'ระบบ',
}

// จำนวนของที่ได้ เช่น 1 คัน, ×2, 5,000
function amountText(r: Reward) {
  if (r.kind === 'vehicle') return r.amount + ' คัน'
  if (r.kind === 'money' || r.kind === 'points') return r.amount.toLocaleString('en-US')
  if (r.kind === 'rank') return ''
  return '×' + r.amount
}

// หน้าต่างรายละเอียดสินค้า
export function ProductModal({ product: p, categoryName, inCart, onAdd, onClose }: Props) {
  const [qty, setQty] = useState(1)
  const now = useNow(1000, !!p.saleEndsAt || !!p.startsAt)

  const why = blockReason(p, now)
  const off = discount(p)
  const img = safeImage(p.image)
  const room = maxQty(p) - inCart
  const canAdd = !why && room > 0
  const saleLeft = p.saleEndsAt ? p.saleEndsAt - now : 0

  useEffect(() => setQty(1), [p.id])

  return (
    <div className="veil" onMouseDown={onClose}>
      <div
        className="modal pd"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pd-name"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="pd-left">
          <div className="pd-shot">
            {img ? <img src={img} alt="" draggable={false} /> : <span className="mono">รูปสินค้า</span>}
            {off > 0 && <span className="tag tag-accent">ลด {off}%</span>}
          </div>

          {saleLeft > 0 && off > 0 && (
            <div className="pd-timer">
              <Icon name="clock" size={15} />
              ราคาลดหมดใน
              <b className="mono">{countdown(saleLeft)}</b>
            </div>
          )}

          {p.startsAt && p.startsAt > now && (
            <div className="pd-timer">
              <Icon name="clock" size={15} />
              เปิดขาย
              <b>{dateTimeShort(p.startsAt)}</b>
            </div>
          )}
        </div>

        <div className="pd-right">
          <div className="pd-head">
            <div>
              <span className="pd-cat">{categoryName}</span>
              <h1 id="pd-name">{p.name}</h1>
            </div>
            <button type="button" className="icon-btn" aria-label="ปิด" onClick={onClose}>
              <Icon name="close" size={16} />
            </button>
          </div>

          <div className="pd-price mono">
            <span className={off ? 'now sale' : 'now'}>{baht(p.price)}</span>
            {off > 0 && <span className="old">{baht(p.oldPrice!)}</span>}
          </div>

          {p.description && <p className="pd-desc">{p.description}</p>}

          <div className="pd-rewards">
            <span className="pd-label">ได้อะไรบ้าง</span>
            {p.rewards.map((r, i) => (
              <div key={i} className="pd-reward">
                <span className="dot-2" />
                <span className="pd-reward-name">{r.label}</span>
                {r.days ? <span className="pd-days">{r.days} วัน</span> : null}
                <span className="mono">{amountText(r)}</span>
                <span className="pd-where">{where[r.kind]}</span>
              </div>
            ))}
          </div>

          <div className="pd-limits">
            {p.limit ? (
              <>
                <span>
                  ซื้อได้คนละ <b>{p.limit}</b>
                </span>
                <span>
                  คุณซื้อไปแล้ว <b>{p.bought ?? 0}/{p.limit}</b>
                </span>
              </>
            ) : null}
            <span>
              สต็อก <b>{p.stock == null ? 'ไม่จำกัด' : p.stock}</b>
            </span>
            {inCart > 0 && (
              <span>
                ในตะกร้า <b>{inCart}</b>
              </span>
            )}
          </div>

          <div className="pd-foot">
            <div className={canAdd ? 'stepper' : 'stepper off'}>
              <button
                type="button"
                aria-label="ลดจำนวน"
                disabled={!canAdd || qty <= 1}
                onClick={() => setQty((q) => q - 1)}
              >
                −
              </button>
              <span className="mono">{qty}</span>
              <button
                type="button"
                aria-label="เพิ่มจำนวน"
                disabled={!canAdd || qty >= room}
                onClick={() => setQty((q) => q + 1)}
              >
                +
              </button>
            </div>

            <button
              type="button"
              className="btn btn-solid btn-lg pd-add"
              disabled={!canAdd}
              onClick={() => {
                onAdd(p, qty)
                onClose()
              }}
            >
              <Icon name="cart" size={17} />
              {why ?? (room <= 0 ? 'ใส่ตะกร้าครบแล้ว' : `ใส่ตะกร้า · ${baht(p.price * qty)}`)}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

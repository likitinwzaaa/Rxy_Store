import { useState } from 'react'
import type { CartLine, Discount, Product } from '../types'
import { baht } from '../lib/format'
import { maxQty, safeImage } from '../lib/product'
import { cartTotals } from '../lib/cart'
import { PageHead } from '../components/PageHead'
import { Button } from '../components/Button'
import { Toggle } from '../components/Toggle'
import { Icon } from '../components/Icon'

export type Gift = { on: boolean; id: string }

type Props = {
  lines: CartLine[]
  products: Product[]
  categoryName: (id: string) => string
  discount: Discount | null
  gift: Gift
  characterName: string
  findPlayer: (id: string) => string | null
  onQty: (id: string, qty: number) => void
  onRemove: (id: string) => void
  onCode: (code: string) => string | null
  onClearCode: () => void
  onGift: (g: Gift) => void
  onPay: () => void
  onBack: () => void
  onClose: () => void
}

// ข้อความใต้ชื่อสินค้าในตะกร้า
function lineNote(p: Product) {
  const parts: string[] = []
  if (p.rewards.some((r) => r.days)) parts.push('ต่ออายุจากของเดิมได้')
  if (p.stock != null) parts.push(`เหลือ ${p.stock}`)
  if (p.limit) parts.push(`ซื้อได้คนละ ${p.limit}`)
  return parts.join(' · ')
}

// หน้าตะกร้า
export function Cart(props: Props) {
  const { lines, products, categoryName, discount, gift, characterName, findPlayer } = props
  const [code, setCode] = useState(discount?.code ?? '')
  const [codeError, setCodeError] = useState<string | null>(null)

  const rows = lines
    .map((l) => ({ line: l, product: products.find((p) => p.id === l.id) }))
    .filter((r): r is { line: CartLine; product: Product } => !!r.product)

  const { subtotal, off, total } = cartTotals(lines, products, discount)
  const count = lines.reduce((n, l) => n + l.qty, 0)

  const giftName = gift.on && gift.id ? findPlayer(gift.id) : null
  const giftMissing = gift.on && gift.id !== '' && !giftName
  const canPay = rows.length > 0 && (!gift.on || !!giftName)

  function applyCode() {
    if (!code.trim()) return
    setCodeError(props.onCode(code))
  }

  return (
    <>
      <PageHead title="ตะกร้า" sub={count ? `${count} ชิ้น` : undefined} onBack={props.onBack} onClose={props.onClose} />

      {rows.length === 0 ? (
        <div className="cart-empty">
          <Icon name="cart" size={40} stroke={1.4} />
          <p>ยังไม่มีของในตะกร้า</p>
          <button type="button" className="ulink" onClick={props.onBack}>
            เลือกซื้อสินค้า
          </button>
        </div>
      ) : (
        <div className="cart">
          <section className="cart-list">
            {rows.map(({ line, product: p }, i) => {
              const img = safeImage(p.image)
              const max = maxQty(p)
              return (
                <div key={p.id} className="cart-row" style={{ animationDelay: i * 60 + 'ms' }}>
                  <div className="cart-shot">{img ? <img src={img} alt="" /> : null}</div>
                  <div className="cart-info">
                    <span className="cart-cat">{categoryName(p.category)}</span>
                    <span className="cart-name">{p.name}</span>
                    <span className="cart-note">{lineNote(p)}</span>
                  </div>
                  <div className="stepper sm">
                    <button
                      type="button"
                      aria-label="ลดจำนวน"
                      disabled={line.qty <= 1}
                      onClick={() => props.onQty(p.id, line.qty - 1)}
                    >
                      −
                    </button>
                    <span className="mono">{line.qty}</span>
                    <button
                      type="button"
                      aria-label="เพิ่มจำนวน"
                      disabled={line.qty >= max}
                      onClick={() => props.onQty(p.id, line.qty + 1)}
                    >
                      +
                    </button>
                  </div>
                  <span className="cart-total mono">{baht(p.price * line.qty)}</span>
                  <button type="button" className="trash" aria-label={`เอา ${p.name} ออก`} onClick={() => props.onRemove(p.id)}>
                    <Icon name="trash" size={16} stroke={1.9} />
                  </button>
                </div>
              )
            })}
          </section>

          <aside className="cart-side">
            <h2>สรุปคำสั่งซื้อ</h2>

            <div className="field-group">
              <label htmlFor="code">โค้ดส่วนลด</label>
              {discount ? (
                <div className="code-on">
                  <span className="mono">{discount.code}</span>
                  <span>ลด {discount.kind === 'percent' ? discount.value + '%' : baht(discount.value)}</span>
                  <button
                    type="button"
                    className="ulink"
                    onClick={() => {
                      props.onClearCode()
                      setCode('')
                    }}
                  >
                    เอาออก
                  </button>
                </div>
              ) : (
                <>
                  <div className="code-row">
                    <input
                      id="code"
                      className={codeError ? 'input mono bad' : 'input mono'}
                      value={code}
                      placeholder="ใส่โค้ด"
                      onChange={(e) => {
                        setCode(e.target.value.toUpperCase())
                        setCodeError(null)
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && applyCode()}
                    />
                    <Button onClick={applyCode}>ใช้โค้ด</Button>
                  </div>
                  {codeError && <span className="field-err">{codeError}</span>}
                </>
              )}
            </div>

            <div className="sum">
              <div>
                <span>ราคาสินค้า</span>
                <span className="mono">{baht(subtotal)}</span>
              </div>
              {off > 0 && (
                <div className="sum-off">
                  <span>ส่วนลด {discount?.code}</span>
                  <span className="mono">−{baht(off)}</span>
                </div>
              )}
            </div>

            <div className="sum-total">
              <span>ยอดชำระ</span>
              <span className="mono">{baht(total)}</span>
            </div>

            <div className="gift">
              <div className="gift-row">
                <span>ซื้อให้คนอื่น</span>
                <Toggle on={gift.on} label="ซื้อให้คนอื่น" onChange={(on) => props.onGift({ ...gift, on })} />
              </div>
              {gift.on && (
                <>
                  <label className={giftMissing ? 'gift-field bad' : 'gift-field'}>
                    <span>ID</span>
                    <input
                      className="mono"
                      value={gift.id}
                      placeholder="เลข ID ในเซิร์ฟ"
                      aria-label="ID ผู้เล่นที่จะรับของ"
                      onChange={(e) => props.onGift({ ...gift, id: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    />
                    {giftName && <b>{giftName}</b>}
                  </label>
                  {giftMissing && <span className="field-err">ไม่เจอผู้เล่น ID นี้ในเซิร์ฟตอนนี้</span>}
                </>
              )}
            </div>

            <div className="cart-pay">
              <p className="notice">
                {!gift.on && (
                  <>
                    ของจะเข้าตัวละคร <b>{characterName}</b> ทันทีที่จ่ายเสร็จ ถ้าออฟไลน์อยู่จะได้ตอนเข้าเกมครั้งถัดไป
                  </>
                )}
                {giftName && (
                  <>
                    ของจะเข้ากล่องรับของของ <b>{giftName}</b> พร้อมบอกว่าคุณเป็นคนให้ ลิมิตต่อคนนับที่คนรับ
                  </>
                )}
                {gift.on && !giftName && 'ใส่ ID ของคนที่ออนไลน์อยู่ก่อน ถึงจะจ่ายได้'}
              </p>
              <Button variant="solid" size="lg" className="pay-btn" disabled={!canPay} onClick={props.onPay}>
                ชำระด้วย PromptPay
                <Icon name="arrow" size={15} stroke={2.2} />
              </Button>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}

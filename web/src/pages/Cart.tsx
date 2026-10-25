import { useState } from 'react'
import type { CartLine, Product, Quote } from '../types'
import { baht } from '../lib/format'
import { maxQty, safeImage } from '../lib/product'
import { PageHead } from '../components/PageHead'
import { Button } from '../components/Button'
import { Toggle } from '../components/Toggle'
import { Icon } from '../components/Icon'

export type Gift = { on: boolean; id: string }

type Props = {
  lines: CartLine[]
  products: Product[]
  categoryName: (id: string) => string
  code: string | null
  quote: Quote | null
  gift: Gift
  giftName: string | null
  giftChecking: boolean
  characterName: string
  onQty: (id: string, qty: number) => void
  onRemove: (id: string) => void
  onCode: (code: string) => Promise<string | null>
  onClearCode: () => void
  onGift: (g: Gift) => void
  onPay: () => void
  onBack: () => void
  onClose: () => void
}

function lineNote(p: Product) {
  const parts: string[] = []
  if (p.rewards.some((r) => r.days)) parts.push('ต่ออายุจากของเดิมได้')
  if (p.stock != null) parts.push(`เหลือ ${p.stock}`)
  if (p.limit) parts.push(`ซื้อได้คนละ ${p.limit}`)
  return parts.join(' · ')
}

export function Cart(props: Props) {
  const { lines, products, categoryName, quote, gift, giftName, giftChecking, characterName } = props
  const [code, setCode] = useState(props.code ?? '')
  const [codeError, setCodeError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  const rows = lines
    .map((l) => ({ line: l, product: products.find((p) => p.id === l.id) }))
    .filter((r): r is { line: CartLine; product: Product } => !!r.product)

  const localSubtotal = rows.reduce((n, r) => n + r.product.price * r.line.qty, 0)
  const subtotal = quote ? quote.subtotal : localSubtotal
  const codeOff = quote && props.code ? quote.codeOff : 0
  const tierOff = quote ? quote.tierOff : 0
  const total = quote ? quote.total : localSubtotal
  const count = lines.reduce((n, l) => n + l.qty, 0)
  const issue = (id: string) => quote?.issues.find((i) => i.id === id)?.reason

  const giftMissing = gift.on && gift.id !== '' && !giftChecking && !giftName
  const canPay = rows.length > 0 && (!gift.on || !!giftName) && !quote?.issues.length

  async function applyCode() {
    if (!code.trim() || checking) return
    setChecking(true)
    setCodeError(await props.onCode(code.trim()))
    setChecking(false)
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
                    {issue(p.id) ? (
                      <span className="cart-note bad">{issue(p.id)}</span>
                    ) : (
                      <span className="cart-note">{lineNote(p)}</span>
                    )}
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
              {props.code ? (
                <div className="code-on">
                  <span className="mono">{props.code}</span>
                  <span>{quote?.codeError ? quote.codeError : codeOff > 0 ? 'ลด ' + baht(codeOff) : ''}</span>
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
                    <Button onClick={applyCode} disabled={checking}>
                      {checking ? 'กำลังเช็ค' : 'ใช้โค้ด'}
                    </Button>
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
              {codeOff > 0 && (
                <div className="sum-off">
                  <span>ส่วนลด {props.code}</span>
                  <span className="mono">−{baht(codeOff)}</span>
                </div>
              )}
              {tierOff > 0 && (
                <div className="sum-off">
                  <span>ส่วนลดขั้น {quote?.tier}</span>
                  <span className="mono">−{baht(tierOff)}</span>
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
                    ของจะเข้าตัวละคร <b>{characterName}</b> ทันทีที่จ่ายเสร็จ ถ้าออฟไลน์อยู่หรือกระเป๋าเต็ม ของจะเข้ากล่องรับของ
                  </>
                )}
                {giftName && (
                  <>
                    ของจะเข้ากล่องรับของของ <b>{giftName}</b> พร้อมบอกว่าคุณเป็นคนให้ ลิมิตต่อคนนับทั้งคุณและคนรับ
                  </>
                )}
                {gift.on && !giftName && (giftChecking ? 'กำลังหาผู้เล่น...' : 'ใส่ ID ของคนที่ออนไลน์อยู่ก่อน ถึงจะจ่ายได้')}
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

import { useState, type KeyboardEvent } from 'react'
import type { Order, Owned, Page } from '../types'
import { baht, dateTimeShort } from '../lib/format'
import { orderItems, statusLook } from '../lib/order'
import { copyText } from '../lib/clipboard'
import { useNow } from '../hooks/useNow'
import { PageHead } from '../components/PageHead'
import { Icon } from '../components/Icon'

type Props = {
  tab: 'history' | 'owned'
  orders: Order[]
  owned: Owned[]
  priceOf: (productId: string) => number | null
  onTab: (p: Page) => void
  onPay: (o: Order) => void
  onView: (o: Order) => void
  onRenew: (productId: string) => void
  onBack: () => void
  onClose: () => void
}

const HOUR = 60 * 60 * 1000

function leftText(ms: number) {
  const h = Math.floor(ms / HOUR)
  const d = Math.floor(h / 24)
  const r = h % 24
  if (d === 0) return `เหลือ ${Math.max(r, 1)} ชม.`
  return `เหลือ ${d} วัน` + (r ? ` ${r} ชม.` : '')
}

export function History(props: Props) {
  const { tab, orders, owned } = props
  const now = useNow(60 * 1000)
  const soon = owned.filter((o) => !o.pulledAt && o.endsAt - now <= 48 * HOUR).length

  return (
    <>
      <PageHead title="ประวัติการซื้อ" onBack={props.onBack} onClose={props.onClose}>
        {tab === 'history' && <OrderSearch orders={orders} onView={props.onView} />}
      </PageHead>

      <div className="hist">
        <nav className="tabs" aria-label="หมวดประวัติ">
          <button
            type="button"
            className={tab === 'history' ? 'tab on' : 'tab'}
            aria-current={tab === 'history' ? 'page' : undefined}
            onClick={() => props.onTab('history')}
          >
            คำสั่งซื้อ
          </button>
          <button
            type="button"
            className={tab === 'owned' ? 'tab on' : 'tab'}
            aria-current={tab === 'owned' ? 'page' : undefined}
            onClick={() => props.onTab('owned')}
          >
            ของที่มีวันหมด
            {soon > 0 && <span className="tab-badge mono">{soon}</span>}
          </button>
        </nav>

        {tab === 'history' ? <OrderList {...props} /> : <OwnedList {...props} now={now} />}
      </div>
    </>
  )
}

function OrderSearch({ orders, onView }: { orders: Order[]; onView: (o: Order) => void }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const needle = q.trim().toLowerCase()
  const hits = needle ? orders.filter((o) => (o.id + ' ' + orderItems(o)).toLowerCase().includes(needle)) : []

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape' && (open || q)) {
      e.stopPropagation()
      setQ('')
      setOpen(false)
    }
  }

  return (
    <div className="search hist-search">
      <label className="search-field">
        <Icon name="search" size={14} />
        <input
          value={q}
          placeholder="เลขคำสั่งซื้อ หรือชื่อสินค้า"
          aria-label="ค้นหาคำสั่งซื้อ"
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
          }}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKey}
        />
      </label>
      {open && needle && (
        <div className="search-drop" role="listbox">
          {hits.slice(0, 3).map((o) => {
            const inId = o.id.toLowerCase().includes(needle)
            const label = inId ? o.id : orderItems(o)
            const at = label.toLowerCase().indexOf(needle)
            return (
              <div key={o.id} className="sug sug-2" role="option" aria-selected="false" onMouseDown={() => onView(o)}>
                <span className="sug-name">
                  {label.slice(0, at)}
                  <b>{label.slice(at, at + needle.length)}</b>
                  {label.slice(at + needle.length)}
                </span>
                <span className="sug-sub mono">{inId ? orderItems(o) : o.id}</span>
              </div>
            )
          })}
          {hits.length === 0 && <div className="sug-empty">ไม่เจอคำสั่งซื้อที่ตรงกับ "{q.trim()}"</div>}
        </div>
      )}
    </div>
  )
}

function OrderList({ orders, onPay, onView }: Props) {
  const [copied, setCopied] = useState<string | null>(null)

  function copy(id: string) {
    copyText(id)
    setCopied(id)
    setTimeout(() => setCopied((c) => (c === id ? null : c)), 1400)
  }

  if (orders.length === 0) return <p className="hist-empty">ยังไม่เคยซื้ออะไร</p>

  return (
    <>
      <div className="hist-row hist-cols">
        <span>เลขคำสั่งซื้อ (กดเพื่อคัดลอก)</span>
        <span>วันที่</span>
        <span>สินค้า</span>
        <span className="right">ยอด</span>
        <span>สถานะ</span>
        <span />
      </div>
      <div className="hist-list">
        {orders.map((o, i) => {
          const look = statusLook(o.status)
          return (
            <div key={o.id} className="hist-row hist-item" style={{ animationDelay: Math.min(i, 10) * 50 + 'ms' }}>
              <span>
                <button type="button" className="copy mono" aria-label={`คัดลอกเลข ${o.id}`} onClick={() => copy(o.id)}>
                  {o.id}
                  <Icon name="copy" size={12} />
                  {copied === o.id && <span className="copied">คัดลอกแล้ว</span>}
                </button>
              </span>
              <span className="hist-date">{dateTimeShort(o.createdAt)}</span>
              <span className="hist-items">{orderItems(o)}</span>
              <span className="right mono">{baht(o.total)}</span>
              <span className={'od-status ' + look.tone}>
                <i className={o.status === 'pending' ? 'pulse-dot' : undefined} />
                {look.label}
              </span>
              <span className="right">
                {o.status === 'pending' ? (
                  <button type="button" className="btn btn-solid btn-sm" onClick={() => onPay(o)}>
                    จ่ายต่อ
                  </button>
                ) : (
                  <button type="button" className="ulink" onClick={() => onView(o)}>
                    รายละเอียด
                  </button>
                )}
              </span>
            </div>
          )
        })}
      </div>
      <span className="hist-hint">ของไม่เข้า? กดเลขคำสั่งซื้อเพื่อคัดลอก แล้วส่งให้แอดมิน</span>
    </>
  )
}

function OwnedList({ owned, priceOf, onRenew, now }: Props & { now: number }) {
  if (owned.length === 0) return <p className="hist-empty">ยังไม่มีของที่มีวันหมด</p>

  const sorted = [...owned].sort((a, b) => Number(!!a.pulledAt) - Number(!!b.pulledAt) || a.endsAt - b.endsAt)

  return (
    <>
      <div className="hist-list">
        {sorted.map((o, i) => {
          const gone = !!o.pulledAt || o.endsAt <= now
          const left = o.endsAt - now
          const soon = !gone && left <= 48 * HOUR
          const pct = gone ? 0 : Math.round((left / (o.endsAt - o.startsAt)) * 100)
          const price = priceOf(o.productId)

          return (
            <div
              key={o.id}
              className={'own' + (gone ? ' gone' : '') + (soon ? ' soon' : '')}
              style={{ animationDelay: i * 60 + 'ms' }}
            >
              <div className="own-shot" />
              <div className="own-name">
                <span>{o.label}</span>
                <b>{o.name}</b>
              </div>
              <div className="own-time">
                <div>
                  <span className="own-left">
                    {soon && <i className="pulse-dot" />}
                    {gone ? 'หมดอายุแล้ว' : leftText(left)}
                  </span>
                  <span className="own-until">
                    {gone ? `ดึงคืนแล้วเมื่อ ${dateTimeShort(o.pulledAt ?? o.endsAt)}` : `หมด ${dateTimeShort(o.endsAt)}`}
                  </span>
                </div>
                <div className="own-bar">
                  <div style={{ width: pct + '%', animationDelay: i * 60 + 'ms' }} />
                </div>
              </div>
              <div className="own-act">
                {price == null ? null : gone ? (
                  <button type="button" className="ulink" onClick={() => onRenew(o.productId)}>
                    ซื้ออีกครั้ง
                  </button>
                ) : (
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => onRenew(o.productId)}>
                    ต่ออายุ <span className="mono">{baht(price)}</span>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <span className="hist-hint">
        ซื้อซ้ำก่อนหมด เวลาจะต่อจากวันหมดเดิม ไม่เริ่มนับใหม่ · ก่อนหมด 1 วันจะมีแจ้งเตือนในเกม · หมดแล้วระบบดึงของคืนเอง
      </span>
    </>
  )
}

import { useEffect } from 'react'
import type { Order } from '../types'
import { bahtFull, dateNumber, mmss } from '../lib/format'
import { useNow } from '../hooks/useNow'
import { QrCard } from '../components/QrCard'
import { Button, IconButton } from '../components/Button'
import { Icon } from '../components/Icon'

type Props = {
  shopName: string
  order: Order
  characterName: string
  dev?: boolean
  onLater: () => void
  onCancel: () => void
  onRenew: () => void
  onEditCart: () => void
  onHome: () => void
  onHistory: () => void
  onInbox: () => void
  onClose: () => void
  onExpire: () => void
  onDevPaid?: () => void
  onDevPaidLater?: () => void
}

// หน้าจ่ายเงิน รวมตอนรอจ่าย จ่ายแล้ว และ QR หมดเวลา
export function Payment(props: Props) {
  const { order } = props

  return (
    <>
      <header className="shop-head">
        <h1 className="pay-title">ชำระเงิน</h1>
        <span className="pay-id mono">#{order.id}</span>
        <div className="page-tools">
          {props.dev && order.status === 'pending' && (
            <span className="dev-bar">
              จำลอง
              <button type="button" className="ulink" onClick={props.onDevPaid}>
                จ่ายแล้ว
              </button>
              <button type="button" className="ulink" onClick={props.onDevPaidLater}>
                จ่ายตอนปิดร้าน
              </button>
              <button type="button" className="ulink" onClick={props.onExpire}>
                หมดเวลา
              </button>
            </span>
          )}
        </div>
        <IconButton icon="close" label="ปิดร้าน" onClick={props.onClose} />
      </header>

      {order.status === 'pending' && <Pending {...props} />}
      {order.status === 'expired' && <Expired {...props} />}
      {order.status === 'paid' && <Done {...props} />}
    </>
  )
}

// รอจ่าย
function Pending({ shopName, order, onLater, onCancel, onExpire }: Props) {
  const now = useNow(1000)
  const left = order.expiresAt - now
  const span = order.expiresAt - order.createdAt
  const pct = Math.max(0, Math.min(1, left / span)) * 100
  const over = left <= 0

  useEffect(() => {
    if (over) onExpire()
  }, [over, onExpire])

  return (
    <div className="pay">
      <div className="pay-qr enter">
        <QrCard shopName={shopName} orderId={order.id} total={order.total} qr={order.qr} />
        <div className="pay-timer">
          QR หมดอายุใน
          <span className="mono">{mmss(left)}</span>
        </div>
        <div className="pay-bar">
          <div style={{ width: pct + '%' }} />
        </div>
      </div>

      <div className="pay-side enter" style={{ animationDelay: '90ms' }}>
        <div>
          <div className="pay-label">ยอดที่ต้องจ่าย</div>
          <div className="pay-amount mono">{bahtFull(order.total)}</div>
        </div>

        <div className="pay-status">
          <span className="pulse" />
          <span className="wait-dots">รอการชำระเงิน ระบบเช็คให้อัตโนมัติ</span>
        </div>

        <ol className="pay-steps">
          <li>
            <span className="mono">1</span>เปิดแอปธนาคารแล้วกดสแกน QR
          </li>
          <li>
            <span className="mono">2</span>
            <span>
              เช็คว่ายอดตรง <b>{bahtFull(order.total)}</b> แล้วกดยืนยัน
            </span>
          </li>
          <li>
            <span className="mono">3</span>
            {order.recipient ? `ของเข้ากล่องรับของของ ${order.recipient} เอง` : 'ของเข้าตัวละครเอง ไม่ต้องส่งสลิป'}
          </li>
        </ol>

        <div className="pay-actions">
          <Button onClick={onLater}>ปิดไว้ก่อน จ่ายทีหลัง</Button>
          <button type="button" className="ulink muted" onClick={onCancel}>
            ยกเลิกคำสั่งซื้อ
          </button>
        </div>
        <span className="pay-hint">ปิดหน้านี้ได้ ถ้าจ่ายก่อน QR หมดเวลา ของยังเข้าตามปกติ ดูสถานะได้ที่ประวัติการซื้อ</span>
      </div>
    </div>
  )
}

// QR หมดเวลา
function Expired({ shopName, order, onRenew, onEditCart }: Props) {
  return (
    <div className="pay">
      <div className="pay-qr">
        <QrCard shopName={shopName} orderId={order.id} total={order.total} qr={order.qr} expired />
        <div className="pay-timer off">
          QR หมดอายุใน
          <span className="mono">00:00</span>
        </div>
        <div className="pay-bar" />
      </div>

      <div className="pay-side enter">
        <div>
          <div className="pay-big">QR หมดเวลาแล้ว</div>
          <p className="pay-text">ยังไม่ได้ตัดเงิน ของในตะกร้ายังอยู่ครบ กดสร้าง QR ใหม่แล้วสแกนได้เลย</p>
        </div>
        <div className="pay-line">
          <span>ยอดที่ต้องจ่าย</span>
          <span className="mono">{bahtFull(order.total)}</span>
        </div>
        <div className="pay-renew">
          <Button variant="solid" size="lg" className="spin-btn" onClick={onRenew}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M20 12a8 8 0 1 1-2.3-5.6" />
              <path d="M20 4v4h-4" />
            </svg>
            สร้าง QR ใหม่
          </Button>
          <button type="button" className="ulink" onClick={onEditCart}>
            แก้ของในตะกร้า
          </button>
        </div>
        <span className="pay-hint">ถ้าจ่ายไปแล้วตอน QR ใกล้หมดเวลา รอสักครู่ ระบบจะเช็คยอดให้แล้วส่งของตามปกติ</span>
      </div>
    </div>
  )
}

// จ่ายเรียบร้อย
function Done({ order, characterName, onHome, onHistory, onInbox }: Props) {
  const inbox = (order.delivery ?? []).filter((d) => d.inbox > 0)

  return (
    <div className="done">
      <div className="done-main">
        <div className="done-head">
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden="true">
            <circle className="check-ring" cx="26" cy="26" r="24" strokeWidth="2.5" />
            <path className="check-mark" d="M16 27l7 7 14-15" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="enter" style={{ animationDelay: '200ms' }}>
            <div className="pay-big">จ่ายเรียบร้อย</div>
            <div className="pay-text">
              {order.recipient ? (
                <>
                  ส่งของให้ <b>{order.recipient}</b> แล้ว
                </>
              ) : (
                <>
                  ของเข้าตัวละคร <b>{characterName}</b> แล้ว
                </>
              )}
            </div>
          </div>
        </div>

        <div className="done-list">
          {(order.delivery ?? []).map((d, i) => (
            <div key={i} className="done-row enter" style={{ animationDelay: 280 + i * 80 + 'ms' }}>
              <div className="done-shot" />
              <div className="done-info">
                <b>{d.name}</b>
                <span>{d.where}</span>
              </div>
              <span className={d.inbox ? 'done-state wait' : 'done-state'}>
                <i />
                {d.inbox ? `รอรับ ${d.inbox}` : 'ได้แล้ว'}
              </span>
            </div>
          ))}
        </div>

        {inbox.length > 0 && (
          <div className="done-inbox enter" style={{ animationDelay: '520ms' }}>
            <span>ของบางชิ้นเข้ากระเป๋าไม่ได้เพราะกระเป๋าเต็ม เก็บไว้ในกล่องรับของแล้ว</span>
            <button type="button" className="gift-link" onClick={onInbox}>
              <Icon name="gift" size={18} stroke={1.8} />
              กล่องรับของ
            </button>
          </div>
        )}
      </div>

      <aside className="done-side enter" style={{ animationDelay: '300ms' }}>
        <div className="receipt">
          <span className="receipt-title">ใบเสร็จ</span>
          <div>
            <span>เลขคำสั่งซื้อ</span>
            <span className="mono">{order.id}</span>
          </div>
          <div>
            <span>เวลา</span>
            <span className="mono">{dateNumber(order.paidAt ?? Date.now())}</span>
          </div>
          <div>
            <span>ช่องทาง</span>
            <span className="mono">PromptPay</span>
          </div>
          {order.ref && (
            <div>
              <span>อ้างอิง</span>
              <span className="mono">{order.ref}</span>
            </div>
          )}
          {order.code && (
            <div>
              <span>ส่วนลด</span>
              <span className="mono">
                {order.code} −{bahtFull(order.off).replace('.00', '')}
              </span>
            </div>
          )}
          <div className="receipt-total">
            <span>ยอดที่จ่าย</span>
            <span className="mono">{bahtFull(order.total)}</span>
          </div>
        </div>
        <span className="pay-hint">ใบเสร็จดูย้อนหลังได้ที่ประวัติการซื้อ</span>
        <div className="done-actions">
          <Button variant="solid" size="lg" onClick={onHome}>
            หน้าแรก
          </Button>
          <button type="button" className="ulink" onClick={onHistory}>
            ประวัติการซื้อ
          </button>
        </div>
      </aside>
    </div>
  )
}

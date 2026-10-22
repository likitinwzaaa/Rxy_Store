import type { Order } from '../types'
import { baht, bahtFull, dateNumber } from '../lib/format'
import { statusLook } from '../lib/order'
import { Icon } from './Icon'

type Props = {
  order: Order
  onClose: () => void
}

// หน้าต่างรายละเอียดคำสั่งซื้อ
export function OrderModal({ order, onClose }: Props) {
  const look = statusLook(order.status)

  return (
    <div className="veil" onMouseDown={onClose}>
      <div className="modal od" role="dialog" aria-modal="true" aria-labelledby="od-title" onMouseDown={(e) => e.stopPropagation()}>
        <div className="od-head">
          <div>
            <h1 id="od-title" className="mono">
              #{order.id}
            </h1>
            <span className={'od-status ' + look.tone}>
              <i />
              {look.label}
            </span>
          </div>
          <button type="button" className="icon-btn" aria-label="ปิด" onClick={onClose}>
            <Icon name="close" size={16} />
          </button>
        </div>

        <div className="od-lines">
          {order.lines.map((l) => {
            const d = order.delivery?.find((x) => x.name.startsWith(l.name))
            return (
              <div key={l.id} className="od-line">
                <div>
                  <b>{l.qty > 1 ? `${l.name} ×${l.qty}` : l.name}</b>
                  {d && <span>{d.where}</span>}
                </div>
                <span className="mono">{baht(l.price * l.qty)}</span>
              </div>
            )
          })}
        </div>

        <div className="receipt od-receipt">
          <div>
            <span>สั่งเมื่อ</span>
            <span className="mono">{dateNumber(order.createdAt)}</span>
          </div>
          {order.paidAt && (
            <div>
              <span>จ่ายเมื่อ</span>
              <span className="mono">{dateNumber(order.paidAt)}</span>
            </div>
          )}
          {order.recipient && (
            <div>
              <span>ซื้อให้</span>
              <span>{order.recipient}</span>
            </div>
          )}
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
                {order.code} −{baht(order.off)}
              </span>
            </div>
          )}
          <div className="receipt-total">
            <span>{order.status === 'refunded' ? 'คืนเงินแล้ว' : 'ยอดรวม'}</span>
            <span className="mono">{bahtFull(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

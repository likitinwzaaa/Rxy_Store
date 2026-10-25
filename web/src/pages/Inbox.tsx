import type { InboxItem } from '../types'
import { PageHead } from '../components/PageHead'
import { Icon } from '../components/Icon'

type Props = {
  items: InboxItem[]
  onClaim: (item: InboxItem) => void
  onClaimAll: () => void
  onBack: () => void
  onClose: () => void
}

export function Inbox({ items, onClaim, onClaimAll, onBack, onClose }: Props) {
  const waiting = items.filter((i) => !i.claimedAt)
  const sorted = [...items].sort((a, b) => Number(!!a.claimedAt) - Number(!!b.claimedAt))

  return (
    <>
      <PageHead
        title="กล่องรับของ"
        sub={waiting.length ? `${waiting.length} รายการรอรับ` : undefined}
        onBack={onBack}
        onClose={onClose}
      >
        {waiting.length > 1 && (
          <button type="button" className="ulink claim-all" onClick={onClaimAll}>
            รับทั้งหมด
          </button>
        )}
      </PageHead>

      <div className="inbox">
        <p className="inbox-note">
          ของที่จ่ายแล้วแต่ส่งไม่ได้ กับของขวัญจากคนอื่น จะเก็บไว้ที่นี่ ไม่มีวันหมดอายุ กดรับแล้วของเข้าตัวละครที่เล่นอยู่
        </p>

        {items.length === 0 && <p className="hist-empty">กล่องรับของว่าง</p>}

        <div className="hist-list">
          {sorted.map((it, i) => (
            <div
              key={it.id}
              className={it.claimedAt ? 'inbox-row claimed' : 'inbox-row'}
              style={{ animationDelay: i * 60 + 'ms' }}
            >
              <div className="own-shot" />
              <div className="inbox-info">
                <b>{it.name}</b>
                {it.from ? (
                  <span className="inbox-gift">
                    <Icon name="gift" size={13} />
                    ของขวัญจาก <b>{it.from}</b>
                  </span>
                ) : (
                  <span className="inbox-order">
                    จากคำสั่งซื้อ <span className="mono">{it.orderId}</span>
                  </span>
                )}
              </div>
              <span className={it.blocked && !it.claimedAt ? 'inbox-why warn' : 'inbox-why'}>{it.reason}</span>
              {it.claimedAt ? (
                <span className="inbox-done">
                  <Icon name="check" size={14} stroke={2.4} />
                  รับแล้ว
                </span>
              ) : (
                <button type="button" className="btn btn-outline btn-md inbox-btn" onClick={() => onClaim(it)}>
                  รับ
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

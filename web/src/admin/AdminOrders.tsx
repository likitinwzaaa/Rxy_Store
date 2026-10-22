import { useEffect, useMemo, useState } from 'react'
import type { AdminOrder } from '../types'
import { baht, bahtFull, dateShort, dateTimeShort } from '../lib/format'
import { orderItems } from '../lib/order'
import { copyText } from '../lib/clipboard'
import { Icon } from '../components/Icon'
import { ConfirmDialog } from '../components/ConfirmDialog'

type Props = {
  orders: AdminOrder[]
  onChange: (list: AdminOrder[]) => void
  onToast: (msg: string) => void
}

type Filter = 'all' | 'pending' | 'done' | 'queued' | 'refunded' | 'expired'

const filters: { id: Filter; name: string }[] = [
  { id: 'all', name: 'ทั้งหมด' },
  { id: 'pending', name: 'รอชำระ' },
  { id: 'done', name: 'ส่งของแล้ว' },
  { id: 'queued', name: 'รอรับในกล่อง' },
  { id: 'refunded', name: 'คืนเงินแล้ว' },
  { id: 'expired', name: 'หมดเวลา' },
]

const reasons = ['ส่งของไม่ได้ / ระบบผิดพลาด', 'ผู้เล่นขอยกเลิก', 'จ่ายซ้ำ', 'อื่นๆ']

// สถานะที่แอดมินเห็น แยกจ่ายแล้วแต่ของยังค้างกล่องออกมา
function stateOf(o: AdminOrder): Filter {
  if (o.status === 'paid') return o.delivery?.some((d) => d.inbox > 0) ? 'queued' : 'done'
  return o.status
}

const look: Record<Exclude<Filter, 'all'>, { label: string; tone: string; pulse?: boolean }> = {
  pending: { label: 'รอชำระ', tone: 'muted', pulse: true },
  done: { label: 'ส่งของแล้ว', tone: 'ok' },
  queued: { label: 'รอรับในกล่อง', tone: 'accent', pulse: true },
  refunded: { label: 'คืนเงินแล้ว', tone: 'accent-2' },
  expired: { label: 'หมดเวลา', tone: 'off' },
}

const isToday = (ms: number) => new Date(ms).toDateString() === new Date().toDateString()
const isYesterday = (ms: number) => new Date(ms + 24 * 60 * 60 * 1000).toDateString() === new Date().toDateString()

// หน้าคำสั่งซื้อทั้งเซิร์ฟ
export function AdminOrders({ orders, onChange, onToast }: Props) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [viewId, setViewId] = useState<string | null>(null)
  const [refundId, setRefundId] = useState<string | null>(null)
  const [resendId, setResendId] = useState<string | null>(null)

  const stats = useMemo(() => {
    const paid = orders.filter((o) => o.paidAt && o.status !== 'refunded')
    const today = paid.filter((o) => isToday(o.paidAt!))
    const yesterday = paid.filter((o) => isYesterday(o.paidAt!))
    const sum = (list: AdminOrder[]) => list.reduce((n, o) => n + o.total, 0)
    const count: Record<string, number> = {}
    for (const o of paid) for (const l of o.lines) count[l.name] = (count[l.name] ?? 0) + l.qty
    const best = Object.entries(count).sort((a, b) => b[1] - a[1])[0]
    return [
      { label: 'ยอดขายวันนี้', value: baht(sum(today)), sub: `เมื่อวาน ${baht(sum(yesterday))}` },
      {
        label: 'จ่ายแล้ววันนี้',
        value: String(today.length),
        sub: `หมดเวลา ${orders.filter((o) => o.status === 'expired' && isToday(o.createdAt)).length}`,
      },
      {
        label: 'จ่ายแล้วแต่ยังไม่ได้ของ',
        value: String(orders.filter((o) => stateOf(o) === 'queued').length),
        sub: 'รอรับในกล่อง',
        warn: true,
      },
      { label: 'ขายดีสุด', value: best?.[0] ?? '-', sub: best ? `${best[1]} ชิ้น` : '' },
    ]
  }, [orders])

  const needle = q.trim().toLowerCase()
  const fields = (o: AdminOrder) => [o.buyer.name, o.id, orderItems(o)]
  const hits = needle ? orders.filter((o) => fields(o).some((f) => f.toLowerCase().includes(needle))) : []
  const shown = orders.filter((o) => (filter === 'all' || stateOf(o) === filter) && (!needle || hits.includes(o)))

  const view = orders.find((o) => o.id === viewId) ?? null
  const refund = orders.find((o) => o.id === refundId) ?? null
  const resend = orders.find((o) => o.id === resendId) ?? null

  function patch(id: string, fn: (o: AdminOrder) => AdminOrder) {
    onChange(orders.map((o) => (o.id === id ? fn(o) : o)))
  }

  function doResend(o: AdminOrder) {
    patch(o.id, (x) => ({
      ...x,
      delivery: x.delivery?.map((d) => ({ ...d, inbox: 0, where: 'ส่งซ้ำสำเร็จ' })),
      log: [...x.log, { at: Date.now(), text: 'ส่งของซ้ำ', by: 'แอดมิน', tone: 'ok' }],
    }))
    setResendId(null)
    onToast('ส่งของซ้ำแล้ว')
  }

  function doRefund(o: AdminOrder, reason: string, takeBack: boolean) {
    patch(o.id, (x) => ({
      ...x,
      status: 'refunded',
      log: [
        ...x.log,
        { at: Date.now(), text: `คืนเงิน ${bahtFull(x.total)}`, by: `แอดมิน · ${reason}`, tone: 'warn' },
        ...(takeBack ? [{ at: Date.now(), text: 'ดึงของคืนจากตัวละคร', by: 'ระบบ' }] : []),
      ],
    }))
    setRefundId(null)
    onToast('คืนเงินแล้ว')
  }

  return (
    <div className="adm-page">
      <div className="tiles">
        {stats.map((s, i) => (
          <div key={s.label} className="tile" style={{ animationDelay: i * 60 + 'ms' }}>
            <span>{s.label}</span>
            <b className={s.warn && s.value !== '0' ? 'mono warn' : 'mono'}>{s.value}</b>
            <span>{s.sub}</span>
          </div>
        ))}
      </div>

      <div className="adm-tools">
        <div className="search ord-search">
          <label className="search-field">
            <Icon name="search" size={14} />
            <input
              value={q}
              placeholder="เลขคำสั่งซื้อ ชื่อตัวละคร หรือสินค้า"
              aria-label="ค้นหาคำสั่งซื้อ"
              onChange={(e) => {
                setQ(e.target.value)
                setOpen(true)
              }}
              onBlur={() => setTimeout(() => setOpen(false), 120)}
            />
          </label>
          {open && needle && (
            <div className="search-drop" role="listbox">
              {hits.slice(0, 3).map((o) => {
                const label = fields(o).find((f) => f.toLowerCase().includes(needle))!
                const at = label.toLowerCase().indexOf(needle)
                return (
                  <div key={o.id} className="sug sug-2" role="option" aria-selected="false" onMouseDown={() => setViewId(o.id)}>
                    <span className="sug-name">
                      {label.slice(0, at)}
                      <b>{label.slice(at, at + needle.length)}</b>
                      {label.slice(at + needle.length)}
                    </span>
                    <span className="sug-sub mono">
                      {o.id} · {baht(o.total)}
                    </span>
                  </div>
                )
              })}
              {hits.length === 0 && <div className="sug-empty">ไม่เจอ "{q.trim()}"</div>}
            </div>
          )}
        </div>
        <select className="input ord-filter" aria-label="กรองสถานะ" value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
          {filters.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <span className="adm-hint ord-date">วันนี้ · {dateShort(Date.now())}</span>
      </div>

      <div className="orow orow-head">
        <span>เลขคำสั่งซื้อ</span>
        <span>ผู้ซื้อ</span>
        <span>สินค้า</span>
        <span className="right">ยอด</span>
        <span>สถานะ</span>
        <span />
      </div>

      <div className="adm-rows">
        {shown.map((o, i) => {
          const st = stateOf(o)
          const lk = look[st as Exclude<Filter, 'all'>]
          const paid = st === 'done' || st === 'queued'
          return (
            <div key={o.id} className="orow" style={{ animationDelay: Math.min(i, 10) * 40 + 'ms' }} onClick={() => setViewId(o.id)}>
              <span className="mono orow-id">{o.id}</span>
              <span className="orow-who">{o.buyer.name}</span>
              <span className="orow-items">{orderItems(o)}</span>
              <span className="right mono">{baht(o.total)}</span>
              <span className={'od-status ' + lk.tone}>
                <i className={lk.pulse ? 'pulse-dot' : undefined} />
                {lk.label}
              </span>
              <span className="orow-acts" onClick={(e) => e.stopPropagation()}>
                {paid && (
                  <>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setResendId(o.id)}>
                      ส่งซ้ำ
                    </button>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setRefundId(o.id)}>
                      คืนเงิน
                    </button>
                  </>
                )}
              </span>
            </div>
          )
        })}
        {shown.length === 0 && <p className="hist-empty">ไม่มีคำสั่งซื้อที่ตรงกับที่กรอง</p>}
      </div>

      {view && (
        <OrderDrawer
          order={view}
          state={stateOf(view)}
          onNote={(note) => {
            patch(view.id, (x) => ({ ...x, note }))
            onToast('บันทึกโน้ตแล้ว')
          }}
          onResend={() => setResendId(view.id)}
          onRefund={() => setRefundId(view.id)}
          onClose={() => setViewId(null)}
        />
      )}

      {resend && (
        <ConfirmDialog
          title={`ส่งของซ้ำให้ ${resend.recipient ?? resend.buyer.name}?`}
          desc="ระบบจะลองส่งของในคำสั่งซื้อนี้อีกรอบ ใช้ตอนของไม่เข้าเท่านั้น ถ้าของเข้าไปแล้วผู้เล่นจะได้ซ้ำ"
          confirmLabel="ส่งซ้ำ"
          onConfirm={() => doResend(resend)}
          onCancel={() => setResendId(null)}
        />
      )}

      {refund && <RefundDialog order={refund} onConfirm={doRefund} onCancel={() => setRefundId(null)} />}
    </div>
  )
}

type DrawerProps = {
  order: AdminOrder
  state: Filter
  onNote: (note: string) => void
  onResend: () => void
  onRefund: () => void
  onClose: () => void
}

// แผงรายละเอียดคำสั่งซื้อด้านขวา
function OrderDrawer({ order: o, state, onNote, onResend, onRefund, onClose }: DrawerProps) {
  const [note, setNote] = useState(o.note ?? '')
  const [copied, setCopied] = useState<string | null>(null)
  const lk = look[state as Exclude<Filter, 'all'>]
  const paid = state === 'done' || state === 'queued'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || document.querySelector('.confirm')) return
      e.stopImmediatePropagation()
      onClose()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  function copy(text: string) {
    copyText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 1400)
  }

  return (
    <div className="drawer-veil" onMouseDown={onClose}>
      <aside className="drawer" onMouseDown={(e) => e.stopPropagation()} aria-label={`คำสั่งซื้อ ${o.id}`}>
        <div className="drawer-head">
          <div>
            <h2 className="mono">#{o.id}</h2>
            <span className={'od-status ' + lk.tone}>
              <i className={lk.pulse ? 'pulse-dot' : undefined} />
              {lk.label}
            </span>
          </div>
          <button type="button" className="icon-btn" aria-label="ปิด" onClick={onClose}>
            <Icon name="close" size={16} />
          </button>
        </div>

        <div className="drawer-body">
          <div className="two">
            <div className="card-box">
              <span className="card-label">ผู้ซื้อ</span>
              <b>{o.buyer.name}</b>
              <span className="muted-text">{o.buyer.online ? `ออนไลน์ · ID ${o.buyer.id}` : 'ออฟไลน์'}</span>
              <button type="button" className="copy mono" onClick={() => copy(o.buyer.license)}>
                {o.buyer.license.slice(0, 12)}…{o.buyer.license.slice(-4)}
                <Icon name="copy" size={11} />
                {copied === o.buyer.license && <span className="copied">คัดลอกแล้ว</span>}
              </button>
            </div>
            <div className="card-box">
              <span className="card-label">การจ่ายเงิน</span>
              <b className="mono">{bahtFull(o.total)}</b>
              <span className="muted-text">
                PromptPay{o.code ? ` · ${o.code} −${baht(o.off)}` : ''}
              </span>
              {o.ref ? (
                <button type="button" className="copy mono" onClick={() => copy(o.ref!)}>
                  {o.ref}
                  <Icon name="copy" size={11} />
                  {copied === o.ref && <span className="copied">คัดลอกแล้ว</span>}
                </button>
              ) : (
                <span className="muted-text">ยังไม่จ่าย</span>
              )}
            </div>
          </div>

          {o.recipient && (
            <p className="notice">
              ซื้อให้ <b>{o.recipient}</b> ของเข้ากล่องรับของของคนรับ
            </p>
          )}

          <div className="drawer-sec">
            <span className="card-label">สินค้า</span>
            {o.lines.map((l, i) => {
              const d = o.delivery?.[i]
              return (
                <div key={l.id} className="od-line">
                  <div>
                    <b>{l.qty > 1 ? `${l.name} ×${l.qty}` : l.name}</b>
                    {d && <span className={d.inbox ? 'warn-text' : undefined}>{d.where}</span>}
                  </div>
                  <span className="mono">{baht(l.price * l.qty)}</span>
                </div>
              )
            })}
          </div>

          <div className="drawer-sec">
            <span className="card-label">ไทม์ไลน์</span>
            <ol className="timeline">
              {o.log.map((e, i) => (
                <li key={i} className={e.tone ?? ''}>
                  <span className="mono tl-time">{dateTimeShort(e.at).split(' ').pop()}</span>
                  <i />
                  <div>
                    <b>{e.text}</b>
                    <span>{e.by}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="field-group">
            <label htmlFor="od-note">โน้ตแอดมิน (ผู้เล่นไม่เห็น)</label>
            <textarea
              id="od-note"
              className="input area"
              rows={2}
              maxLength={300}
              value={note}
              placeholder="เช่น คุยกับผู้เล่นแล้ว รอเคลียร์กระเป๋า"
              onChange={(e) => setNote(e.target.value)}
              onBlur={() => note !== (o.note ?? '') && onNote(note)}
            />
          </div>
        </div>

        {paid && (
          <div className="drawer-foot">
            <button type="button" className="btn btn-outline btn-md" onClick={onResend}>
              ส่งของซ้ำ
            </button>
            <button type="button" className="ulink danger-link" onClick={onRefund}>
              คืนเงิน
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}

type RefundProps = {
  order: AdminOrder
  onConfirm: (o: AdminOrder, reason: string, takeBack: boolean) => void
  onCancel: () => void
}

// หน้าต่างยืนยันคืนเงิน ต้องพิมพ์เลขท้ายคำสั่งซื้อก่อน
function RefundDialog({ order, onConfirm, onCancel }: RefundProps) {
  const [reason, setReason] = useState(reasons[0])
  const [takeBack, setTakeBack] = useState(true)
  const [typed, setTyped] = useState('')
  const code = order.id.slice(-4)
  const ok = typed.trim() === code

  return (
    <ConfirmDialog
      danger
      title={
        <>
          คืนเงิน <span className="mono">{bahtFull(order.total)}</span> ให้ {order.buyer.name}?
        </>
      }
      desc="ระบบจะสั่งคืนเงินผ่าน Opn ไปที่บัญชีที่จ่ายมา ทำแล้วย้อนกลับไม่ได้"
      confirmLabel="คืนเงิน"
      disabled={!ok}
      onConfirm={() => onConfirm(order, reason, takeBack)}
      onCancel={onCancel}
    >
      <div className="field-group">
        <label htmlFor="rf-reason">
          เหตุผล <span className="req">*</span>
        </label>
        <select id="rf-reason" className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
          {reasons.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>

      <label className="check top">
        <input type="checkbox" checked={takeBack} onChange={(e) => setTakeBack(e.target.checked)} />
        <span>
          ดึงของที่ส่งไปแล้วคืนจากตัวละคร
          <small>{order.lines.map((l) => l.name).join(' · ')}</small>
        </span>
      </label>

      <div className="field-group">
        <label htmlFor="rf-confirm">
          พิมพ์ <b className="mono">{code}</b> เพื่อยืนยัน
        </label>
        <input
          id="rf-confirm"
          className={ok ? 'input mono center confirm-code ok' : 'input mono center confirm-code'}
          value={typed}
          placeholder={code}
          maxLength={4}
          onChange={(e) => setTyped(e.target.value)}
        />
      </div>
    </ConfirmDialog>
  )
}

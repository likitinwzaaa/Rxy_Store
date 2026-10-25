import { useState, type CSSProperties, type FormEvent } from 'react'
import type { AdminLoad, DiscountCode, Product } from '../types'
import { Icon } from '../components/Icon'
import { isHex, turn } from '../lib/theme'
import { dateShort } from '../lib/format'
import { CodeDialog } from './CodeDialog'
import type { Run } from './AdminApp'

type Props = {
  data: AdminLoad
  products: Product[]
  run: Run
  onToast: (msg: string, tone?: 'warn') => void
}

const primaries = ['#FF7A1A', '#FF4D6D', '#FFD23F', '#C6F432', '#3ECFB2', '#4C8DFF', '#B98CFF', '#FF6FD8']
const pairs = [180, 150, 210, 120, 240]

const hooks: { id: keyof AdminLoad['status']['webhooks']; name: string; note: string }[] = [
  { id: 'finance', name: 'การเงิน', note: 'จ่ายเงิน คืนเงิน ซื้อเยอะผิดปกติ ใช้โค้ด QR หมดเวลา' },
  { id: 'delivery', name: 'ส่งของ', note: 'ส่งไม่สำเร็จ ของหมดอายุ ดึงคืนไม่ได้' },
  { id: 'admin', name: 'แอดมิน', note: 'แอดมินแก้ร้าน รายการรอแอดมิน' },
  { id: 'daily', name: 'สรุปรายวัน', note: 'ยอดขายของแต่ละวัน' },
  { id: 'error', name: 'error', note: 'error ของระบบ' },
  { id: 'logbackup', name: 'backup log', note: 'ไฟล์ log ก่อนลบ' },
]

function offText(c: DiscountCode) {
  return c.kind === 'percent' ? `−${c.value}%` : `−฿${c.value.toLocaleString('en-US')}`
}

function usedText(c: DiscountCode) {
  if (c.perPlayer && c.limit === null) return `คนละครั้ง · ใช้ไป ${c.used}`
  const text = `ใช้แล้ว ${c.used} / ${c.limit ?? 'ไม่จำกัด'}`
  return c.perPlayer ? 'คนละครั้ง · ' + text : text
}

function untilText(c: DiscountCode, now: number) {
  if (c.enabled === false) return 'ปิดอยู่'
  if (c.limit !== null && c.used >= c.limit) return 'ใช้ครบแล้ว'
  if (c.endsAt && c.endsAt <= now) return 'หมดอายุแล้ว'
  if (c.startsAt && c.startsAt > now) return `เริ่ม ${dateShort(c.startsAt)}`
  if (c.endsAt) return `ถึง ${dateShort(c.endsAt)}`
  return 'ไม่หมดอายุ'
}

function Status({ on }: { on: boolean }) {
  return on ? (
    <span className="live">
      <i className="pulse-dot" />
      ตั้งแล้ว
    </span>
  ) : (
    <span className="missing">ยังไม่ได้ตั้ง</span>
  )
}

export function AdminSettings({ data, products, run, onToast }: Props) {
  const locked = data.settings.locked
  const [name, setName] = useState(data.settings.name)
  const [primary, setPrimary] = useState(data.settings.theme?.primary ?? '#FF7A1A')
  const [secondary, setSecondary] = useState<string | null>(data.settings.theme?.secondary ?? null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [p1Text, setP1Text] = useState<string | null>(null)
  const [p2Text, setP2Text] = useState<string | null>(null)
  const [editing, setEditing] = useState<DiscountCode | 'new' | null>(null)
  const [saving, setSaving] = useState(false)

  const now = Date.now()
  const suggested = turn(primary, 180)
  const p2 = secondary ?? suggested
  const status = data.status

  function hexInput(v: string, set: (hex: string) => void, keep: (t: string | null) => void) {
    let t = v.trim()
    if (t && t[0] !== '#') t = '#' + t
    if (isHex(t)) {
      set(t.toUpperCase())
      keep(null)
    } else {
      keep(v)
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (saving) return
    if (!locked.name && !name.trim()) {
      setErrors({ name: 'ต้องใส่ชื่อร้าน' })
      return
    }
    setSaving(true)
    const d = await run('admin:settings:save', { name: name.trim(), theme: { primary, secondary } })
    setSaving(false)
    if (!d) return
    if (d.errors) {
      setErrors(d.errors)
      return
    }
    setErrors({})
    onToast('บันทึกการตั้งค่าแล้ว')
  }

  return (
    <>
      <form id="shop-settings" className="set-page" onSubmit={submit} noValidate>
        <section className="set-col">
          <h2>ร้าน</h2>
          <div className="set-shop">
            <div className="field-group">
              <label htmlFor="s-name">
                ชื่อร้าน {locked.name && <span className="lock-tag">ตั้งใน config</span>}
              </label>
              <input
                id="s-name"
                className={errors.name ? 'input bad' : 'input'}
                value={name}
                maxLength={24}
                disabled={locked.name}
                onChange={(e) => setName(e.target.value)}
              />
              {errors.name && <span className="field-err">{errors.name}</span>}
            </div>
            <div className="field-group">
              <label htmlFor="s-key">
                ปุ่มเปิดร้าน <span className="lock-tag">ตั้งใน config</span>
              </label>
              <input id="s-key" className="input center mono" value={data.settings.openKey} disabled />
            </div>
          </div>

          <h2>ธีม {locked.theme && <span className="lock-tag">ตั้งใน config</span>}</h2>
          <fieldset className="plain" disabled={locked.theme}>
            <div className="field-group">
              <span className="set-label">สีหลัก · ราคา ป้ายลดราคา ตัวเลขบนตะกร้า</span>
              <div className="swatches">
                {primaries.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    className={hex === primary ? 'sw on' : 'sw'}
                    style={{ background: hex }}
                    aria-label={`สีหลัก ${hex}`}
                    onClick={() => {
                      setPrimary(hex)
                      setP1Text(null)
                    }}
                  />
                ))}
                <label className="hex-field">
                  <i style={{ background: primary }} />
                  <input
                    className="mono"
                    value={p1Text ?? primary}
                    maxLength={7}
                    aria-label="ใส่รหัสสีหลักเอง"
                    onChange={(e) => hexInput(e.target.value, setPrimary, setP1Text)}
                    onBlur={() => setP1Text(null)}
                  />
                </label>
              </div>
            </div>

            <div className="field-group">
              <div className="set-row">
                <span className="set-label">สีรอง · ป้ายสต็อก สถานะ ส่วนลด</span>
                {secondary && (
                  <button
                    type="button"
                    className="ulink muted small"
                    onClick={() => {
                      setSecondary(null)
                      setP2Text(null)
                    }}
                  >
                    กลับไปใช้สีแนะนำ
                  </button>
                )}
              </div>
              <div className="swatches pairs">
                {pairs.map((deg) => {
                  const hex = turn(primary, deg)
                  return (
                    <button
                      key={deg}
                      type="button"
                      className={hex === p2 ? 'sw on' : 'sw'}
                      style={{ background: hex }}
                      aria-label={(deg === 180 ? 'สีแนะนำ ' : 'สีคู่ ') + hex}
                      onClick={() => {
                        setSecondary(deg === 180 ? null : hex)
                        setP2Text(null)
                      }}
                    >
                      {deg === 180 && <span className="sw-tag">แนะนำ</span>}
                    </button>
                  )
                })}
                <label className="hex-field">
                  <i style={{ background: p2 }} />
                  <input
                    className="mono"
                    value={p2Text ?? p2}
                    maxLength={7}
                    aria-label="ใส่รหัสสีรองเอง"
                    onChange={(e) => hexInput(e.target.value, (hex) => setSecondary(hex === suggested ? null : hex), setP2Text)}
                    onBlur={() => setP2Text(null)}
                  />
                </label>
              </div>
            </div>
            {errors.theme && <span className="field-err">{errors.theme}</span>}
          </fieldset>

          <div className="theme-preview" style={{ '--p1': primary, '--p2': p2 } as CSSProperties}>
            <span className="set-label">ตัวอย่าง</span>
            <b className="mono">฿455</b>
            <span className="tp-tag one">ลด 30%</span>
            <span className="tp-tag two">เหลือ 12</span>
            <span className="tp-cart">
              <Icon name="cart" size={19} />
              <i className="mono">4</i>
            </span>
          </div>

          <div className="set-row set-gap">
            <h2>โค้ดส่วนลด</h2>
            <button type="button" className="btn btn-outline btn-sm pill" onClick={() => setEditing('new')}>
              <Icon name="plus" size={13} stroke={2.4} />
              เพิ่มโค้ด
            </button>
          </div>
          <div className="code-list">
            {data.codes.map((c, i) => {
              const until = untilText(c, now)
              const dim = c.enabled === false || until === 'หมดอายุแล้ว' || until === 'ใช้ครบแล้ว'
              return (
                <button
                  key={c.code}
                  type="button"
                  className={dim ? 'code-row dim' : 'code-row'}
                  style={{ animationDelay: i * 60 + 'ms' }}
                  onClick={() => setEditing(c)}
                >
                  <span className="mono">{c.code}</span>
                  <span className="mono code-off">{offText(c)}</span>
                  <span className="code-used">{usedText(c)}</span>
                  <b>{until}</b>
                </button>
              )
            })}
            {data.codes.length === 0 && <p className="box-note">ยังไม่มีโค้ด</p>}
          </div>
        </section>

        <section className="set-col">
          <div className="set-row">
            <h2>ช่องทางรับเงิน</h2>
            <span className="lock-tag">ตั้งใน config</span>
          </div>
          <div className="set-card">
            <div className="set-row">
              <span className="set-key">ช่องทาง</span>
              <Status on={false} />
            </div>
            <div className="set-row">
              <span className="set-key">Secret key</span>
              <Status on={false} />
            </div>
            <div className="set-row">
              <span className="set-key">QR หมดอายุ</span>
              <Status on={false} />
            </div>
            <div className="set-row">
              <span className="set-key">ยอดขั้นต่ำ</span>
              <Status on={false} />
            </div>
            <span className="box-note">ส่วนนี้จะใช้ได้ตอนต่อระบบจ่ายเงิน คีย์ตั้งใน server.cfg เท่านั้น หน้านี้โชว์ได้แค่สถานะ</span>
          </div>

          <div className="set-row set-gap">
            <h2>Discord</h2>
            <span className="lock-tag">ตั้งใน server.cfg</span>
          </div>
          <div className="set-card">
            <div className="set-row">
              <span className="set-key">บอท</span>
              <Status on={status.bot} />
            </div>
            <div className="set-row">
              <span className="set-key">เซิร์ฟ Discord (GuildId)</span>
              <Status on={status.guild} />
            </div>
            <div className="set-row">
              <span className="set-key">โหมด debug</span>
              <span>{status.debug ? 'debug' : 'off'}</span>
            </div>
          </div>

          <div className="log-list">
            {hooks.map((h) => (
              <div key={h.id} className="log-row">
                <span>
                  <b>webhook {h.name}</b>
                  <small>{h.note}</small>
                </span>
                <Status on={status.webhooks[h.id]} />
              </div>
            ))}
          </div>
        </section>
      </form>

      {editing && (
        <CodeDialog
          code={editing === 'new' ? null : editing}
          taken={data.codes.map((c) => c.code)}
          categories={data.categories}
          products={products}
          run={run}
          onDone={(msg) => {
            setEditing(null)
            onToast(msg)
          }}
          onCancel={() => setEditing(null)}
        />
      )}
    </>
  )
}

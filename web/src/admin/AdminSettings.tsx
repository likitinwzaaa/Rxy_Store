import { useState, type CSSProperties, type FormEvent } from 'react'
import type { DiscountCode, GatewayId, LogKind, ServerStatus, ShopSettings } from '../types'
import { Toggle } from '../components/Toggle'
import { Icon } from '../components/Icon'
import { isHex, turn } from '../lib/theme'
import { dateShort } from '../lib/format'
import { CodeDialog } from './CodeDialog'

type Props = {
  settings: ShopSettings
  codes: DiscountCode[]
  status: ServerStatus
  onSave: (next: ShopSettings) => void
  onCodes: (list: DiscountCode[]) => void
  onToast: (msg: string) => void
}

type Test = 'idle' | 'busy' | 'ok' | 'fail'

const primaries = ['#FF7A1A', '#FF4D6D', '#FFD23F', '#C6F432', '#3ECFB2', '#4C8DFF', '#B98CFF', '#FF6FD8']
const pairs = [180, 150, 210, 120, 240]

const gateways: { id: GatewayId; name: string; env: string }[] = [
  { id: 'opn', name: 'Opn Payments', env: 'shop_opn_secret "skey_live_..."' },
  { id: 'beam', name: 'Beam', env: 'shop_beam_secret "..."' },
]

const logs: { id: LogKind; name: string; note: string }[] = [
  { id: 'paid', name: 'มีคนจ่ายเงิน', note: 'ชื่อ ยอด ของที่ซื้อ ซื้อให้ใคร เลขคำสั่งซื้อ' },
  { id: 'fail', name: 'ส่งของไม่สำเร็จ', note: 'ของเข้ากล่องรับของแทน พร้อมเหตุผล' },
  { id: 'admin', name: 'แอดมินแก้ร้าน', note: 'ใครแก้อะไร ก่อนกับหลัง' },
  { id: 'daily', name: 'สรุปยอดรายวัน', note: 'ยอดขาย จำนวนคำสั่งซื้อ ของขายดี' },
  { id: 'refund', name: 'คืนเงิน', note: 'ใครกด เหตุผล ดึงของคืนหรือไม่' },
  { id: 'big', name: 'ซื้อเยอะผิดปกติ', note: 'ยอดเดียวเกินที่ตั้งไว้' },
  { id: 'expire', name: 'ของหมดอายุ', note: 'ดึงอะไรคืนจากใคร สำเร็จไหม' },
  { id: 'stock', name: 'ของใกล้หมด', note: 'เหลือไม่ถึง 10% ของสต็อก' },
  { id: 'code', name: 'มีคนใช้โค้ดส่วนลด', note: 'โค้ด ลดไปเท่าไหร่' },
  { id: 'expired', name: 'QR หมดเวลา / ยกเลิก', note: 'ไว้ดูว่าคนทิ้งตะกร้าบ่อยแค่ไหน' },
]

type Form = {
  name: string
  openKey: string
  primary: string
  secondary: string | null
  gateway: GatewayId
  qrMinutes: string
  minAmount: string
  logs: Record<LogKind, boolean>
  dailyAt: string
  bigOver: string
  debug: boolean
}

type Errors = Partial<Record<'name' | 'openKey' | 'gateway' | 'qrMinutes' | 'minAmount' | 'dailyAt' | 'bigOver', string>>

// แปลงค่าตั้งค่าเป็นค่าในฟอร์ม
function toForm(s: ShopSettings): Form {
  return {
    name: s.name,
    openKey: s.openKey,
    primary: s.theme.primary,
    secondary: s.theme.secondary,
    gateway: s.gateway,
    qrMinutes: String(s.qrMinutes),
    minAmount: String(s.minAmount),
    logs: { ...s.logs },
    dailyAt: s.dailyAt,
    bigOver: String(s.bigOver),
    debug: s.debug,
  }
}

// ตรวจค่าในฟอร์มตั้งค่า
function validate(f: Form, status: ServerStatus): Errors {
  const e: Errors = {}
  const num = (v: string) => (/^\d+$/.test(v.trim()) ? Number(v) : NaN)
  if (!f.name.trim()) e.name = 'ต้องใส่ชื่อร้าน'
  if (!/^(F([1-9]|1[0-2])|[A-Z0-9])$/.test(f.openKey)) e.openKey = 'ใช้ได้แค่ A-Z, 0-9 หรือ F1-F12'
  if (!status.keys[f.gateway]) e.gateway = 'ยังไม่ได้ใส่คีย์ของช่องทางนี้ใน server.cfg'
  const qr = num(f.qrMinutes)
  if (!(qr >= 5 && qr <= 60)) e.qrMinutes = '5 ถึง 60 นาที'
  const min = num(f.minAmount)
  if (!(min >= 20)) e.minAmount = 'PromptPay ขั้นต่ำ 20 บาท'
  if (f.logs.daily && !/^([01]\d|2[0-3]):[0-5]\d$/.test(f.dailyAt)) e.dailyAt = 'เวลาแบบ 23:59'
  if (f.logs.big && !(num(f.bigOver) > 0)) e.bigOver = 'ต้องใส่ยอด'
  return e
}

// ข้อความลดเท่าไหร่ของโค้ด
function offText(c: DiscountCode) {
  return c.kind === 'percent' ? `−${c.value}%` : `−฿${c.value.toLocaleString('en-US')}`
}

// ข้อความจำนวนที่ใช้ไปของโค้ด
function usedText(c: DiscountCode) {
  if (c.perPlayer && c.limit === null) return `คนละครั้ง · ใช้ไป ${c.used}`
  const text = `ใช้แล้ว ${c.used} / ${c.limit ?? 'ไม่จำกัด'}`
  return c.perPlayer ? 'คนละครั้ง · ' + text : text
}

// ข้อความช่วงเวลาของโค้ด
function untilText(c: DiscountCode, now: number) {
  if (c.enabled === false) return 'ปิดอยู่'
  if (c.limit !== null && c.used >= c.limit) return 'ใช้ครบแล้ว'
  if (c.endsAt && c.endsAt <= now) return 'หมดอายุแล้ว'
  if (c.startsAt && c.startsAt > now) return `เริ่ม ${dateShort(c.startsAt)}`
  if (c.endsAt) return `ถึง ${dateShort(c.endsAt)}`
  return 'ไม่หมดอายุ'
}

// หน้าตั้งค่าร้าน
export function AdminSettings({ settings, codes, status, onSave, onCodes, onToast }: Props) {
  const [form, setForm] = useState<Form>(() => toForm(settings))
  const [errors, setErrors] = useState<Errors>({})
  const [p1Text, setP1Text] = useState<string | null>(null)
  const [p2Text, setP2Text] = useState<string | null>(null)
  const [payTest, setPayTest] = useState<Test>('idle')
  const [hookTest, setHookTest] = useState<Test>('idle')
  const [editing, setEditing] = useState<DiscountCode | 'new' | null>(null)

  const now = Date.now()
  const suggested = turn(form.primary, 180)
  const p2 = form.secondary ?? suggested
  const key = status.keys[form.gateway]
  const gw = gateways.find((g) => g.id === form.gateway)!

  function update(patch: Partial<Form>) {
    const next = { ...form, ...patch }
    setForm(next)
    if (Object.keys(errors).length) setErrors(validate(next, status))
  }

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

  function runTest(set: (t: Test) => void, ok: boolean) {
    set('busy')
    setTimeout(() => set(ok ? 'ok' : 'fail'), 900)
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const errs = validate(form, status)
    setErrors(errs)
    if (Object.keys(errs).length) {
      onToast('ยังบันทึกไม่ได้ เช็คช่องที่เป็นสีแดง')
      return
    }
    onSave({
      name: form.name.trim(),
      openKey: form.openKey,
      theme: { primary: form.primary, secondary: form.secondary },
      gateway: form.gateway,
      qrMinutes: Number(form.qrMinutes),
      minAmount: Number(form.minAmount),
      logs: form.logs,
      dailyAt: form.dailyAt,
      bigOver: Number(form.bigOver),
      debug: form.debug,
    })
    onToast('บันทึกการตั้งค่าแล้ว')
  }

  function saveCode(c: DiscountCode, old: string | null) {
    onCodes(old ? codes.map((x) => (x.code === old ? c : x)) : [...codes, c])
    setEditing(null)
    onToast(old ? `บันทึกโค้ด ${c.code} แล้ว` : `เพิ่มโค้ด ${c.code} แล้ว`)
  }

  function removeCode(code: string) {
    onCodes(codes.filter((x) => x.code !== code))
    setEditing(null)
    onToast(`ลบโค้ด ${code} แล้ว`)
  }

  const bad = (k: keyof Errors) => (errors[k] ? 'input bad' : 'input')

  return (
    <>
      <form id="shop-settings" className="set-page" onSubmit={submit} noValidate>
        <section className="set-col">
          <h2>ร้าน</h2>
          <div className="set-shop">
            <div className="field-group">
              <label htmlFor="s-name">ชื่อร้าน</label>
              <input
                id="s-name"
                className={bad('name')}
                value={form.name}
                maxLength={24}
                onChange={(e) => update({ name: e.target.value })}
              />
              {errors.name && <span className="field-err">{errors.name}</span>}
            </div>
            <div className="field-group">
              <label htmlFor="s-key">ปุ่มเปิดร้าน</label>
              <input
                id="s-key"
                className={bad('openKey') + ' center mono'}
                value={form.openKey}
                maxLength={3}
                onChange={(e) => update({ openKey: e.target.value.toUpperCase().replace(/\s/g, '') })}
              />
            </div>
          </div>
          {errors.openKey ? (
            <span className="field-err">{errors.openKey}</span>
          ) : (
            form.openKey !== settings.openKey && (
              <span className="box-note">คนที่เคยเข้าเซิร์ฟแล้วต้องเปลี่ยนปุ่มเองใน ตั้งค่า &gt; คีย์ลัด &gt; FiveM</span>
            )
          )}

          <h2>ธีม</h2>
          <div className="field-group">
            <span className="set-label">สีหลัก · ราคา ป้ายลดราคา ตัวเลขบนตะกร้า</span>
            <div className="swatches">
              {primaries.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  className={hex === form.primary ? 'sw on' : 'sw'}
                  style={{ background: hex }}
                  aria-label={`สีหลัก ${hex}`}
                  onClick={() => {
                    update({ primary: hex })
                    setP1Text(null)
                  }}
                />
              ))}
              <label className="hex-field">
                <i style={{ background: form.primary }} />
                <input
                  className="mono"
                  value={p1Text ?? form.primary}
                  maxLength={7}
                  aria-label="ใส่รหัสสีหลักเอง"
                  onChange={(e) => hexInput(e.target.value, (hex) => update({ primary: hex }), setP1Text)}
                  onBlur={() => setP1Text(null)}
                />
              </label>
            </div>
          </div>

          <div className="field-group">
            <div className="set-row">
              <span className="set-label">สีรอง · ป้ายสต็อก สถานะ ส่วนลด</span>
              {form.secondary && (
                <button
                  type="button"
                  className="ulink muted small"
                  onClick={() => {
                    update({ secondary: null })
                    setP2Text(null)
                  }}
                >
                  กลับไปใช้สีแนะนำ
                </button>
              )}
            </div>
            <div className="swatches pairs">
              {pairs.map((deg) => {
                const hex = turn(form.primary, deg)
                return (
                  <button
                    key={deg}
                    type="button"
                    className={hex === p2 ? 'sw on' : 'sw'}
                    style={{ background: hex }}
                    aria-label={(deg === 180 ? 'สีแนะนำ ' : 'สีคู่ ') + hex}
                    onClick={() => {
                      update({ secondary: deg === 180 ? null : hex })
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
                  onChange={(e) =>
                    hexInput(e.target.value, (hex) => update({ secondary: hex === suggested ? null : hex }), setP2Text)
                  }
                  onBlur={() => setP2Text(null)}
                />
              </label>
            </div>
          </div>

          <div className="theme-preview" style={{ '--p1': form.primary, '--p2': p2 } as CSSProperties}>
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
            {codes.map((c, i) => {
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
            {codes.length === 0 && <p className="box-note">ยังไม่มีโค้ด</p>}
          </div>
        </section>

        <section className="set-col">
          <h2>ช่องทางรับเงิน</h2>
          <div className="gw-list" role="radiogroup" aria-label="ช่องทางรับเงิน">
            {gateways.map((g) => (
              <label key={g.id} className={form.gateway === g.id ? 'gw on' : 'gw'}>
                <input
                  type="radio"
                  name="gateway"
                  checked={form.gateway === g.id}
                  onChange={() => {
                    update({ gateway: g.id })
                    setPayTest('idle')
                  }}
                />
                <span>
                  <b>{g.name}</b>
                  <small>PromptPay QR · ตรวจยอดอัตโนมัติ</small>
                </span>
                {!status.keys[g.id] && <em>ยังไม่ตั้งคีย์</em>}
              </label>
            ))}
          </div>

          <div className="set-card">
            <div className="set-row">
              <span className="set-key">Secret key</span>
              {key ? (
                <span className="live">
                  <i className="pulse-dot" />
                  <span className="mono">{key}</span>
                </span>
              ) : (
                <span className="missing">ยังไม่ได้ตั้ง</span>
              )}
            </div>
            <div className="set-row">
              <span className="set-key">ทดสอบการเชื่อมต่อ</span>
              <TestButton state={payTest} disabled={!key} onClick={() => runTest(setPayTest, true)} />
            </div>
            {errors.gateway && <span className="field-err">{errors.gateway}</span>}
            <span className="box-note">คีย์ตั้งใน server.cfg เท่านั้น หน้านี้โชว์ได้แค่สถานะ</span>
            <code>set {gw.env}</code>
          </div>

          <div className="two">
            <div className="field-group">
              <label htmlFor="s-qr">QR หมดอายุ (นาที)</label>
              <input
                id="s-qr"
                className={bad('qrMinutes') + ' center mono'}
                inputMode="numeric"
                value={form.qrMinutes}
                onChange={(e) => update({ qrMinutes: e.target.value.replace(/\D/g, '').slice(0, 2) })}
              />
              {errors.qrMinutes && <span className="field-err">{errors.qrMinutes}</span>}
            </div>
            <div className="field-group">
              <label htmlFor="s-min">ยอดขั้นต่ำ (บาท)</label>
              <input
                id="s-min"
                className={bad('minAmount') + ' center mono'}
                inputMode="numeric"
                value={form.minAmount}
                onChange={(e) => update({ minAmount: e.target.value.replace(/\D/g, '').slice(0, 5) })}
              />
              {errors.minAmount && <span className="field-err">{errors.minAmount}</span>}
            </div>
          </div>

          <h2>Discord log</h2>
          <div className="set-card">
            <div className="set-row">
              <span className="set-key">Webhook</span>
              {status.webhook ? (
                <span className="live">
                  <i className="pulse-dot" />
                  เชื่อมแล้ว · {status.webhook}
                </span>
              ) : (
                <span className="missing">ยังไม่ได้ตั้ง</span>
              )}
            </div>
            <div className="set-row">
              <span className="set-key">ส่งข้อความทดสอบ</span>
              <TestButton state={hookTest} disabled={!status.webhook} onClick={() => runTest(setHookTest, true)} />
            </div>
            <code>set shop_discord_webhook "https://discord.com/api/webhooks/..."</code>
          </div>

          <div className="log-list">
            {logs.map((l) => (
              <div key={l.id} className="log-row">
                <span>
                  <b>{l.name}</b>
                  <small>{l.note}</small>
                </span>
                {l.id === 'daily' && form.logs.daily && (
                  <input
                    className={bad('dailyAt') + ' mono tiny'}
                    value={form.dailyAt}
                    maxLength={5}
                    aria-label="เวลาส่งสรุปยอด"
                    onChange={(e) => update({ dailyAt: e.target.value })}
                  />
                )}
                {l.id === 'big' && form.logs.big && (
                  <span className="over">
                    เกิน ฿
                    <input
                      className={bad('bigOver') + ' mono tiny'}
                      inputMode="numeric"
                      value={form.bigOver}
                      aria-label="ยอดที่ถือว่าซื้อเยอะผิดปกติ"
                      onChange={(e) => update({ bigOver: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    />
                  </span>
                )}
                <Toggle
                  on={form.logs[l.id]}
                  label={`ส่ง log ${l.name}`}
                  onChange={(v) => update({ logs: { ...form.logs, [l.id]: v } })}
                />
              </div>
            ))}
          </div>

          <div className="field-group">
            <span className="set-label">โหมด debug</span>
            <div className="seg" role="radiogroup" aria-label="โหมด debug">
              <button
                type="button"
                role="radio"
                aria-checked={!form.debug}
                className={form.debug ? '' : 'on'}
                onClick={() => update({ debug: false })}
              >
                off
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={form.debug}
                className={form.debug ? 'on' : ''}
                onClick={() => update({ debug: true })}
              >
                debug
              </button>
            </div>
            <span className="box-note">
              {form.debug
                ? 'ส่ง error ทุกอย่างเข้า Discord และพิมพ์ลง console ด้วย เปิดไว้ตอนหาบั๊กแล้วปิด'
                : 'ไม่ส่ง error เข้า Discord ใช้ตอนเปิดร้านจริง'}
            </span>
          </div>
        </section>
      </form>

      {editing && (
        <CodeDialog
          code={editing === 'new' ? null : editing}
          taken={codes.map((c) => c.code)}
          onSave={saveCode}
          onDelete={removeCode}
          onCancel={() => setEditing(null)}
        />
      )}
    </>
  )
}

type TestProps = { state: Test; disabled: boolean; onClick: () => void }

// ปุ่มทดสอบพร้อมผลลัพธ์
function TestButton({ state, disabled, onClick }: TestProps) {
  return (
    <span className="test">
      {state === 'ok' && <span className="test-ok">ผ่าน</span>}
      {state === 'fail' && <span className="test-fail">ไม่ผ่าน</span>}
      <button
        type="button"
        className="btn btn-outline btn-sm pill"
        disabled={disabled || state === 'busy'}
        onClick={onClick}
      >
        {state === 'busy' ? 'กำลังทดสอบ' : 'ทดสอบ'}
      </button>
    </span>
  )
}

import { useState, type DragEvent, type SyntheticEvent } from 'react'
import type { Banner, BannerLink, Category, Product } from '../types'
import { Toggle } from '../components/Toggle'
import { Icon } from '../components/Icon'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { safeImage } from '../lib/product'
import { dateShort } from '../lib/format'
import { bannerLook, bannerState, fromLocalInput, toLocalInput } from '../lib/banner'

type Props = {
  banners: Banner[]
  seconds: number
  products: Product[]
  categories: Category[]
  onChange: (list: Banner[]) => void
  onSeconds: (n: number) => void
  onSaved: (msg: string) => void
}

type Form = {
  image: string
  label: string
  kind: BannerLink['kind']
  target: string
  start: string
  end: string
}

type Errors = Partial<Record<'image' | 'label' | 'target' | 'end', string>>

// แปลงแบนเนอร์เป็นค่าในฟอร์ม
function toForm(b: Banner | null): Form {
  return {
    image: b?.image ?? '',
    label: b?.label ?? '',
    kind: b?.link.kind ?? 'none',
    target: b && b.link.kind !== 'none' ? b.link.id : '',
    start: toLocalInput(b?.startsAt),
    end: toLocalInput(b?.endsAt),
  }
}

// ตรวจค่าในฟอร์มแบนเนอร์
function validate(f: Form): Errors {
  const e: Errors = {}
  const img = f.image.trim()
  if (!img) e.image = 'ต้องใส่ลิงก์รูป'
  else if (!/^https:\/\/[^\s"'()<>]+$/i.test(img)) e.image = 'ลิงก์รูปต้องขึ้นต้นด้วย https://'
  if (!f.label.trim()) e.label = 'ต้องใส่ชื่อ'
  if (f.kind !== 'none' && !f.target) e.target = f.kind === 'product' ? 'เลือกสินค้า' : 'เลือกหมวด'
  const start = fromLocalInput(f.start)
  const end = fromLocalInput(f.end)
  if (start && end && end <= start) e.end = 'เวลาจบต้องหลังเวลาเริ่ม'
  return e
}

// ข้อความช่วงเวลาที่โชว์
function when(b: Banner) {
  if (b.startsAt && b.endsAt) return `${dateShort(b.startsAt)} – ${dateShort(b.endsAt)}`
  if (b.startsAt) return `เริ่ม ${dateShort(b.startsAt)}`
  if (b.endsAt) return `ถึง ${dateShort(b.endsAt)}`
  return 'ตลอด'
}

// ซ่อนรูปที่โหลดไม่ขึ้น
function hideBroken(e: SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.visibility = 'hidden'
}

// หน้าจัดการแบนเนอร์หน้าร้าน
export function AdminBanners({ banners, seconds, products, categories, onChange, onSeconds, onSaved }: Props) {
  const [selected, setSelected] = useState<string | null>(banners[0]?.id ?? null)
  const [form, setForm] = useState<Form>(() => toForm(banners[0] ?? null))
  const [errors, setErrors] = useState<Errors>({})
  const [dragId, setDragId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [sec, setSec] = useState(String(seconds))

  const now = Date.now()
  const preview = safeImage(form.image.trim())

  function linkText(l: BannerLink) {
    if (l.kind === 'category') return 'ไปหมวด ' + (categories.find((c) => c.id === l.id)?.name ?? l.id)
    if (l.kind === 'product') return 'เปิด ' + (products.find((p) => p.id === l.id)?.name ?? l.id)
    return 'ไม่มีลิงก์'
  }

  function update(patch: Partial<Form>) {
    const next = { ...form, ...patch }
    setForm(next)
    if (Object.keys(errors).length) setErrors(validate(next))
  }

  function pick(b: Banner) {
    setSelected(b.id)
    setForm(toForm(b))
    setErrors({})
  }

  function addNew() {
    setSelected(null)
    setForm(toForm(null))
    setErrors({})
  }

  function save() {
    const e = validate(form)
    setErrors(e)
    if (Object.keys(e).length) return
    const old = banners.find((b) => b.id === selected)
    let id = old?.id
    if (!id) {
      let n = banners.length + 1
      while (banners.some((b) => b.id === 'b' + n)) n++
      id = 'b' + n
    }
    const link: BannerLink = form.kind === 'none' ? { kind: 'none' } : { kind: form.kind, id: form.target }
    const saved: Banner = {
      id,
      image: form.image.trim(),
      label: form.label.trim(),
      link,
      startsAt: fromLocalInput(form.start),
      endsAt: fromLocalInput(form.end),
      enabled: old?.enabled ?? true,
    }
    onChange(old ? banners.map((b) => (b.id === old.id ? saved : b)) : [...banners, saved])
    setSelected(saved.id)
    onSaved(old ? 'บันทึกแบนเนอร์แล้ว' : 'เพิ่มแบนเนอร์แล้ว')
  }

  function remove() {
    onChange(banners.filter((b) => b.id !== selected))
    setConfirmDelete(false)
    onSaved('ลบแบนเนอร์แล้ว')
    addNew()
  }

  function commitSeconds() {
    const n = Math.min(30, Math.max(2, Math.round(Number(sec)) || seconds))
    setSec(String(n))
    if (n !== seconds) {
      onSeconds(n)
      onSaved(`เปลี่ยนรูปทุก ${n} วินาที`)
    }
  }

  function onDrop(e: DragEvent, target: string) {
    e.preventDefault()
    if (!dragId || dragId === target) return
    const next = banners.filter((b) => b.id !== dragId)
    next.splice(
      next.findIndex((b) => b.id === target),
      0,
      banners.find((b) => b.id === dragId)!,
    )
    onChange(next)
    setDragId(null)
  }

  const bad = (k: keyof Errors) => (errors[k] ? 'input bad' : 'input')

  return (
    <div className="adm-split">
      <section className="adm-list">
        <div className="adm-tools">
          <span className="adm-hint">ลากเพื่อเรียงลำดับ</span>
          <label className="ban-sec">
            เปลี่ยนรูปทุก
            <input
              className="input center mono"
              inputMode="numeric"
              value={sec}
              onChange={(e) => setSec(e.target.value.replace(/\D/g, '').slice(0, 2))}
              onBlur={commitSeconds}
              onKeyDown={(e) => e.key === 'Enter' && commitSeconds()}
            />
            วินาที
          </label>
          <button type="button" className="ulink adm-add" onClick={addNew}>
            <Icon name="plus" size={14} stroke={2.4} />
            เพิ่มแบนเนอร์
          </button>
        </div>

        <div className="adm-rows">
          {banners.map((b, i) => {
            const state = bannerState(b, now)
            const look = bannerLook(state)
            const img = safeImage(b.image)
            return (
              <div
                key={b.id}
                className={'brow' + (b.id === selected ? ' on' : '') + (state === 'live' ? '' : ' dim') + (b.id === dragId ? ' dragging' : '')}
                style={{ animationDelay: i * 40 + 'ms' }}
                draggable
                onDragStart={() => setDragId(b.id)}
                onDragEnd={() => setDragId(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDrop(e, b.id)}
                onClick={() => pick(b)}
              >
                <svg className="grip" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="9" cy="6" r="1.6" />
                  <circle cx="15" cy="6" r="1.6" />
                  <circle cx="9" cy="12" r="1.6" />
                  <circle cx="15" cy="12" r="1.6" />
                  <circle cx="9" cy="18" r="1.6" />
                  <circle cx="15" cy="18" r="1.6" />
                </svg>
                <span className="brow-thumb">{img ? <img src={img} alt="" draggable={false} onError={hideBroken} /> : b.label}</span>
                <span className="brow-text">
                  <b>{b.label}</b>
                  <small>
                    {linkText(b.link)} · {when(b)}
                  </small>
                </span>
                <span className={'od-status ' + look.tone}>
                  <i />
                  {look.label}
                </span>
                <span onClick={(e) => e.stopPropagation()}>
                  <Toggle
                    on={b.enabled !== false}
                    label={`เปิดแบนเนอร์ ${b.label}`}
                    onChange={(v) => onChange(banners.map((x) => (x.id === b.id ? { ...x, enabled: v } : x)))}
                  />
                </span>
              </div>
            )
          })}
          {banners.length === 0 && <p className="hist-empty">ยังไม่มีแบนเนอร์</p>}
        </div>

        <span className="box-note">หน้าร้านโชว์เฉพาะแบนเนอร์ที่เปิดอยู่และอยู่ในช่วงเวลา ถ้าไม่มีเลยแถบแบนเนอร์จะซ่อนไป</span>
      </section>

      <aside className="adm-form ban-form" key={selected ?? 'new'}>
        <div className="adm-form-body">
          <div className="adm-form-head">
            <h2>{selected ? 'แก้ไขแบนเนอร์' : 'เพิ่มแบนเนอร์'}</h2>
            {selected && <span className="mono">id: {selected}</span>}
          </div>

          <div className="ban-preview">{preview ? <img src={preview} alt="" onError={hideBroken} /> : <span>{form.label || 'ตัวอย่าง'}</span>}</div>

          <div className="field-group">
            <label htmlFor="b-img">
              ลิงก์รูป <span className="req">*</span>
            </label>
            <input
              id="b-img"
              className={bad('image') + ' mono'}
              value={form.image}
              placeholder="https://..."
              onChange={(e) => update({ image: e.target.value })}
            />
            {errors.image ? (
              <span className="field-err">{errors.image}</span>
            ) : (
              <span className="box-note">แนะนำ 1744×264 px · PNG, JPG, WebP</span>
            )}
          </div>

          <div className="field-group">
            <label htmlFor="b-name">
              ชื่อ <span className="req">*</span>
            </label>
            <input
              id="b-name"
              className={bad('label')}
              value={form.label}
              maxLength={40}
              onChange={(e) => update({ label: e.target.value })}
            />
            {errors.label ? (
              <span className="field-err">{errors.label}</span>
            ) : (
              <span className="box-note">แอดมินเห็นคนเดียว ผู้เล่นเห็นแค่รูป</span>
            )}
          </div>

          <div className="field-group">
            <label htmlFor="b-link">กดแล้ว</label>
            <div className="two">
              <select
                id="b-link"
                className="input"
                value={form.kind}
                onChange={(e) => update({ kind: e.target.value as Form['kind'], target: '' })}
              >
                <option value="none">ไม่มีลิงก์</option>
                <option value="category">ไปที่หมวด</option>
                <option value="product">เปิดสินค้า</option>
              </select>
              <select
                className={bad('target')}
                value={form.target}
                disabled={form.kind === 'none'}
                aria-label="ปลายทาง"
                onChange={(e) => update({ target: e.target.value })}
              >
                <option value="">{form.kind === 'none' ? '-' : 'เลือก...'}</option>
                {form.kind === 'category' &&
                  categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                {form.kind === 'product' &&
                  products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>
            {errors.target && <span className="field-err">{errors.target}</span>}
          </div>

          <div className="two">
            <div className="field-group">
              <label htmlFor="b-start">
                เริ่ม <span className="opt">ไม่บังคับ</span>
              </label>
              <input
                id="b-start"
                type="datetime-local"
                className="input mono"
                value={form.start}
                onChange={(e) => update({ start: e.target.value })}
              />
            </div>
            <div className="field-group">
              <label htmlFor="b-end">
                จบ <span className="opt">ไม่บังคับ</span>
              </label>
              <input
                id="b-end"
                type="datetime-local"
                className={bad('end') + ' mono'}
                value={form.end}
                onChange={(e) => update({ end: e.target.value })}
              />
            </div>
          </div>
          {errors.end && <span className="field-err">{errors.end}</span>}
        </div>

        <div className="adm-form-foot">
          {selected && (
            <button type="button" className="trash big" aria-label="ลบแบนเนอร์นี้" onClick={() => setConfirmDelete(true)}>
              <Icon name="trash" size={17} stroke={1.9} />
            </button>
          )}
          <span className="form-msg">{Object.keys(errors).length ? 'ยังกรอกไม่ครบ' : ''}</span>
          <button type="button" className="btn btn-solid btn-md save-btn" onClick={save}>
            บันทึก
          </button>
        </div>
      </aside>

      {confirmDelete && (
        <ConfirmDialog
          danger
          title={`ลบแบนเนอร์ ${form.label}?`}
          desc="แบนเนอร์จะหายจากหน้าร้านทันที ย้อนกลับไม่ได้"
          confirmLabel="ลบแบนเนอร์"
          onConfirm={remove}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}

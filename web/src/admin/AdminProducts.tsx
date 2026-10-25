import { useState, type DragEvent } from 'react'
import type { Category, Product } from '../types'
import { baht } from '../lib/format'
import { Toggle } from '../components/Toggle'
import { Icon } from '../components/Icon'
import { DateTimeField } from '../components/DateTimeField'
import { ConfirmDialog } from '../components/ConfirmDialog'
import {
  canExpire,
  emptyForm,
  fromForm,
  rewardKinds,
  toForm,
  validate,
  type FormErrors,
  type ProductForm,
  type RewardRow,
} from './productForm'

type Props = {
  products: Product[]
  categories: Category[]
  onChange: (list: Product[]) => void
  onSaved: (msg: string) => void
}

// หน้าจัดการสินค้า
export function AdminProducts({ products, categories, onChange, onSaved }: Props) {
  const [cat, setCat] = useState('all')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string | null>(products[0]?.id ?? null)
  const [form, setForm] = useState<ProductForm>(() => (products[0] ? toForm(products[0]) : emptyForm(categories[0]?.id ?? '')))
  const [errors, setErrors] = useState<FormErrors>({})
  const [tried, setTried] = useState(false)
  const [shake, setShake] = useState(0)
  const [dragId, setDragId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? '-'
  const list = cat === 'all' ? products : products.filter((p) => p.category === cat)
  const needle = q.trim().toLowerCase()
  const hits = needle ? products.filter((p) => p.name.toLowerCase().includes(needle)) : []
  const errCount = Object.keys(errors).length

  function pick(p: Product) {
    setSelected(p.id)
    setForm(toForm(p))
    setErrors({})
    setTried(false)
  }

  function addNew() {
    setSelected(null)
    setForm(emptyForm(cat !== 'all' ? cat : categories[0]?.id ?? ''))
    setErrors({})
    setTried(false)
  }

  function update(patch: Partial<ProductForm>) {
    const next = { ...form, ...patch }
    setForm(next)
    if (tried) setErrors(validate(next))
  }

  function updateRow(i: number, patch: Partial<RewardRow>) {
    update({ rewards: form.rewards.map((r, j) => (j === i ? { ...r, ...patch } : r)) })
  }

  function save() {
    const e = validate(form)
    setTried(true)
    setErrors(e)
    if (Object.keys(e).length) {
      setShake((n) => n + 1)
      setTimeout(() => document.querySelector('.adm-form .bad, .adm-form .bad-box')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 0)
      return
    }
    const old = products.find((p) => p.id === selected) ?? null
    const saved = fromForm(
      form,
      old,
      products.map((p) => p.id),
    )
    onChange(old ? products.map((p) => (p.id === old.id ? saved : p)) : [...products, saved])
    setSelected(saved.id)
    setForm(toForm(saved))
    onSaved(old ? 'บันทึกแล้ว' : 'เพิ่มสินค้าแล้ว')
  }

  function remove() {
    onChange(products.filter((p) => p.id !== selected))
    setConfirmDelete(false)
    onSaved('ลบสินค้าแล้ว')
    addNew()
  }

  function toggle(p: Product, on: boolean) {
    onChange(products.map((x) => (x.id === p.id ? { ...x, enabled: on } : x)))
  }

  function onDrop(e: DragEvent, target: string) {
    e.preventDefault()
    if (!dragId || dragId === target) return
    const next = products.filter((p) => p.id !== dragId)
    const at = next.findIndex((p) => p.id === target)
    next.splice(at, 0, products.find((p) => p.id === dragId)!)
    onChange(next)
    setDragId(null)
  }

  const bad = (k: keyof FormErrors) => (errors[k] ? `input bad shake-${shake % 2}` : 'input')

  return (
    <div className="adm-split">
      <section className="adm-list">
        <div className="adm-tools">
          <div className="search adm-search">
            <label className="search-field">
              <Icon name="search" size={14} />
              <input
                value={q}
                placeholder="ค้นหาสินค้า"
                aria-label="ค้นหาสินค้า"
                onChange={(e) => {
                  setQ(e.target.value)
                  setOpen(true)
                }}
                onBlur={() => setTimeout(() => setOpen(false), 120)}
              />
            </label>
            {open && needle && (
              <div className="search-drop" role="listbox">
                {hits.slice(0, 3).map((p) => {
                  const at = p.name.toLowerCase().indexOf(needle)
                  return (
                    <div
                      key={p.id}
                      className="sug"
                      role="option"
                      aria-selected="false"
                      onMouseDown={() => {
                        pick(p)
                        setQ('')
                      }}
                    >
                      <span className="sug-name">
                        {p.name.slice(0, at)}
                        <b>{p.name.slice(at, at + needle.length)}</b>
                        {p.name.slice(at + needle.length)}
                      </span>
                      <span className="sug-cat">{catName(p.category)}</span>
                    </div>
                  )
                })}
                {hits.length === 0 && <div className="sug-empty">ไม่เจอ "{q.trim()}"</div>}
              </div>
            )}
          </div>

          <div
            className="chips scroll"
            onWheel={(e) => {
              e.currentTarget.scrollLeft += e.deltaY
            }}
          >
            {[{ id: 'all', name: 'ทั้งหมด' }, ...categories].map((c) => (
              <button key={c.id} type="button" className={cat === c.id ? 'chip on' : 'chip'} onClick={() => setCat(c.id)}>
                {c.name}
              </button>
            ))}
          </div>

          <button type="button" className="ulink adm-add" onClick={addNew}>
            <Icon name="plus" size={14} stroke={2.4} />
            เพิ่มสินค้า
          </button>
        </div>

        <div className="prow prow-head">
          <span />
          <span>สินค้า</span>
          <span>หมวด</span>
          <span className="right">ราคา</span>
          <span className="right">สต็อก</span>
          <span>ขาย</span>
        </div>

        <div className="adm-rows">
          {list.map((p, i) => (
            <div
              key={p.id}
              className={'prow' + (p.id === selected ? ' on' : '') + (p.id === dragId ? ' dragging' : '')}
              style={{ animationDelay: Math.min(i, 12) * 30 + 'ms' }}
              draggable
              onDragStart={() => setDragId(p.id)}
              onDragEnd={() => setDragId(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, p.id)}
              onClick={() => pick(p)}
            >
              <svg className="grip" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="9" cy="6" r="1.6" />
                <circle cx="15" cy="6" r="1.6" />
                <circle cx="9" cy="12" r="1.6" />
                <circle cx="15" cy="12" r="1.6" />
                <circle cx="9" cy="18" r="1.6" />
                <circle cx="15" cy="18" r="1.6" />
              </svg>
              <span className="prow-name">{p.name}</span>
              <span className="prow-cat">{catName(p.category)}</span>
              <span className="right mono">{baht(p.price)}</span>
              <span className="right mono prow-stock">{p.stock == null ? '∞' : p.stock}</span>
              <span onClick={(e) => e.stopPropagation()}>
                <Toggle on={p.enabled !== false} label={`เปิดขาย ${p.name}`} onChange={(on) => toggle(p, on)} />
              </span>
            </div>
          ))}
          {list.length === 0 && <p className="hist-empty">ยังไม่มีสินค้าในหมวดนี้</p>}
        </div>
      </section>

      <aside className="adm-form" key={selected ?? 'new'}>
        <div className="adm-form-body">
          <div className="adm-form-head">
            <h2>{selected ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}</h2>
            {selected && <span className="mono">id: {selected}</span>}
          </div>

          <div className="field-group">
            <label htmlFor="p-name">
              ชื่อสินค้า <span className="req">*</span>
            </label>
            <input id="p-name" className={bad('name')} value={form.name} onChange={(e) => update({ name: e.target.value })} />
            {errors.name && <span className="field-err">{errors.name}</span>}
          </div>

          <div className="field-group">
            <label htmlFor="p-desc">
              คำอธิบาย <span className="opt">ไม่บังคับ · โชว์ตอนกดดูสินค้า</span>
            </label>
            <textarea
              id="p-desc"
              className="input area"
              rows={2}
              maxLength={300}
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
            />
          </div>

          <div className="field-group">
            <label htmlFor="p-img">
              รูปสินค้า (ลิงก์) <span className="opt">ไม่บังคับ</span>
            </label>
            <div className="img-row">
              <div className="img-thumb">
                {form.image && !errors.image && /^https:\/\//.test(form.image) ? <img src={form.image} alt="" /> : 'รูป'}
              </div>
              <input
                id="p-img"
                className={bad('image') + ' mono'}
                value={form.image}
                placeholder="https://..."
                onChange={(e) => update({ image: e.target.value })}
              />
            </div>
            {errors.image && <span className="field-err">{errors.image}</span>}
          </div>

          <div className="two">
            <div className="field-group">
              <label htmlFor="p-cat">
                หมวด <span className="req">*</span>
              </label>
              <select id="p-cat" className="input" value={form.category} onChange={(e) => update({ category: e.target.value })}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label htmlFor="p-price">
                ราคา (บาท) <span className="req">*</span>
              </label>
              <input
                id="p-price"
                className={bad('price') + ' mono'}
                value={form.price}
                placeholder="เช่น 650"
                inputMode="numeric"
                onChange={(e) => update({ price: e.target.value })}
              />
              {errors.price && <span className="field-err">{errors.price}</span>}
            </div>
          </div>

          <fieldset className={errors.rewards ? 'box bad-box' : 'box'}>
            <legend>
              ของที่ได้เมื่อซื้อ <span className="req">*</span>
            </legend>
            <div className="rw rw-head">
              <span>ประเภท</span>
              <span>ชื่อ / รหัส</span>
              <span className="center">จำนวน</span>
              <span className="center">อายุ (วัน)</span>
              <span />
            </div>
            {form.rewards.map((r, i) => {
              const kind = rewardKinds.find((k) => k.kind === r.kind)!
              const exp = canExpire(r.kind)
              const rowBad = tried && (!r.value.trim() || !/^\d+$/.test(r.amount) || Number(r.amount) < 1)
              return (
                <div key={i} className="rw">
                  <select
                    className="input"
                    aria-label="ประเภทของ"
                    value={r.kind}
                    onChange={(e) => updateRow(i, { kind: e.target.value as RewardRow['kind'] })}
                  >
                    {rewardKinds.map((k) => (
                      <option key={k.kind} value={k.kind}>
                        {k.name}
                      </option>
                    ))}
                  </select>
                  <input
                    className={rowBad && !r.value.trim() ? 'input mono bad' : 'input mono'}
                    aria-label={kind.hint}
                    placeholder={kind.hint}
                    value={r.value}
                    onChange={(e) => updateRow(i, { value: e.target.value })}
                  />
                  <input
                    className={rowBad && (!/^\d+$/.test(r.amount) || Number(r.amount) < 1) ? 'input mono center bad' : 'input mono center'}
                    aria-label="จำนวน"
                    inputMode="numeric"
                    value={r.amount}
                    onChange={(e) => updateRow(i, { amount: e.target.value })}
                  />
                  <input
                    className="input mono center"
                    aria-label="อายุเป็นวัน เว้นว่างคือถาวร"
                    inputMode="numeric"
                    placeholder={exp ? 'ถาวร' : '—'}
                    disabled={!exp}
                    value={exp ? r.days : ''}
                    onChange={(e) => updateRow(i, { days: e.target.value.replace(/\D/g, '') })}
                  />
                  <button
                    type="button"
                    className="trash"
                    aria-label="ลบบรรทัดนี้"
                    onClick={() => update({ rewards: form.rewards.filter((_, j) => j !== i) })}
                  >
                    <Icon name="trash" size={15} stroke={1.9} />
                  </button>
                </div>
              )
            })}
            {errors.rewards && <span className="field-err">{errors.rewards}</span>}
            <span className="box-note">ใส่อายุได้เฉพาะ รถ ไอเทม VIP/ยศ ครบแล้วระบบดึงคืนเอง เงินกับพอยท์ดึงคืนไม่ได้</span>
            <div className="box-foot">
              <button
                type="button"
                className="ulink"
                onClick={() => update({ rewards: [...form.rewards, { kind: 'item', value: '', amount: '1', days: '' }] })}
              >
                <Icon name="plus" size={13} stroke={2.4} />
                เพิ่มของ
              </button>
              <span className="box-note">อายุว่าง = ได้ถาวร</span>
            </div>
          </fieldset>

          <fieldset className="box two">
            <legend>
              ลดราคา <span className="opt">ไม่บังคับ</span>
            </legend>
            <div className="field-group">
              <label htmlFor="p-sale">ราคาลด</label>
              <input
                id="p-sale"
                className={bad('salePrice') + ' mono sale'}
                inputMode="numeric"
                value={form.salePrice}
                onChange={(e) => update({ salePrice: e.target.value })}
              />
              {errors.salePrice && <span className="field-err">{errors.salePrice}</span>}
            </div>
            <div className="field-group">
              <label htmlFor="p-end">หมดเวลา</label>
              <DateTimeField
                id="p-end"
                value={form.saleEnds}
                align="right"
                defaultTime="23:59"
                onChange={(v) => update({ saleEnds: v })}
              />
            </div>
          </fieldset>

          <div className="two">
            <div className="field-group">
              <label htmlFor="p-stock">สต็อกทั้งหมด</label>
              <input
                id="p-stock"
                className={bad('stock') + ' mono'}
                inputMode="numeric"
                placeholder="ว่าง = ไม่จำกัด"
                value={form.stock}
                onChange={(e) => update({ stock: e.target.value })}
              />
              {errors.stock && <span className="field-err">{errors.stock}</span>}
            </div>
            <div className="field-group">
              <label htmlFor="p-limit">ซื้อได้ต่อคน</label>
              <input
                id="p-limit"
                className={bad('limit') + ' mono center'}
                inputMode="numeric"
                placeholder="ไม่จำกัด"
                value={form.limit}
                onChange={(e) => update({ limit: e.target.value })}
              />
              {errors.limit && <span className="field-err">{errors.limit}</span>}
            </div>
          </div>

          <label className="check">
            <input type="checkbox" checked={form.featured} onChange={(e) => update({ featured: e.target.checked })} />
            โชว์ในสินค้าแนะนำ
          </label>

          <div className="field-group">
            <label htmlFor="p-when">ตอนซื้อไม่ได้ (หมด / ซื้อครบ / ยังไม่เปิดขาย)</label>
            <select
              id="p-when"
              className="input"
              value={form.hideWhenBlocked ? 'hide' : 'show'}
              onChange={(e) => update({ hideWhenBlocked: e.target.value === 'hide' })}
            >
              <option value="show">โชว์เป็นสีเทา บอกเหตุผล</option>
              <option value="hide">ซ่อนจากหน้าร้าน</option>
            </select>
          </div>
        </div>

        <div className="adm-form-foot">
          {selected && (
            <button type="button" className="trash big" aria-label="ลบสินค้านี้" onClick={() => setConfirmDelete(true)}>
              <Icon name="trash" size={17} stroke={1.9} />
            </button>
          )}
          <span className="form-msg">{errCount > 0 && `ยังกรอกไม่ครบ ${errCount} จุด`}</span>
          <button type="button" className="btn btn-solid btn-md save-btn" onClick={save}>
            บันทึก
          </button>
        </div>
      </aside>

      {confirmDelete && (
        <ConfirmDialog
          danger
          title={`ลบ ${form.name}?`}
          desc="สินค้าจะหายจากหน้าร้านทันที ประวัติการซื้อเก่ายังอยู่ ย้อนกลับไม่ได้"
          confirmLabel="ลบสินค้า"
          onConfirm={remove}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
